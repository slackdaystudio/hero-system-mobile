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
 * The edition fork.
 *
 * The generator was hardcoded to the 5E data — `ARCHETYPES_5E`, the 5E powersets, the 5E skillsets,
 * the 5E complication packages — so the whole 6E dataset existed and nothing could reach it. Every
 * lookup now goes through the `PowerLevel`'s edition, and a recipe resolves in its **own**.
 *
 * That last part is the one that matters: a 6E recipe naming "Brick" means the *6E* Brick, whose
 * spread and powerset are nothing like the 5E one's.
 */
import {heroDesignerCharacter} from 'core/hero';
import type {Rng} from 'core/ports';
import type {Obj} from 'core/traits';
import {archetypesFor} from '../allocate';
import {complicationSetsFor} from '../complications';
import {fittableSkillsets, generatableArchetypes, generateRandomCharacter, rollRecipe} from '../generate';
import {LOW_POWERED_5E, STANDARD_6E} from '../powerLevel';
import {powersetsFor} from '../powerset';
import {buildRecipe} from '../generate';
import {parseRecipe, resolveRecipe} from '../recipe';
import {isBalanced} from '../ruleOfX';
import {ruleOfXStats} from '../ruleOfXStats';
import {skillsetsFor} from '../skillset';

const seededRng = (seed: number): Rng => {
    let state = (seed * 2654435761) % 4294967296;

    return {
        next: (min: number, max: number): number => {
            state = (state * 1664525 + 1013904223) % 4294967296;

            return min + (Math.floor(state / 65536) % (max - min + 1));
        },
    };
};

const built = (character: {parsed: unknown}): Obj => heroDesignerCharacter.getCharacter(character.parsed as never) as unknown as Obj;

