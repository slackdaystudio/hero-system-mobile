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

import AsyncStorage from '@react-native-async-storage/async-storage';
import {strToU8, zipSync} from 'fflate';
import {documentDirectoryPath, nativeFileSystem} from 'infra/files/nativeFileSystem';
import {createOpSqliteDatabase} from 'infra/persistence/driver/opSqliteDatabase';
import type {SqlDatabase} from 'infra/persistence/driver/sqlDatabase';
import {MIGRATED_V1_FLAG} from 'infra/migration/migrateV1';

/**
 * DEV ONLY. Simulates a legacy install so the real migration can be watched on a
 * device that has no legacy data (a fresh sideload). It writes fake legacy data
 * to exactly the places {@link createLegacySource} reads — `.hsmc` files, the
 * AsyncStorage pointers, and the old `hsm.db` — then clears the runtime store and
 * the migrated_v1 flag so migrateV1 (next in the bootstrap) re-imports it.
 *
 * Toggle with SIMULATE_LEGACY_DATA in deviceRepositories.ts.
 */

// 1×1 PNG embedded as a data URI, exactly as the legacy exporter stored portraits.
const PORTRAIT_DATA_URI = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==';

interface FakeLegacyCharacter {
    basename: string;
    slot: number;
    active: boolean;
    document: Record<string, unknown>;
}

const FAKE_CHARACTERS: FakeLegacyCharacter[] = [
    {
        basename: 'seeker',
        slot: 0,
        active: true,
        document: {
            characterInfo: {characterName: 'Seeker', playerName: 'Phil'},
            characteristics: [{definition: '(Hero System 6th Edition)'}],
            powers: [{name: 'Martial Arts'}, {name: 'Gadget Pool'}, {name: 'Combat Sense'}],
            portrait: PORTRAIT_DATA_URI,
            filename: 'seeker.hsmc',
        },
    },
    {
        basename: 'marksman',
        slot: 2,
        active: false,
        document: {
            characterInfo: {characterName: 'Marksman', playerName: 'GM'},
            characteristics: [{definition: '(Hero System Fifth Edition Revised)'}],
            powers: [{name: 'Find Weakness'}, {name: 'Rapid Attack'}],
            filename: 'marksman.hsmc',
        },
    },
];

export async function plantDevLegacyData(runtimeDb: SqlDatabase): Promise<void> {
    const fs = nativeFileSystem();
    const characterDir = `${documentDirectoryPath()}/character`;

    // 1. Authoritative `.hsmc` files (each a zip of `<name>.json`), as the legacy app wrote them.
    await fs.mkdirp(characterDir);
    const slotMap: Record<string, {filename: string}> = {};
    let activeFilename = `${FAKE_CHARACTERS[0].basename}.hsmc`;
    for (const character of FAKE_CHARACTERS) {
        const filename = `${character.basename}.hsmc`;
        await fs.writeFile(`${characterDir}/${filename}`, zipSync({[`${character.basename}.json`]: strToU8(JSON.stringify(character.document))}));
        slotMap[String(character.slot)] = {filename};
        if (character.active) {
            activeFilename = filename;
        }
    }

    // 2. Legacy AsyncStorage: slot map, active pointer, random hero, version.
    await AsyncStorage.multiSet([
        ['characters', JSON.stringify(slotMap)],
        ['character', JSON.stringify({filename: activeFilename})],
        ['hero', JSON.stringify({name: 'Generated Hero'})],
        ['version', '2.3.0'],
    ]);

    // 3. Legacy hsm.db: columnar settings + statistics JSON, keyed by loadout.
    const legacyDb = createOpSqliteDatabase({name: 'hsm.db'});
    try {
        legacyDb.execute('CREATE TABLE IF NOT EXISTS settings (loadout TEXT PRIMARY KEY, useFifthEdition INTEGER, playSounds INTEGER, onlyDiceSounds INTEGER, showAnimations INTEGER, increaseEntropy INTEGER, colorScheme TEXT)');
        legacyDb.execute('INSERT OR REPLACE INTO settings VALUES (?, ?, ?, ?, ?, ?, ?)', ['default', 0, 1, 0, 1, 1, 'dark']);
        legacyDb.execute('CREATE TABLE IF NOT EXISTS statistics (loadout TEXT PRIMARY KEY, stats TEXT)');
        legacyDb.execute('INSERT OR REPLACE INTO statistics VALUES (?, ?)', ['default', JSON.stringify({sum: 1234, largestDieRoll: 6, largestSum: 42})]);
    } finally {
        legacyDb.close();
    }

    // 4. Reset the runtime so the migration re-runs: clear existing characters and
    // the migrated_v1 flag. Orphaned portraits are removed by the startup sweep.
    runtimeDb.execute('DELETE FROM characters');
    runtimeDb.execute('DELETE FROM app_state WHERE key = ?', [MIGRATED_V1_FLAG]);
}
