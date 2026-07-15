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
 * Generate a random character (docs/RANDOM_CHARACTER.md).
 *
 * Pure: takes the `Rng` port and returns a `ParsedCharacter` — the `.hdc`-shaped *input*. The
 * caller runs it through `heroDesignerCharacter.getCharacter()` and saves it exactly as an
 * imported `.hdc` is, so a generated character is indistinguishable from an imported one.
 *
 * **Incomplete while phase 3 is in progress.** A character currently carries characteristics
 * and powers — 225 of a Low Powered build's 250 — but no skills and no complications: those
 * data sets are still legacy prose. {@link generateRandomCharacter} reports what it spent, so
 * callers can be honest about it rather than implying a finished character.
 */
import type {ParsedCharacter} from 'core/hero';
import type {Rng} from 'core/ports';
import {ARCHETYPES_5E, allocate, pick, SKILLSETS, SPECIAL_FX, type Archetype, type Budget} from './allocate';
import {buildCharacteristics} from './characteristics';
import {attachPowerset, powersetsFor, type Powerset} from './powerset';
import {LOW_POWERED_5E, type PowerLevel} from './powerLevel';

export interface GeneratedCharacter {
    readonly parsed: ParsedCharacter;
    readonly name: string;
    readonly archetype: string;
    readonly powerset: string;
    readonly specialFx: string;
    readonly level: PowerLevel;
    readonly budget: Budget;
    /** What is actually built so far — see the module note. Powers + characteristics only. */
    readonly spent: number;
}

/** Archetypes with at least one structured powerset. The rest cannot be generated yet. */
export const generatableArchetypes = (): Archetype[] => ARCHETYPES_5E.filter((archetype) => powersetsFor(archetype.name).length > 0);

/**
 * The skillsets an authored powerset can actually absorb.
 *
 * `Warrior` costs 28 where every other skillset costs 25, which moves the powers balance by −3
 * — and **no powerset is sized for it, in this data or the legacy data**: `100` characteristics
 * `+ 125` powerset `+ 28` skills is 253, not 250, for every archetype. Either the powersets need
 * a −3 variant or that 28 is wrong; it is one of the open data questions.
 *
 * Until then the generator picks only skillsets that keep the budget whole, rather than rolling
 * a character that quietly misses its total by 3. Skills are not built yet anyway, so this
 * currently costs nothing but a name.
 */
const SKILLSET_COST_THAT_FITS = 25;

export const fittableSkillsets = (): typeof SKILLSETS => SKILLSETS.filter((skillset) => skillset.cost === SKILLSET_COST_THAT_FITS);

/**
 * A random character at the given level. Throws if nothing is authored for that level yet,
 * rather than quietly handing back an empty character.
 */
export function generateRandomCharacter(rng: Rng, level: PowerLevel = LOW_POWERED_5E): GeneratedCharacter {
    const candidates = generatableArchetypes();

    if (candidates.length === 0) {
        throw new Error('No archetype has a structured powerset yet');
    }

    const archetype = pick(rng, candidates);
    const powerset: Powerset = pick(rng, powersetsFor(archetype.name));
    const skillset = pick(rng, fittableSkillsets());
    const specialFx = pick(rng, SPECIAL_FX);
    const name = `${specialFx} ${archetype.name}`;

    const parsed = attachPowerset(buildCharacteristics(archetype.characteristics, level.template, name), powerset);
    const budget = allocate(level, archetype, skillset);

    return {
        parsed,
        name,
        archetype: archetype.name,
        powerset: powerset.label,
        specialFx,
        level,
        budget,
        // Skills and complications are not built yet, so they are not counted as spent.
        spent: budget.characteristics + budget.powers,
    };
}
