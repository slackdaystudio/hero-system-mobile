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
 * The budget allocator (phase 2 of docs/RANDOM_CHARACTER.md) — the strict cutoffs the original
 * used, as independent sub-budgets:
 *
 * ```
 * characteristics   the archetype's spread, costed by the engine (93–150; the line moves)
 * skills            the skillset's cost
 * powers            the balance — whatever is left
 * complications     the level's limit, always taken in full
 * ```
 *
 * Each bucket is small and independent, which is what makes generation tractable: hitting a
 * 250-point total by rolling dice and hoping is a bad search; filling a known balance is not.
 *
 * The cutoffs are not invented here — they are latent in the legacy data. `powers = total −
 * chars − skills` reproduces its powerset sizes exactly (Energy Projector 125, Patriot 100,
 * Speedster 100, Brick 75), which is good evidence this was the original's design too.
 */
import {heroDesignerCharacter} from 'core/hero';
import type {Rng} from 'core/ports';
import archetypeData from '../data/random/archetypes.5e.json';
import archetypeData6E from '../data/random/archetypes.6e.json';
import skillsetData from '../data/random/skillsets.json';
import complicationData from '../data/random/complications.5e.json';
import specialFxData from '../data/random/specialfx.json';
import {characterTraitDecorator} from 'core/traits';
import {buildCharacteristics, characteristicsCost, type CharacteristicSpread} from './characteristics';
import {attachSkillset, skillsetsFor, type StructuredSkillset} from './skillset';
import type {PowerLevel} from './powerLevel';

type Obj = Record<string, any>;

export interface Archetype {
    readonly name: string;
    readonly characteristics: CharacteristicSpread;
    /**
     * The legacy prose's own powerset listing — reference material the 5E structured powersets were
     * authored *from*, not something the generator reads. Absent on 6E, which has no legacy prose:
     * its archetypes were authored against the corpus and the Rule of X instead.
     */
    readonly powersets?: ReadonlyArray<{powers: ReadonlyArray<{cost: number | string; power: string}>; powersCost: number}>;
}

export interface Skillset {
    readonly profession: string;
    readonly skills: readonly string[];
    readonly cost: number;
}

export interface ComplicationPackage {
    readonly disadvantages: ReadonlyArray<{cost: number; description: string}>;
}

export const ARCHETYPES_5E = (archetypeData as unknown as {archtypes: Archetype[]}).archtypes;
/** Authored, not lifted — hence the correct spelling of the key. See archetypes.6e.json. */
export const ARCHETYPES_6E = (archetypeData6E as unknown as {archetypes: Archetype[]}).archetypes;

/** The archetypes for an edition. */
export const archetypesFor = (edition: string): Archetype[] => (edition === '6e' ? ARCHETYPES_6E : ARCHETYPES_5E);
export const SKILLSETS = (skillsetData as unknown as {skillsets: Skillset[]}).skillsets;
export const COMPLICATIONS_5E = (complicationData as unknown as {disadvantagePackages: ComplicationPackage[]}).disadvantagePackages;
export const SPECIAL_FX = (specialFxData as unknown as {effects: string[]}).effects;

export interface Budget {
    readonly level: PowerLevel;
    readonly archetype: string;
    readonly skillset: string;
    /** Costed by the engine from the archetype's spread — never a declared number. */
    readonly characteristics: number;
    readonly skills: number;
    /** The balance. What the powerset must be flexed to fill. */
    readonly powers: number;
    /** Always the level's limit. */
    readonly complications: number;
}

/** The characteristics bucket: what this archetype's spread costs at this level's edition. */
export function characteristicsBudget(archetype: Archetype, level: PowerLevel): number {
    const character = heroDesignerCharacter.getCharacter(buildCharacteristics(archetype.characteristics, level.template, archetype.name)) as unknown as Obj;

    return characteristicsCost(character);
}

/**
 * What a profession's skills cost, priced by the engine rather than declared.
 *
 * The legacy `skillsets.json` states a cost of 25 — a 5E number, and the last declared cost left in
 * the allocator. 6E's sets are 50. Rather than add a second declared number to drift from a second
 * set of data, the structured set is built and priced, exactly as {@link characteristicsBudget}
 * prices a spread.
 *
 * A skill's cost doesn't depend on the characteristics carrying it (only its *roll* does), so this
 * prices against an empty spread.
 */
export function skillsBudget(skillset: StructuredSkillset, level: PowerLevel): number {
    const character = heroDesignerCharacter.getCharacter(attachSkillset(buildCharacteristics({}, level.template), skillset)) as unknown as Obj;

    return (['skills', 'perks', 'talents'] as const).reduce(
        (total, key) =>
            total +
            ((character[key] ?? []) as Obj[]).reduce((sum, trait) => {
                try {
                    return sum + characterTraitDecorator.decorate(trait, key, () => character).realCost();
                } catch {
                    return sum;
                }
            }, 0),
        0,
    );
}

/** Split a level's total across the buckets. Powers take the balance. */
export function allocate(level: PowerLevel, archetype: Archetype, skillset: StructuredSkillset): Budget {
    const characteristics = characteristicsBudget(archetype, level);
    const skills = skillsBudget(skillset, level);

    return {
        level,
        archetype: archetype.name,
        skillset: skillset.profession,
        characteristics,
        skills,
        powers: level.total - characteristics - skills,
        complications: level.limit,
    };
}

export const pick = <T>(rng: Rng, items: readonly T[]): T => items[rng.next(0, items.length - 1)];

/** A randomly selected archetype/skillset, allocated in the level's own edition. Deterministic for a seeded `Rng`. */
export function randomBudget(rng: Rng, level: PowerLevel): Budget {
    return allocate(level, pick(rng, archetypesFor(level.edition)), pick(rng, skillsetsFor(level.edition)));
}

/** Total points a complication package is worth — must equal the level's limit. */
export const complicationsTotal = (complications: ComplicationPackage): number =>
    complications.disadvantages.reduce((total, disadvantage) => total + disadvantage.cost, 0);
