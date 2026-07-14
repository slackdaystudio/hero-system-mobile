// Copyright 2018-Present Philip J. Guinchard
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//    http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

import type {CharacterDocument, RandomHero, Settings, Statistics} from 'core/ports';
import type {FileSystem} from '../files/fileSystem';
import type {SqlDatabase} from '../persistence/driver/sqlDatabase';
import type {LegacyCharacter, LegacySnapshot, LegacySource} from './legacySource';

/** The legacy AsyncStorage seam (device: @react-native-async-storage/async-storage). */
export interface LegacyKeyValueStore {
    getItem(key: string): Promise<string | null>;
    multiRemove(keys: string[]): Promise<void>;
}

/** Unzips an archive's bytes into `{ entryName: utf8Text }` (device: fflate). */
export type Unzip = (bytes: Uint8Array) => Record<string, string>;

export interface LegacySourceDeps {
    keyValue: LegacyKeyValueStore;
    fileSystem: FileSystem;
    unzip: Unzip;
    /** Directory holding the legacy `.hsmc` files (DocumentDirectory/character). */
    characterDir: string;
    /** The old `hsm.db` opened via the driver, or null when it can't be read. */
    legacyDb: SqlDatabase | null;
}

const HSMC = '.hsmc';

// AsyncStorage keys the legacy app owned; cleared once migrated. `.hsmc` files on
// disk are left in place — they are a harmless backup, not read at runtime.
const KEYS_TO_CLEAR = ['character', 'characters', 'hero', 'version', 'appSettings', 'statistics', 'showSecondaryCharacteristics', 'combat'];

const parseJson = <T>(raw: string | null): T | null => {
    if (raw === null) {
        return null;
    }
    try {
        return JSON.parse(raw) as T;
    } catch {
        return null;
    }
};

/**
 * The real {@link LegacySource}: characters come from the authoritative `.hsmc`
 * files on disk (AsyncStorage supplies which file is in which slot and which is
 * active); settings/statistics from the old `hsm.db`; random-hero/version from
 * AsyncStorage (see docs/PERSISTENCE.md). Everything is reached through ports, so
 * this whole assembly is exercised in node with a real zip + real SQLite.
 */
export function createLegacySource(deps: LegacySourceDeps): LegacySource {
    return {
        read: async (): Promise<LegacySnapshot> => {
            const {settings, statistics} = await readSettingsAndStatistics(deps);

            return {
                characters: await readCharacters(deps),
                settings,
                statistics,
                randomHero: parseJson<RandomHero>(await deps.keyValue.getItem('hero')),
                version: await deps.keyValue.getItem('version'),
            };
        },
        clear: async (): Promise<void> => {
            await deps.keyValue.multiRemove(KEYS_TO_CLEAR);
        },
    };
}

async function readCharacters(deps: LegacySourceDeps): Promise<LegacyCharacter[]> {
    const {keyValue, fileSystem, unzip, characterDir} = deps;

    // Slot/active pointers from AsyncStorage. `characters` is a slot->char map,
    // `character` is the active one; we only need their filenames here.
    const slotMap = parseJson<Record<string, {filename?: string} | null>>(await keyValue.getItem('characters')) ?? {};
    const activeChar = parseJson<{filename?: string}>(await keyValue.getItem('character'));
    const activeFilename = typeof activeChar?.filename === 'string' ? activeChar.filename : null;

    const slotByFilename = new Map<string, number>();
    for (const [slot, char] of Object.entries(slotMap)) {
        if (char !== null && typeof char.filename === 'string') {
            slotByFilename.set(char.filename, Number(slot));
        }
    }

    const byFilename = new Map<string, LegacyCharacter>();

    // Primary source: the authoritative `.hsmc` files (each a zip of `<name>.json`).
    const files = (await fileSystem.readdir(characterDir).catch(() => [] as string[])).filter((name) => name.toLowerCase().endsWith(HSMC));
    for (const file of files) {
        try {
            const entries = unzip(await fileSystem.readFile(`${characterDir}/${file}`));
            const raw = entries[`${file.slice(0, -HSMC.length)}.json`] ?? Object.values(entries)[0] ?? null;
            const document = parseJson<CharacterDocument>(raw);
            if (document !== null) {
                byFilename.set(file, {document, filename: file, slot: slotByFilename.get(file) ?? null, active: activeFilename === file});
            }
        } catch {
            // Unreadable/corrupt .hsmc — skip; a later AsyncStorage copy may still cover it.
        }
    }

    // Fallback: AsyncStorage character objects whose `.hsmc` is missing on disk,
    // so nothing is lost even if the file was never written / was deleted. The
    // per-slot map entries are the canonical stored objects, so they take
    // precedence over the (possibly thinner) active pointer.
    for (const char of [...Object.values(slotMap), activeChar]) {
        const filename = (char as {filename?: unknown} | null)?.filename;
        if (typeof filename === 'string' && !byFilename.has(filename)) {
            byFilename.set(filename, {
                document: char as CharacterDocument,
                filename,
                slot: slotByFilename.get(filename) ?? null,
                active: activeFilename === filename,
            });
        }
    }

    return [...byFilename.values()];
}

async function readSettingsAndStatistics(deps: LegacySourceDeps): Promise<{settings: Partial<Settings> | null; statistics: Statistics | null}> {
    if (deps.legacyDb !== null) {
        return {settings: readLegacySettings(deps.legacyDb), statistics: readLegacyStatistics(deps.legacyDb)};
    }

    // No hsm.db — fall back to any legacy AsyncStorage caches, else defaults.
    return {
        settings: parseJson<Partial<Settings>>(await deps.keyValue.getItem('appSettings')),
        statistics: parseJson<Statistics>(await deps.keyValue.getItem('statistics')),
    };
}

function readLegacySettings(db: SqlDatabase): Partial<Settings> | null {
    try {
        const row = db.execute('SELECT useFifthEdition, playSounds, onlyDiceSounds, showAnimations, increaseEntropy, colorScheme FROM settings WHERE loadout = ?', ['default']).rows[0];
        if (row === undefined) {
            return null;
        }
        return {
            useFifthEdition: row.useFifthEdition === 1,
            playSounds: row.playSounds === 1,
            onlyDiceSounds: row.onlyDiceSounds === 1,
            showAnimations: row.showAnimations === 1,
            increaseEntropy: row.increaseEntropy === 1,
            colorScheme: (row.colorScheme as Settings['colorScheme']) ?? 'system',
        };
    } catch {
        return null; // no legacy `settings` table
    }
}

function readLegacyStatistics(db: SqlDatabase): Statistics | null {
    try {
        const row = db.execute('SELECT stats FROM statistics WHERE loadout = ?', ['default']).rows[0];
        return row === undefined ? null : parseJson<Statistics>(row.stats as string);
    } catch {
        return null; // no legacy `statistics` table
    }
}
