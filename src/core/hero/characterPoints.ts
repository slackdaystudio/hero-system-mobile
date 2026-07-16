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

import type {CharacterDocument} from 'core/ports';

/**
 * The declared point configuration HERO Designer writes into a `.hdc` (the `<BASIC_CONFIGURATION>`
 * block): the points a character was *built on*, as opposed to what the engine re-derives by summing
 * costs. **`getCharacter` drops this**, so it is preserved onto the stored document at the
 * import/generate boundary — which means it is absent on characters imported before that shipped and
 * on migrated legacy rows. Callers treat "absent" as unknown and show nothing.
 */
export interface BasicConfiguration {
    /**
     * "Base Points" from the HD character config. Quoted differently per edition (the same trap
     * `core/random/powerLevel` documents): in 6E this already is the campaign total, in 5E it is the
     * pre-disadvantage base.
     */
    basePoints: number;
    /** The disadvantage (5E) / complication (6E) allowance. Funds the build in 5E; grants nothing in 6E. */
    disadPoints: number;
    experience: number;
}

const isFiniteNumber = (value: unknown): value is number => typeof value === 'number' && Number.isFinite(value);

/** Read the declared config off a stored document, or null when it was never preserved / is malformed. */
export function readBasicConfiguration(document: CharacterDocument): BasicConfiguration | null {
    const config = (document as {basicConfiguration?: unknown}).basicConfiguration;
    if (config === null || typeof config !== 'object') {
        return null;
    }

    const {basePoints, disadPoints, experience} = config as Record<string, unknown>;
    if (!isFiniteNumber(basePoints) || !isFiniteNumber(disadPoints) || !isFiniteNumber(experience)) {
        return null;
    }

    return {basePoints, disadPoints, experience};
}

/**
 * The campaign power-level tiers, keyed on **base points** — the column both rulebooks classify by.
 * Base is the right key, not the total: the 5ER table gives Very Powerful Heroic and Low-Powered
 * Superheroic the *same* 250 total and separates them only by base (125 vs 150). Base is monotonic
 * and collision-free in both tables, so it disambiguates where total cannot.
 *
 * The two editions run on different scales and get their own ladder:
 *   - 5E from the HERO System 5th Edition Revised "Character Types" table (base-points column).
 *   - 6E from the HERO System 6th Edition Volume 1 "Character Point Guidelines" table (6E1 34); 6E
 *     complications grant no points, so its base equals its total.
 *
 * Each entry's anchor is a floor: a character between two anchors takes the lower tier's name.
 * Highest first — the classifier returns the first match, falling through to the last (the floor).
 */
type Ladder = ReadonlyArray<{readonly min: number; readonly label: string}>;

const POWER_TIERS_5E: Ladder = [
    {min: 500, label: 'Cosmically Powerful Superheroic'},
    {min: 400, label: 'Very High-Powered Superheroic'},
    {min: 300, label: 'High-Powered Superheroic'},
    {min: 200, label: 'Standard Superheroic'},
    {min: 150, label: 'Low-Powered Superheroic'},
    {min: 125, label: 'Very Powerful Heroic'},
    {min: 100, label: 'Powerful Heroic'},
    {min: 75, label: 'Standard Heroic'},
    {min: 50, label: 'Competent Normal'},
    {min: 25, label: 'Skilled Normal'},
    {min: 0, label: 'Standard Normal'},
    {min: Number.NEGATIVE_INFINITY, label: 'Incompetent Normal'},
];

const POWER_TIERS_6E: Ladder = [
    {min: 750, label: 'Cosmically Powerful Superheroic'},
    {min: 650, label: 'Very High-Powered Superheroic'},
    {min: 500, label: 'High-Powered Superheroic'},
    {min: 400, label: 'Standard Superheroic'},
    {min: 300, label: 'Low-Powered Superheroic'},
    {min: 275, label: 'Very Powerful Heroic'},
    {min: 225, label: 'Powerful Heroic'},
    {min: 175, label: 'Standard Heroic'},
    {min: 100, label: 'Competent Normal'},
    {min: 50, label: 'Skilled Normal'},
    {min: Number.NEGATIVE_INFINITY, label: 'Standard Normal'},
];

/**
 * The campaign power-level name for a base-point count, per the edition's ladder.
 *
 * Base points, not the disadvantage-inclusive total: it is the campaign's *starting* level (set
 * before play) and the only key that separates same-total tiers. Experience is likewise excluded —
 * the tier does not creep upward as a character earns points (that is shown separately, beside base).
 */
export function powerTier(basePoints: number, isFifth: boolean): string {
    const ladder = isFifth ? POWER_TIERS_5E : POWER_TIERS_6E;
    return (ladder.find((tier) => basePoints >= tier.min) ?? ladder[ladder.length - 1]).label;
}

/** What the nameplate shows: the declared base + experience, and the campaign tier those points fall in. */
export interface PointSummary {
    base: number;
    experience: number;
    tier: string;
}

/** Derive the nameplate's points/tier from a stored document, or null when the config was never preserved. */
export function pointSummary(document: CharacterDocument, isFifth: boolean): PointSummary | null {
    const config = readBasicConfiguration(document);
    if (config === null) {
        return null;
    }

    return {base: config.basePoints, experience: config.experience, tier: powerTier(config.basePoints, isFifth)};
}
