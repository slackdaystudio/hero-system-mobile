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

/**
 * A seeded LCG — deterministic, so generation is reproducible and fuzzable. Kept in modulo form
 * rather than the usual bitwise one: `state * 1664525 + 1013904223` peaks around 7.2e15, inside
 * a double's exact integer range (2^53 ≈ 9.0e15), so no precision is lost.
 *
 * **Reads the high bits, not the low ones.** An LCG's low bits are famously weak — with
 * sequential seeds, `state % n` for even `n` barely moves, and a 300-roll fuzz over 10 archetypes
 * reached only 2 of them. Dividing by 65536 first uses the top half of the word and decorrelates.
 */
const seededRng = (seed: number): Rng => {
    let state = (seed * 2654435761) % 4294967296;

    return {
        next: (min: number, max: number): number => {
            state = (state * 1664525 + 1013904223) % 4294967296;

            return min + (Math.floor(state / 65536) % (max - min + 1));
        },
    };
};

const characterFrom = (seed: number): Obj => heroDesignerCharacter.getCharacter(generateRandomCharacter(seededRng(seed)).parsed) as unknown as Obj;

describe('generateRandomCharacter', () => {
    it('only offers archetypes that have a structured powerset', () => {
        const names = generatableArchetypes().map((archetype) => archetype.name);

        expect(names).toEqual(['Energy Projector', 'Gadgeteer', 'Martial Artist', 'Mentalist', 'Metamorph', 'Mystic', 'Patriot', 'Powered Armor', 'Speedster', 'Weapons Master', 'Brick']);
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
        // Martial maneuvers are not powers, but their cost comes out of the powers balance — the
        // legacy prose folds them into `powersCost`. Count both or Martial Artist looks 15 short.
        const spentBy = (character: Obj): number =>
            (character.powers as Obj[]).reduce((total, power) => total + characterTraitDecorator.decorate(power, 'powers', () => character).realCost(), 0) +
            ((character.martialArts ?? []) as Obj[]).reduce(
                (total, maneuver) => total + characterTraitDecorator.decorate(maneuver, 'martialArts', () => character).realCost(),
                0,
            );

        for (let seed = 0; seed < 60; seed++) {
            const generated = generateRandomCharacter(seededRng(seed));
            const spent = spentBy(characterFrom(seed));

            expect({archetype: generated.archetype, spent}).toEqual({archetype: generated.archetype, spent: generated.budget.powers});
        }
    });
});
