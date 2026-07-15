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

/** The generator itself — docs/RANDOM_CHARACTER.md. */
import {heroDesignerCharacter} from 'core/hero';
import {characterTraitDecorator} from 'core/traits';
import type {Rng} from 'core/ports';
import {fittableSkillsets, generatableArchetypes, generateRandomCharacter} from '../generate';
import {SKILLSETS} from '../allocate';
import {powersetsFor} from '../powerset';
import {LOW_POWERED_5E} from '../powerLevel';

type Obj = Record<string, any>;

const seededRng = (seed: number): Rng => {
    let state = seed % 4294967296;

    return {
        next: (min: number, max: number): number => {
            state = (state * 1664525 + 1013904223) % 4294967296;

            return min + (state % (max - min + 1));
        },
    };
};

const characterFrom = (seed: number): Obj => heroDesignerCharacter.getCharacter(generateRandomCharacter(seededRng(seed)).parsed) as unknown as Obj;

describe('generateRandomCharacter', () => {
    it('only offers archetypes that have a structured powerset', () => {
        const names = generatableArchetypes().map((archetype) => archetype.name);

        expect(names).toEqual(['Energy Projector', 'Gadgeteer', 'Mentalist', 'Metamorph', 'Mystic', 'Powered Armor', 'Speedster', 'Brick']);
        expect(names.every((name) => powersetsFor(name).length > 0)).toBe(true);
    });

    it('is deterministic for a seeded Rng', () => {
        expect(generateRandomCharacter(seededRng(7)).name).toBe(generateRandomCharacter(seededRng(7)).name);
    });

    it('names the character from its special effect and archetype', () => {
        const generated = generateRandomCharacter(seededRng(3));

        expect(generated.name).toBe(`${generated.specialFx} ${generated.archetype}`);
        expect(generated.name).not.toContain('undefined');
    });

    it('reports what it actually built, not what a finished character would cost', () => {
        // Honest about phase 3 being unfinished: characteristics + powers, no skills or
        // complications. If this ever equals the total, the message in the UI is a lie.
        const generated = generateRandomCharacter(seededRng(11));

        expect(generated.spent).toBe(generated.budget.characteristics + generated.budget.powers);
        expect(generated.spent).toBeLessThan(generated.level.total);
        expect(generated.level).toBe(LOW_POWERED_5E);
    });

    it('fuzzes: 300 rolls all produce a costable 5E character with finite costs', () => {
        const seen = new Set<string>();

        for (let seed = 0; seed < 300; seed++) {
            const generated = generateRandomCharacter(seededRng(seed));
            const character = heroDesignerCharacter.getCharacter(generated.parsed) as unknown as Obj;

            expect(heroDesignerCharacter.isFifth(character)).toBe(true);
            expect((character.powers as Obj[]).length).toBeGreaterThan(0);

            for (const power of character.powers as Obj[]) {
                expect(Number.isFinite(characterTraitDecorator.decorate(power, 'powers', () => character).realCost())).toBe(true);
            }

            seen.add(generated.archetype);
        }

        // ...and it reaches every generatable archetype.
        expect(seen.size).toBe(generatableArchetypes().length);
    });

    it('can roll every skillset, now that they all fit', () => {
        // Every powerset is sized against a 25-point skills bucket. Warrior used to state 28 —
        // the only one that did, and a data error; at 28 it left every archetype 3 short. The
        // filter stays as a guard: a future skillset that does not cost 25 gets left out here
        // rather than silently producing a character that misses its total.
        expect(fittableSkillsets()).toHaveLength(SKILLSETS.length);
        expect(fittableSkillsets().map((s) => s.profession)).toContain('Warrior');
        expect(SKILLSETS.every((s) => s.cost === 25)).toBe(true);
    });

    it('spends exactly its powers budget however the dice fall', () => {
        for (let seed = 0; seed < 60; seed++) {
            const generated = generateRandomCharacter(seededRng(seed));
            const character = characterFrom(seed);
            const spent = (character.powers as Obj[]).reduce(
                (total, power) => total + characterTraitDecorator.decorate(power, 'powers', () => character).realCost(),
                0,
            );

            expect({archetype: generated.archetype, spent}).toEqual({archetype: generated.archetype, spent: generated.budget.powers});
        }
    });
});
