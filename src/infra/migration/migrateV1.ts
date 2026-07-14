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

import {heroDesignerCharacter} from 'core/hero';
import type {CharacterDocument, PortraitInput, Settings} from 'core/ports';
import type {Repositories} from '../persistence/repositories';
import type {LegacySource} from './legacySource';

/** `app_state` key whose presence means the one-time v1 import already ran. */
export const MIGRATED_V1_FLAG = 'migrated_v1';
/** `app_state` key holding the last-seen app version, carried over from legacy. */
export const VERSION_KEY = 'version';

export interface MigrationResult {
    /** False when the flag was already set (nothing done). */
    migrated: boolean;
    characters: number;
    portraits: number;
}

/** Decode a legacy `data:<mime>;base64,<data>` portrait into bytes, or undefined. */
const decodeDataUri = (value: unknown): PortraitInput | undefined => {
    if (typeof value !== 'string') {
        return undefined;
    }

    const match = /^data:([^;]+);base64,(.*)$/s.exec(value);
    if (match === null) {
        return undefined;
    }

    const [, mime, base64] = match;
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
        bytes[i] = binary.charCodeAt(i);
    }

    return {bytes, mime};
};

/** Lift the embedded portrait out of the document; return the portrait-free doc. */
const stripPortrait = (document: CharacterDocument): {document: CharacterDocument; portrait: PortraitInput | undefined} => {
    const {portrait, ...rest} = document as Record<string, unknown>;

    return {document: rest, portrait: decodeDataUri(portrait)};
};

/**
 * The one-time AsyncStorage/`hsm.db`→SQLite import (see docs/PERSISTENCE.md).
 * Idempotent and guarded by {@link MIGRATED_V1_FLAG}: for each legacy character it
 * lifts the base64 portrait to a file, strips it, derives the edition, and writes
 * the row; then copies settings/statistics/random-hero/version and clears the old
 * keys. Runs against the real repositories — the only fake in tests is the source.
 */
export async function migrateV1(repos: Repositories, source: LegacySource, now: () => string = () => new Date().toISOString()): Promise<MigrationResult> {
    if ((await repos.appState.get(MIGRATED_V1_FLAG)) !== null) {
        return {migrated: false, characters: 0, portraits: 0};
    }

    const snapshot = await source.read();
    let portraits = 0;
    let activeId: string | null = null;

    for (const [index, legacy] of snapshot.characters.entries()) {
        const {document, portrait} = stripPortrait(legacy.document);
        const info = (document.characterInfo ?? {}) as {characterName?: string; playerName?: string};
        const id = legacy.filename ?? `character-${index}`;

        await repos.characters.save({
            id,
            name: info.characterName ?? 'Unnamed',
            player: info.playerName ?? null,
            edition: heroDesignerCharacter.isFifth(document) ? '5E' : '6E',
            slot: legacy.slot,
            filename: legacy.filename,
            document,
            portrait,
        });

        if (portrait !== undefined) {
            portraits++;
        }
        if (legacy.active) {
            activeId = id;
        }
    }

    // setActive after all rows exist so the one-active partial index never trips.
    if (activeId !== null) {
        await repos.characters.setActive(activeId);
    }

    if (snapshot.settings !== null) {
        const setSetting = repos.settings.set.bind(repos.settings) as (key: keyof Settings, value: unknown) => Promise<void>;
        for (const [key, value] of Object.entries(snapshot.settings)) {
            await setSetting(key as keyof Settings, value);
        }
    }
    if (snapshot.statistics !== null) {
        await repos.statistics.save(snapshot.statistics);
    }
    if (snapshot.randomHero !== null) {
        await repos.randomHero.set(snapshot.randomHero);
    }
    if (snapshot.version !== null) {
        await repos.appState.set(VERSION_KEY, snapshot.version);
    }

    await repos.appState.set(MIGRATED_V1_FLAG, now());
    await source.clear();

    return {migrated: true, characters: snapshot.characters.length, portraits};
}
