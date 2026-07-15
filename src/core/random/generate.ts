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
 * A character now carries characteristics, powers, skills and complications — the full 250 of a
 * Low Powered build. {@link generateRandomCharacter} still reports what it spent, so a caller can
 * say so rather than assert it.
 */
import type {ParsedCharacter} from 'core/hero';
import type {Rng} from 'core/ports';
import {ARCHETYPES_5E, allocate, pick, SKILLSETS, SPECIAL_FX, type Archetype, type Budget} from './allocate';
import {buildCharacteristics} from './characteristics';
import {attachComplications, COMPLICATION_SETS_5E, type ComplicationSet} from './complications';
import {attachPowerset, powersetsFor, type Powerset} from './powerset';
import {attachSkillset, structuredSkillset} from './skillset';
import {LOW_POWERED_5E, type PowerLevel} from './powerLevel';

export interface GeneratedCharacter {
    readonly parsed: ParsedCharacter;
    readonly name: string;
    readonly archetype: string;
    readonly powerset: string;
    readonly complications: string;
    readonly skillset: string;
    readonly specialFx: string;
    readonly level: PowerLevel;
    readonly budget: Budget;
    /** What is actually built so far — see the module note. Skills are still missing. */
    readonly spent: number;
}

/** Archetypes with at least one structured powerset. The rest cannot be generated yet. */
export const generatableArchetypes = (): Archetype[] => ARCHETYPES_5E.filter((archetype) => powersetsFor(archetype.name).length > 0);

/**
 * The skillsets that can actually be rolled: those with a **structured** set, priced at the 25 the
 * powersets are sized against.
 *
 * `Warrior` once stated 28 — the only one that did — and at 28 it fit nothing. Phil corrected it
 * to 25, and structuring settled the question: its content really is dearer (a 5-point CSL,
 * Defense Maneuver, Lightning Reflexes), so it reaches 25 only by dropping Concealment to a
 * Familiarity. The 25 holds, but only just.
 */
const SKILLSET_COST_THAT_FITS = 25;

export const fittableSkillsets = (): typeof SKILLSETS =>
    SKILLSETS.filter((skillset) => skillset.cost === SKILLSET_COST_THAT_FITS && structuredSkillset(skillset.profession) !== undefined);

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
    const complications: ComplicationSet = pick(rng, COMPLICATION_SETS_5E);
    const skillset = pick(rng, fittableSkillsets());
    const specialFx = pick(rng, SPECIAL_FX);
    const name = `${specialFx} ${archetype.name}`;

    const built = attachSkillset(attachPowerset(buildCharacteristics(archetype.characteristics, level.template, name), powerset), structuredSkillset(skillset.profession)!);
    const parsed = attachComplications(built, complications);
    const budget = allocate(level, archetype, skillset);

    return {
        parsed,
        name,
        archetype: archetype.name,
        powerset: powerset.label,
        complications: complications.label,
        skillset: skillset.profession,
        specialFx,
        level,
        budget,
        // Complications are taken at the fixed limit and fund the build rather than being spent
        // out of it, so they are not counted here.
        spent: budget.characteristics + budget.powers + budget.skills,
    };
}
