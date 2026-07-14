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

/**
 * Persistence ports — the storage-agnostic repository contracts the app and
 * domain depend on. Infra implements them over SQLite (`infra/persistence`); the
 * UI never touches a raw database handle. See docs/PERSISTENCE.md.
 */

import type {CombatState} from 'core/combat';

export type ColorScheme = 'system' | 'light' | 'dark';

/** Global, app-wide settings (per-character edition is derived, not stored here). */
export interface Settings {
    useFifthEdition: boolean;
    showAnimations: boolean;
    colorScheme: ColorScheme;
    /** Multiplier applied to every font size (1 = default). */
    fontScale: number;
}

export const DEFAULT_SETTINGS: Settings = {
    useFifthEdition: false,
    showAnimations: true,
    colorScheme: 'system',
    fontScale: 1,
};

export interface SettingsRepository {
    get(): Promise<Settings>;
    set<K extends keyof Settings>(key: K, value: Settings[K]): Promise<void>;
    reset(): Promise<void>;
}

/** Aggregate dice-roll statistics (global). */
export interface Statistics {
    sum: number;
    largestDieRoll: number;
    largestSum: number;
    totals: {
        diceRolled: number;
        hitRolls: number;
        skillChecks: number;
        effectRolls: number;
        normalDamage: {rolls: number; stun: number; body: number};
        killingDamage: {rolls: number; stun: number; body: number};
        knockback: number;
        hitLocations: {
            head: number;
            hands: number;
            arms: number;
            shoulders: number;
            chest: number;
            stomach: number;
            vitals: number;
            thighs: number;
            legs: number;
            feet: number;
        };
    };
    distributions: {one: number; two: number; three: number; four: number; five: number; six: number};
}

export const DEFAULT_STATISTICS: Statistics = {
    sum: 0,
    largestDieRoll: 0,
    largestSum: 0,
    totals: {
        diceRolled: 0,
        hitRolls: 0,
        skillChecks: 0,
        effectRolls: 0,
        normalDamage: {rolls: 0, stun: 0, body: 0},
        killingDamage: {rolls: 0, stun: 0, body: 0},
        knockback: 0,
        hitLocations: {head: 0, hands: 0, arms: 0, shoulders: 0, chest: 0, stomach: 0, vitals: 0, thighs: 0, legs: 0, feet: 0},
    },
    distributions: {one: 0, two: 0, three: 0, four: 0, five: 0, six: 0},
};

export interface StatisticsRepository {
    get(): Promise<Statistics>;
    save(statistics: Statistics): Promise<void>;
    reset(): Promise<void>;
}

/** A stored randomly-generated character. */
export interface RandomHero {
    name?: string;
    [field: string]: unknown;
}

export interface RandomHeroRepository {
    get(): Promise<RandomHero | null>;
    set(hero: RandomHero): Promise<void>;
    rename(name: string): Promise<void>;
    clear(): Promise<void>;
}

/** Scalar app state (schema/migration flags, version, misc). */
export interface AppStateStore {
    get(key: string): Promise<string | null>;
    set(key: string, value: string): Promise<void>;
}

export type Edition = '5E' | '6E';

/** The parsed/normalized HERO Designer character document (portrait not embedded). */
export type CharacterDocument = Record<string, unknown>;

/** Portrait bytes to store, or `null` to clear. */
export interface PortraitInput {
    bytes: Uint8Array;
    mime: string;
}

/** The list-screen row — lifted columns only, no document parse. */
export interface CharacterSummary {
    id: string;
    name: string;
    player: string | null;
    edition: Edition;
    isActive: boolean;
    /** `file://` URI for `<Image>`, or null. */
    portraitUri: string | null;
}

/** A full character: summary + the parsed document. */
export interface Character extends CharacterSummary {
    filename: string | null;
    updatedAt: string;
    document: CharacterDocument;
}

/** Input to `save` — the caller provides lifted fields + a portrait-free document. */
export interface SaveCharacter {
    id: string;
    name: string;
    player: string | null;
    edition: Edition;
    filename?: string | null;
    document: CharacterDocument;
    /** Present + object → store new portrait; present + null → clear; absent → keep existing. */
    portrait?: PortraitInput | null;
}

export interface CharacterRepository {
    list(): Promise<CharacterSummary[]>;
    get(id: string): Promise<Character | null>;
    save(character: SaveCharacter): Promise<void>;
    delete(id: string): Promise<void>;
    setActive(id: string): Promise<void>;
    getActive(): Promise<Character | null>;
}

/**
 * Live combat state (health, combat values, phase chart) per character. Absent
 * until a character is first tracked; {@link get} returns null so the caller can
 * seed it from the character's derived maximums. Rows are removed with their
 * character (ON DELETE CASCADE).
 */
export interface CombatStateRepository {
    get(characterId: string): Promise<CombatState | null>;
    save(characterId: string, state: CombatState): Promise<void>;
    clear(characterId: string): Promise<void>;
}

/** Binary blob store — portrait bytes as files on disk, referenced by id. */
export interface ImageStore {
    put(bytes: Uint8Array, mime: string): Promise<string>;
    uri(imageId: string): string;
    delete(imageId: string): Promise<void>;
}
