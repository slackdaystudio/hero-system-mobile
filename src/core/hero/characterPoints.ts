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
 * The character's total build points, edition-aware — the number the 6E1 "Character Point
 * Guidelines" table classifies. **The editions quote points differently** (the trap
 * `core/random/powerLevel` documents): 5E disadvantages fund the build, 6E complications do not.
 *
 * ```
 * 5E:  base + disadvantages
 * 6E:  base
 * ```
 *
 * Experience is deliberately excluded: the tier is the *campaign* power level, set before play, not
 * a total that creeps upward as a character earns points (that is shown separately, beside the base).
 */
export function startingTotal(config: BasicConfiguration, isFifth: boolean): number {
    return isFifth ? config.basePoints + config.disadPoints : config.basePoints;
}

/**
 * The campaign power-level tiers, from the HERO System 6th Edition Volume 1 "Character Point
 * Guidelines" table (6E1 34). Each entry's suggested total is used as a floor, so a character between
 * two anchors takes the lower tier's name. Highest first — `powerTier` returns the first match.
 *
 * Both editions are classified against this 6E table. 5E's own scale runs roughly a tier lower
 * (`powerLevel` puts 5E Standard Superheroic at 350, where 6E puts it at 400), so a 5E character
 * reads one step conservative here. If a 5ER-specific ladder is wanted, split this by edition.
 */
const POWER_TIERS: ReadonlyArray<{readonly min: number; readonly label: string}> = [
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
    {min: 0, label: 'Standard Normal'},
];

/** The campaign power-level name for an (edition-aware) starting total — see `POWER_TIERS`. */
export function powerTier(total: number): string {
    return (POWER_TIERS.find((tier) => total >= tier.min) ?? POWER_TIERS[POWER_TIERS.length - 1]).label;
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

    return {base: config.basePoints, experience: config.experience, tier: powerTier(startingTotal(config, isFifth))};
}