describe('the edition fork', () => {
    it('rolls a 5E character at 5E Low Powered', () => {
        for (let seed = 0; seed < 8; seed++) {
            const generated = generateRandomCharacter(seededRng(seed), LOW_POWERED_5E);

            expect(heroDesignerCharacter.isFifth(built(generated))).toBe(true);
            expect(generated.spent).toBe(LOW_POWERED_5E.total);
            expect(generated.recipe.level).toBe('5e-low');
        }
    });

    /**
     * The point of the whole exercise. Before this, `generateRandomCharacter(rng, STANDARD_6E)`
     * built a 6E-templated character out of **5E data**: 5E spreads (PD 2, SPD 2 — 6E figures
     * nothing), 5E powersets, and 5E complications worth 100 against a limit of 75.
     */
    it('rolls a 6E character at 6E Standard', () => {
        for (let seed = 0; seed < 8; seed++) {
            const generated = generateRandomCharacter(seededRng(seed), STANDARD_6E);

            expect(heroDesignerCharacter.isFifth(built(generated))).toBe(false);
            expect(generated.spent).toBe(STANDARD_6E.total);
            expect(generated.recipe.level).toBe('6e-standard');
        }
    });

    it('lands every 6E roll inside the Rule of X', () => {
        // The archetypes were each tuned against Phil's model; a rolled combination has to hold too.
        for (let seed = 0; seed < 12; seed++) {
            const generated = generateRandomCharacter(seededRng(seed), STANDARD_6E);
            const stats = ruleOfXStats(built(generated));

            expect({name: generated.recipe.name, balanced: isBalanced(stats)}).toEqual({name: generated.recipe.name, balanced: true});
        }
    });

    describe('every lookup follows the level', () => {
        it('offers each edition its own archetypes', () => {
            expect(generatableArchetypes('5e')).toEqual(archetypesFor('5e'));
            expect(generatableArchetypes('6e')).toEqual(archetypesFor('6e'));
            expect(generatableArchetypes('6e')).toHaveLength(11);

            // Same names, different characters. 6E buys OCV outright; 5E figures it and has COM.
            expect(archetypesFor('6e').map((a) => a.name).sort()).toEqual(archetypesFor('5e').map((a) => a.name).sort());
            expect(archetypesFor('6e').every((a) => a.characteristics.ocv !== undefined && a.characteristics.com === undefined)).toBe(true);
            expect(archetypesFor('5e').every((a) => a.characteristics.com !== undefined && a.characteristics.ocv === undefined)).toBe(true);
        });

        it('offers each edition its own powersets', () => {
            // Same label, different powerset. The 5E Brick wears ARMOR (a 5E power); the 6E one wears
            // Resistant Protection, because 6E deleted Armor.
            expect(powersetsFor('Brick', '6e')[0].label).toBe(powersetsFor('Brick', '5e')[0].label);
            expect(powersetsFor('Brick', '6e')[0]).not.toBe(powersetsFor('Brick', '5e')[0]);
            expect(JSON.stringify(powersetsFor('Brick', '6e')[0])).not.toBe(JSON.stringify(powersetsFor('Brick', '5e')[0]));
        });

        it('offers each edition its own skillsets', () => {
            // Same eleven professions; 25 points in 5E and 50 in 6E.
            expect(fittableSkillsets('6e')).toEqual(skillsetsFor('6e'));
            expect(fittableSkillsets('5e').map((s) => s.profession).sort()).toEqual(fittableSkillsets('6e').map((s) => s.profession).sort());
        });

        it('offers each edition its own complications', () => {
            // Same four labels, different totals — 100 against a 5E Low Powered limit, 75 against 6E
            // Standard's — and the 5E ones carry the NCM that 6E abolished.
            expect(complicationSetsFor('6e')).not.toBe(complicationSetsFor('5e'));
            expect(complicationSetsFor('6e').map((s) => s.label)).toEqual(complicationSetsFor('5e').map((s) => s.label));
        });
    });

    describe('a recipe resolves in its own edition', () => {
        it('reads a 6E Brick as the 6E Brick', () => {
            const recipe = rollRecipe(seededRng(3), STANDARD_6E);
            const sixth = {...recipe, archetype: 'Brick', powerset: powersetsFor('Brick', '6e')[0].label};

            expect(resolveRecipe(sixth)?.archetype.characteristics.str).toBe(60); // the 6E Brick
            expect(resolveRecipe(sixth)?.powerset.label).toBe('Powerhouse');
        });

        /**
         * **`level` is the only thing that disambiguates a recipe**, and that is worth knowing.
         *
         * The two editions share *every* name: the eleven archetypes, the eleven professions, the
         * four complication labels, and even the powerset labels ("Powerhouse", "Energy Blaster").
         * Nothing in a recipe except its level says which edition it means — so a recipe whose level
         * was altered would resolve happily and build a different character rather than fail.
         *
         * That is fine because the level is written at roll time and never guessed. But it means no
         * cross-edition validation is possible from the names alone, and nothing here should pretend
         * otherwise.
         */
        it('reads the same names as different characters, edition by edition', () => {
            const sixth = {...rollRecipe(seededRng(3), STANDARD_6E), archetype: 'Brick', powerset: 'Powerhouse'};
            const fifth = {...sixth, level: '5e-low', profession: 'Soldier', complications: 'Hunted Hero'};

            // Both resolve — every name is shared — and to different data.
            expect(resolveRecipe(sixth)?.archetype.characteristics.str).toBe(60); // the 6E Brick
            expect(resolveRecipe(fifth)?.archetype.characteristics.str).toBe(50); // the 5E Brick
            expect(resolveRecipe(sixth)?.powerset).not.toBe(resolveRecipe(fifth)?.powerset);
            expect(parseRecipe(sixth)).not.toBeNull();
            expect(parseRecipe(fifth)).not.toBeNull();
        });

        it('rejects a recipe whose level names no edition at all', () => {
            const recipe = rollRecipe(seededRng(3), STANDARD_6E);

            // Without a level there is no edition to resolve in, so nothing else can be checked.
            expect(resolveRecipe({...recipe, level: '6e-mythic'})).toBeNull();
            expect(parseRecipe({...recipe, level: '6e-mythic'})).toBeNull();
        });

        it('builds a 6E recipe into a 6E character', () => {
            const recipe = rollRecipe(seededRng(5), STANDARD_6E);
            const character = heroDesignerCharacter.getCharacter(buildRecipe(recipe).parsed as never) as unknown as Obj;

            expect(heroDesignerCharacter.isFifth(character)).toBe(false);
            expect(buildRecipe(recipe).level).toBe(STANDARD_6E);
        });

        it('takes the level from the recipe when rebuilding, so an edit stays in its edition', () => {
            const recipe = rollRecipe(seededRng(7), STANDARD_6E);

            // buildRecipe defaults its level from recipe.level — a 6E character re-rolled by the
            // editor must not quietly rebuild as 5E.
            expect(buildRecipe(recipe).level.edition).toBe('6e');
            expect(buildRecipe(rollRecipe(seededRng(7), LOW_POWERED_5E)).level.edition).toBe('5e');
        });
    });
});
