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
 * The recipe a generated character was rolled from, and how to rebuild one from it.
 *
 * A generated character is saved as an ordinary HERO Designer document — there is nowhere in that
 * format to record "this was a Fire Brick who's a Soldier", and inventing a slot would put
 * non-HERO data into engine output. So the recipe is stored beside the document (its own column)
 * and the character is rebuilt from it whenever the player changes something.
 *
 * **Every field is a name, not an object.** The recipe outlives the build that wrote it, so it
 * refers to data by id and {@link parseRecipe} re-resolves each reference against what exists
 * *now*. A recipe naming an archetype a later build dropped fails to resolve and the character
 * simply stops being editable — it still opens and still renders, because the document is what the
 * sheet reads. Storing the resolved objects instead would have frozen a copy of the data at roll
 * time and let it drift from the tables silently.
 */
import type {ParsedCharacter} from 'core/hero';
import type {Rng} from 'core/ports';
import {ARCHETYPES_5E, pick, type Archetype} from './allocate';
import {buildCharacteristics} from './characteristics';
import {attachComplications, COMPLICATION_SETS_5E, type ComplicationSet} from './complications';
import {attachPowerset, powersetsFor, type Powerset} from './powerset';
import {attachSkillset, structuredSkillset, type StructuredSkillset} from './skillset';
import {POWER_LEVELS, type PowerLevel} from './powerLevel';

/**
 * A character's whole build, by name. A `type` rather than an `interface` so it satisfies the
 * port's `StoredRecipe` (`Record<string, unknown>`) without a cast — an interface has no implicit
 * index signature.
 */
export type CharacterRecipe = {
    /** {@link PowerLevel.id} — e.g. `5e-low`. */
    readonly level: string;
    /** {@link Archetype.name} — dictates characteristics, and which powersets are available. */
    readonly archetype: string;
    /** {@link Powerset.label} — must belong to `archetype`. */
    readonly powerset: string;
    /** {@link StructuredSkillset.profession} — the 25-point skills bucket. */
    readonly profession: string;
    /** {@link ComplicationSet.label} — always taken at the level's full limit. */
    readonly complications: string;
    /** Cosmetic: the first half of an auto name. Nothing else reads it. */
    readonly specialFx: string;
    readonly name: string;
};

/** Everything a recipe names, resolved against the current data. */
export interface ResolvedRecipe {
    readonly level: PowerLevel;
    readonly archetype: Archetype;
    readonly powerset: Powerset;
    readonly skillset: StructuredSkillset;
    readonly complications: ComplicationSet;
}

/** The name a roll gives a character when the player hasn't picked one: "Fire Brick". */
export const autoName = (recipe: Pick<CharacterRecipe, 'specialFx' | 'archetype'>): string => `${recipe.specialFx} ${recipe.archetype}`;

/** Resolve every reference, or null if any no longer exists. */
export function resolveRecipe(recipe: CharacterRecipe): ResolvedRecipe | null {
    const level = POWER_LEVELS.find((candidate) => candidate.id === recipe.level);
    const archetype = ARCHETYPES_5E.find((candidate) => candidate.name === recipe.archetype);
    const powerset = powersetsFor(recipe.archetype).find((candidate) => candidate.label === recipe.powerset);
    const skillset = structuredSkillset(recipe.profession);
    const complications = COMPLICATION_SETS_5E.find((candidate) => candidate.label === recipe.complications);

    if (level === undefined || archetype === undefined || powerset === undefined || skillset === undefined || complications === undefined) {
        return null;
    }

    return {level, archetype, powerset, skillset, complications};
}

const isNonEmptyString = (value: unknown): value is string => typeof value === 'string' && value !== '';

/**
 * Validate a recipe read back out of storage — shape *and* that every reference still resolves.
 *
 * Returns null rather than throwing: an unreadable recipe means "not editable", which is a state
 * the UI already has to handle for imports. It is never a reason to fail to open a character.
 */
export function parseRecipe(value: unknown): CharacterRecipe | null {
    if (value === null || typeof value !== 'object') {
        return null;
    }

    const candidate = value as Record<string, unknown>;
    const fields = ['level', 'archetype', 'powerset', 'profession', 'complications', 'specialFx', 'name'] as const;

    if (!fields.every((field) => isNonEmptyString(candidate[field]))) {
        return null;
    }

    const recipe = Object.fromEntries(fields.map((field) => [field, candidate[field]])) as CharacterRecipe;

    return resolveRecipe(recipe) === null ? null : recipe;
}

/**
 * Apply changes, carrying the name only if the player actually chose it.
 *
 * An auto name follows its recipe — re-roll a Fire Brick as a Speedster and it becomes a Fire
 * Speedster. A name the player typed is theirs and survives. "Did they choose it?" is answered by
 * asking whether the current name is still exactly what the *current* recipe would auto-generate,
 * which needs no extra stored flag. Renaming a character to precisely "Fire Brick" makes it auto
 * again, which is a harmless thing to be wrong about.
 */
export function reviseRecipe(recipe: CharacterRecipe, changes: Partial<Omit<CharacterRecipe, 'name'>>): CharacterRecipe {
    const revised = {...recipe, ...changes};

    return {...revised, name: recipe.name === autoName(recipe) ? autoName(revised) : recipe.name};
}

/** Rename outright — always the player's choice, so it never auto-generates. */
export const renameRecipe = (recipe: CharacterRecipe, name: string): CharacterRecipe => ({...recipe, name});

/**
 * Re-roll onto a new archetype. The old powerset belonged to the old archetype, so a new one is
 * drawn; skills and complications are named independently and carry over untouched.
 */
export function rerollArchetype(rng: Rng, recipe: CharacterRecipe, archetype: string): CharacterRecipe {
    const powersets = powersetsFor(archetype);

    if (powersets.length === 0) {
        throw new Error(`No powerset for archetype: ${archetype}`);
    }

    return reviseRecipe(recipe, {archetype, powerset: pick(rng, powersets).label});
}

/** Draw a different powerset for the archetype the character already has. */
export const rerollPowerset = (rng: Rng, recipe: CharacterRecipe): CharacterRecipe => reviseRecipe(recipe, {powerset: pick(rng, powersetsFor(recipe.archetype)).label});

/** Swap the 25-point skills bucket. Powers and characteristics are untouched. */
export const changeProfession = (recipe: CharacterRecipe, profession: string): CharacterRecipe => reviseRecipe(recipe, {profession});

/** Cosmetic — only reaches the character at all if the name is still auto. */
export const changeSpecialFx = (recipe: CharacterRecipe, specialFx: string): CharacterRecipe => reviseRecipe(recipe, {specialFx});

/**
 * Build the `.hdc`-shaped character a recipe describes — the same pipeline a fresh roll runs, so a
 * rebuilt character is indistinguishable from a first-time one. Pure and deterministic: the same
 * recipe always yields the same character, which is what makes an edit previewable and repeatable.
 *
 * Throws on an unresolvable recipe; call {@link parseRecipe} first (storage always does).
 */
export function buildFromRecipe(recipe: CharacterRecipe): ParsedCharacter {
    const resolved = resolveRecipe(recipe);

    if (resolved === null) {
        throw new Error(`Recipe no longer resolves: ${recipe.archetype} / ${recipe.powerset} / ${recipe.profession}`);
    }

    const characteristics = buildCharacteristics(resolved.archetype.characteristics, resolved.level.template, recipe.name);

    return attachComplications(attachSkillset(attachPowerset(characteristics, resolved.powerset), resolved.skillset), resolved.complications);
}
