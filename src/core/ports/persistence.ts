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
    /**
     * The Quick Pick switcher's slots, by grid position (index 0–8). `null` is an unpinned
     * placeholder — the grid fills those live from the recent list. A curated launcher, distinct
     * from {@link CharacterSummary.isActive}, which stays a single character. Persistence does no
     * shape validation on read, so the app normalizes this (length, dedup) before trusting it.
     */
    pinnedCharacterIds: (string | null)[];
}

export const DEFAULT_SETTINGS: Settings = {
    useFifthEdition: false,
    showAnimations: true,
    colorScheme: 'system',
    fontScale: 1,
    pinnedCharacterIds: [],
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

/**
 * Where a character came from. Only a generated one is editable: an imported `.hdc` is a faithful
 * view of a file the player owns, and the app has no business rewriting it.
 */
export type CharacterOrigin = 'generated' | 'imported';

/**
 * The generator's recipe, round-tripped as JSON so a generated character can be re-rolled.
 *
 * Opaque here for the same reason {@link CharacterDocument} is: persistence stores it and hands it
 * back, and has no stake in its shape. `core/random` owns that (its `CharacterRecipe`, which
 * validates on the way back in — typing it here would make ports depend on the module that already
 * depends on ports).
 */
export type StoredRecipe = Record<string, unknown>;

/** Portrait bytes to store, or `null` to clear. */
export interface PortraitInput {
    bytes: Uint8Array;
    mime: string;
}

/**
 * Which part of a portrait a square shows, as fractions of the cropped-away overflow.
 *
 * `{x: 0.5, y: 0.5}` is dead centre — what `<Image resizeMode="cover">` does by itself, and what
 * every portrait did before this existed. `{y: 0}` pins the top edge, `{y: 1}` the bottom. Only the
 * axis that actually overflows has any effect: a tall image in a square has nothing to move
 * sideways.
 *
 * Non-destructive by design — the stored bytes are never touched, so re-framing is always free and
 * always reversible.
 */
export interface PortraitFocus {
    x: number;
    y: number;
    /**
     * Zoom, where 1 is "cover" — the whole square filled by the least of the image that fills it.
     * Never below 1: zooming out past cover would letterbox, which is a worse picture rather than a
     * framing choice.
     *
     * At 1 only the long axis has any overflow, so only one of x/y does anything. Zoomed in, both do.
     */
    scale: number;
}

/** The centre crop every portrait gets until someone says otherwise. */
export const CENTERED_PORTRAIT: PortraitFocus = {x: 0.5, y: 0.5, scale: 1};

/** The list-screen row — lifted columns only, no document parse. */
export interface CharacterSummary {
    id: string;
    name: string;
    player: string | null;
    edition: Edition;
    isActive: boolean;
    /** `file://` URI for `<Image>`, or null. */
    portraitUri: string | null;
    /**
     * Null when never framed, which reads as centred. Lifted onto the summary because the list and
     * Home draw portraits too — framing that only applied on the sheet would be a bug you'd notice
     * on every other screen.
     */
    portraitFocus: PortraitFocus | null;
}

/** A full character: summary + the parsed document. */
export interface Character extends CharacterSummary {
    filename: string | null;
    updatedAt: string;
    document: CharacterDocument;
    origin: CharacterOrigin;
    /** The recipe it was rolled from; null for imports, and for rolls predating the recipe column. */
    recipe: StoredRecipe | null;
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
    /**
     * Present → store; absent → keep existing, and a **new** row defaults to 'imported' (a caller
     * that hasn't thought about provenance is not handing us something to let the player rewrite).
     *
     * Both producers state it: import writes 'imported', so re-importing a real `.hdc` over a
     * generated id correctly demotes it. Defaulting to 'imported' on *every* save would instead
     * strip a generated character's edit rights the first time it was renamed.
     */
    origin?: CharacterOrigin;
    /** Present → store; absent → keep existing (so a rename needn't restate the recipe). */
    recipe?: StoredRecipe | null;
}

export interface CharacterRepository {
    list(): Promise<CharacterSummary[]>;
    get(id: string): Promise<Character | null>;
    save(character: SaveCharacter): Promise<void>;
    delete(id: string): Promise<void>;
    setActive(id: string): Promise<void>;
    getActive(): Promise<Character | null>;
    /**
     * Frame a portrait; `null` resets it to centred.
     *
     * Its own operation rather than a field on `save`, like {@link setActive} and
     * {@link markAccessed}: moving a crop is two numbers, and rewriting a whole character document
     * to do it would be both wasteful and a chance to get something else wrong.
     */
    setPortraitFocus(id: string, focus: PortraitFocus | null): Promise<void>;
    /** Record that a character was just opened (drives the Home "recent" list). */
    markAccessed(id: string): Promise<void>;
    /** Recently opened characters (falling back to recently updated), most-recent first. */
    recent(limit?: number): Promise<CharacterSummary[]>;
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
