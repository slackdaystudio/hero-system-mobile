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
 *
 * Rolling happens in two steps — {@link rollRecipe} then {@link buildRecipe} — because editing a
 * saved character is the second step on its own. See `core/random/recipe`.
 */
import type {ParsedCharacter} from 'core/hero';
import type {Rng} from 'core/ports';
import {allocate, archetypesFor, pick, SPECIAL_FX, type Archetype, type Budget} from './allocate';
import {complicationSetsFor} from './complications';
import {powersetsFor} from './powerset';
import {skillsetsFor, structuredSkillset, type StructuredSkillset} from './skillset';
import {autoName, buildFromRecipe, type CharacterRecipe} from './recipe';
import {LOW_POWERED_5E, powerLevel, type Edition, type PowerLevel} from './powerLevel';

export interface GeneratedCharacter {
    readonly parsed: ParsedCharacter;
    /**
     * What it was rolled from, and the only record of it: the saved document is an ordinary HERO
     * Designer character and has nowhere to say "Fire Brick, Soldier". Persisted alongside so the
     * character can be re-rolled later (see `core/random/recipe`).
     */
    readonly recipe: CharacterRecipe;
    readonly level: PowerLevel;
    readonly budget: Budget;
    /** The full total — characteristics + powers + skills. Complications fund the build. */
    readonly spent: number;
}

/** Archetypes with at least one structured powerset in this edition. The rest cannot be generated. */
export const generatableArchetypes = (edition: Edition = '5e'): Archetype[] =>
    archetypesFor(edition).filter((archetype) => powersetsFor(archetype.name, edition).length > 0);

/**
 * The skillsets that can be rolled in an edition — the structured ones, which is all of them now.
 *
 * This used to filter the legacy prose by a declared cost of 25, because `Warrior` once stated 28
 * and at 28 it fit nothing. Structuring settled that: the sets are priced by the engine and the
 * budget is whatever they cost (25 in 5E, 50 in 6E), so there is nothing left to disagree about.
 */
export const fittableSkillsets = (edition: Edition = '5e'): StructuredSkillset[] => skillsetsFor(edition);

/**
 * Roll a build. Throws if nothing is authored for that level yet, rather than quietly handing back
 * an empty character.
 *
 * Rolling and building are separate so that editing an existing character is the *same* operation:
 * revise the recipe, rebuild. There is no second code path that a fix could be applied to only one
 * of.
 */
export function rollRecipe(rng: Rng, level: PowerLevel = LOW_POWERED_5E): CharacterRecipe {
    const candidates = generatableArchetypes(level.edition);

    if (candidates.length === 0) {
        throw new Error(`No archetype has a structured powerset for ${level.name}`);
    }

    const archetype = pick(rng, candidates);
    const specialFx = pick(rng, SPECIAL_FX);

    return {
        level: level.id,
        archetype: archetype.name,
        powerset: pick(rng, powersetsFor(archetype.name, level.edition)).label,
        profession: pick(rng, fittableSkillsets(level.edition)).profession,
        complications: pick(rng, complicationSetsFor(level.edition)).label,
        specialFx,
        name: autoName({specialFx, archetype: archetype.name}),
        // A fresh roll answers nothing for the player — see CharacterRecipe.skills.
        skills: {},
    };
}

/** What a recipe costs, per bucket — the allocator's view of it, in the recipe's own edition. */
export function budgetFor(recipe: CharacterRecipe, level: PowerLevel): Budget {
    const archetype = archetypesFor(level.edition).find((candidate) => candidate.name === recipe.archetype)!;
    const skillset = structuredSkillset(recipe.profession, level.edition)!;

    return allocate(level, archetype, skillset);
}

/** A random character at the given level: roll a recipe, then build exactly what it describes. */
export function generateRandomCharacter(rng: Rng, level: PowerLevel = LOW_POWERED_5E): GeneratedCharacter {
    const recipe = rollRecipe(rng, level);

    return buildRecipe(recipe, level);
}

/** Build a character from a recipe — used by a fresh roll and by every edit alike. */
export function buildRecipe(recipe: CharacterRecipe, level: PowerLevel = powerLevel(recipe.level)): GeneratedCharacter {
    const budget = budgetFor(recipe, level);

    return {
        parsed: buildFromRecipe(recipe),
        recipe,
        level,
        budget,
        // Complications are taken at the fixed limit and fund the build rather than being spent
        // out of it, so they are not counted here.
        spent: budget.characteristics + budget.powers + budget.skills,
    };
}
