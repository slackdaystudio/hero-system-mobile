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
import {archetypesFor, pick, type Archetype} from './allocate';
import {buildCharacteristics} from './characteristics';
import {effectLabel} from './describe';
import {attachComplications, complicationSetsFor, type ComplicationSet} from './complications';
import {attachPowerset, powersetsFor, type Powerset} from './powerset';
import {attachSkillset, playerDefinedSlots, structuredSkillset, type PlayerDefinedSlot, type StructuredSkillset} from './skillset';
import {POWER_LEVELS, powerLevel, type Edition, type PowerLevel} from './powerLevel';

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
    /**
     * The skills the player has named, by {@link PlayerDefinedSlot.slot} — `LANGUAGES#0` → "French".
     * A slot with no answer stays "Player Defined"; `{}` means none are answered.
     *
     * Lives on the recipe because the recipe is the whole character: a rebuild regenerates the
     * skills bucket from the tables, so an answer kept anywhere else would be erased by the next
     * re-roll.
     *
     * Required, though *stored* recipes written before players could answer have no such key —
     * {@link parseRecipe} normalises those to `{}`, so every recipe in memory has one.
     */
    readonly skills: Readonly<Record<string, string>>;
};

/** Everything a recipe names, resolved against the current data. */
export interface ResolvedRecipe {
    readonly level: PowerLevel;
    readonly archetype: Archetype;
    readonly powerset: Powerset;
    readonly skillset: StructuredSkillset;
    readonly complications: ComplicationSet;
}

/**
 * The name a roll gives a character when the player hasn't picked one: "Fire Brick".
 *
 * An effect of "Other" names no effect, so it contributes no word and the character is just its
 * archetype — "Brick", never "Other Brick" (see {@link effectLabel}).
 */
export const autoName = (recipe: Pick<CharacterRecipe, 'specialFx' | 'archetype'>): string => {
    const effect = effectLabel(recipe.specialFx);

    return effect === null ? recipe.archetype : `${effect} ${recipe.archetype}`;
};

/** Resolve every reference, or null if any no longer exists. */
export function resolveRecipe(recipe: CharacterRecipe): ResolvedRecipe | null {
    const level = POWER_LEVELS.find((candidate) => candidate.id === recipe.level);

    if (level === undefined) {
        return null; // an unknown level means we can't even ask which edition's data to look in
    }

    // Every reference resolves in the recipe's OWN edition. A 6E recipe naming "Brick" means the 6E
    // Brick, whose spread and powersets are nothing like the 5E one's.
    const {edition} = level;
    const archetype = archetypesFor(edition).find((candidate) => candidate.name === recipe.archetype);
    const powerset = powersetsFor(recipe.archetype, edition).find((candidate) => candidate.label === recipe.powerset);
    const skillset = structuredSkillset(recipe.profession, edition);
    const complications = complicationSetsFor(edition).find((candidate) => candidate.label === recipe.complications);

    if (archetype === undefined || powerset === undefined || skillset === undefined || complications === undefined) {
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

    const skills = parseNamedSkills(candidate.skills);

    if (skills === null) {
        return null;
    }

    const recipe = {...Object.fromEntries(fields.map((field) => [field, candidate[field]])), skills} as CharacterRecipe;

    return resolveRecipe(recipe) === null ? null : recipe;
}

/**
 * The player's skill answers, or null if the value is there but malformed.
 *
 * Absent is fine and means "none named" — recipes predate this field. A slot naming a skill this
 * build no longer has is kept rather than dropped: professions come and go as data is authored, and
 * silently forgetting what someone typed is worse than carrying a key nothing reads.
 */
function parseNamedSkills(value: unknown): Record<string, string> | null {
    if (value === undefined || value === null) {
        return {};
    }

    if (typeof value !== 'object' || Array.isArray(value)) {
        return null;
    }

    const entries = Object.entries(value as Record<string, unknown>);

    return entries.every(([slot, name]) => slot !== '' && isNonEmptyString(name)) ? (Object.fromEntries(entries) as Record<string, string>) : null;
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
 * The edition a recipe is read in. Everything it names resolves in this and **only** this.
 *
 * Both editions carry the same eleven archetypes, the same eleven professions and even the same
 * powerset labels, so a lookup done in the wrong one succeeds and returns the wrong data rather
 * than failing (see `__tests__/editions.test.ts`). Nothing that reads the tables on a recipe's
 * behalf may leave the edition to a default.
 *
 * Throws on an unknown level, which cannot reach here: a recipe whose level names no edition never
 * resolves, so {@link parseRecipe} rejects it and the character is never editable in the first place.
 */
export const recipeEdition = (recipe: CharacterRecipe): Edition => powerLevel(recipe.level).edition;

/** The skills this character's profession leaves to the player to name, in its own edition. */
export function namedSkillSlots(recipe: CharacterRecipe): PlayerDefinedSlot[] {
    // Via resolveRecipe rather than a bare structuredSkillset: it looks the profession up in the
    // recipe's edition, and returns null for exactly the recipes that have no editable skills.
    const resolved = resolveRecipe(recipe);

    return resolved === null ? [] : playerDefinedSlots(resolved.skillset);
}

/**
 * Answer a player-defined skill — "French" for the Soldier's language.
 *
 * Blank clears it back to "Player Defined" rather than storing an empty subject. Never touches the
 * character's name: naming a skill is not naming a character, so this doesn't route through
 * {@link reviseRecipe}'s auto-name rule.
 */
export function nameSkill(recipe: CharacterRecipe, slot: string, name: string): CharacterRecipe {
    const skills = {...recipe.skills};
    const trimmed = name.trim();

    if (trimmed === '') {
        delete skills[slot];
    } else {
        skills[slot] = trimmed;
    }

    return {...recipe, skills};
}

/**
 * Re-roll onto a new archetype. The old powerset belonged to the old archetype, so a new one is
 * drawn; skills and complications are named independently and carry over untouched.
 */
export function rerollArchetype(rng: Rng, recipe: CharacterRecipe, archetype: string): CharacterRecipe {
    const powersets = powersetsFor(archetype, recipeEdition(recipe));

    if (powersets.length === 0) {
        throw new Error(`No powerset for archetype: ${archetype}`);
    }

    return reviseRecipe(recipe, {archetype, powerset: pick(rng, powersets).label});
}

/** Draw a different powerset for the archetype the character already has, from its own edition. */
export const rerollPowerset = (rng: Rng, recipe: CharacterRecipe): CharacterRecipe =>
    reviseRecipe(recipe, {powerset: pick(rng, powersetsFor(recipe.archetype, recipeEdition(recipe))).label});

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

    return attachComplications(attachSkillset(attachPowerset(characteristics, resolved.powerset), resolved.skillset, recipe.skills), resolved.complications);
}
