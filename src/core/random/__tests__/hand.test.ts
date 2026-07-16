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
 * Dealing a hand.
 *
 * The load-bearing property is that **archetypes never repeat within a hand**: one powerset per
 * archetype means two candidates sharing one share their powers too, and dealt uniformly that would
 * happen to about two hands in three. Everything else — the size, the budget, the balance — is the
 * single-roll guarantees holding once there are five of them.
 */
import type {Rng} from 'core/ports';
import {pickDistinct} from '../allocate';
import {dealHand, HAND_SIZE} from '../hand';
import {generatableArchetypes} from '../generate';
import {LOW_POWERED_5E, STANDARD_6E} from '../powerLevel';
import {isBalanced} from '../ruleOfX';

const seededRng = (seed: number): Rng => {
    let state = (seed * 2654435761) % 4294967296;

    return {
        next: (min: number, max: number): number => {
            state = (state * 1664525 + 1013904223) % 4294967296;

            return min + (Math.floor(state / 65536) % (max - min + 1));
        },
    };
};

/** A real uniform rng — the statistical tests need randomness, not a fixed sequence. */
const realRng: Rng = {next: (min, max) => min + Math.floor(Math.random() * (max - min + 1))};

describe('dealing a hand', () => {
    it('deals five by default', () => {
        expect(dealHand(seededRng(1), STANDARD_6E)).toHaveLength(HAND_SIZE);
        expect(HAND_SIZE).toBe(5);
    });

    /**
     * The whole point. Every archetype has exactly one powerset, so a repeated archetype is a
     * repeated *character* — same characteristics, same powers, only the skills differing. Dealt
     * uniformly, two hands in three would contain one.
     */
    it('never deals the same archetype twice', () => {
        for (let seed = 0; seed < 40; seed++) {
            const hand = dealHand(seededRng(seed), STANDARD_6E);
            const archetypes = hand.map((candidate) => candidate.rolled.recipe.archetype);

            expect(new Set(archetypes).size).toBe(archetypes.length);
        }
    });

    it('deals what it can rather than repeating, when asked for more than exist', () => {
        const all = generatableArchetypes('6e').length;
        const hand = dealHand(seededRng(2), STANDARD_6E, 100);

        expect(hand).toHaveLength(all);
        expect(new Set(hand.map((candidate) => candidate.rolled.recipe.archetype)).size).toBe(all);
    });

    it('deals a hand of one, which is what a single roll is', () => {
        expect(dealHand(seededRng(3), STANDARD_6E, 1)).toHaveLength(1);
    });

    describe('every candidate is a real character', () => {
        it('spends its whole budget, in its own edition', () => {
            for (const candidate of dealHand(seededRng(5), STANDARD_6E)) {
                expect(candidate.rolled.spent).toBe(STANDARD_6E.total);
                expect(candidate.rolled.recipe.level).toBe('6e-standard');
            }

            for (const candidate of dealHand(seededRng(5), LOW_POWERED_5E)) {
                expect(candidate.rolled.spent).toBe(LOW_POWERED_5E.total);
                expect(candidate.rolled.recipe.level).toBe('5e-low');
            }
        });

        it('lands inside the Rule of X', () => {
            for (let seed = 0; seed < 8; seed++) {
                for (const candidate of dealHand(seededRng(seed), STANDARD_6E)) {
                    expect({archetype: candidate.rolled.recipe.archetype, balanced: isBalanced(candidate.stats)}).toEqual({
                        archetype: candidate.rolled.recipe.archetype,
                        balanced: true,
                    });
                }
            }
        });

        /** The card is read to choose by, so the numbers have to be the character's own. */
        it('carries stats that describe it — a Brick hits hardest and a Speedster is fastest', () => {
            const hand = dealHand(seededRng(9), STANDARD_6E, 11); // the whole roster
            const by = (name: string) => hand.find((candidate) => candidate.rolled.recipe.archetype === name)!;

            expect(by('Brick').stats.dc).toBeGreaterThan(by('Mentalist').stats.dc);
            expect(by('Speedster').stats.spd).toBeGreaterThan(by('Brick').stats.spd);
            expect(by('Mentalist').stats.omcv).toBeGreaterThan(by('Brick').stats.omcv);
        });
    });

    it('is deterministic for a seeded rng — the same seed deals the same hand', () => {
        const first = dealHand(seededRng(11), STANDARD_6E).map((candidate) => candidate.rolled.recipe);
        const second = dealHand(seededRng(11), STANDARD_6E).map((candidate) => candidate.rolled.recipe);

        expect(first).toEqual(second);
    });
});

describe('pickDistinct', () => {
    const pool = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11];

    it('takes what it was asked for, without repeats', () => {
        for (let seed = 0; seed < 50; seed++) {
            const taken = pickDistinct(seededRng(seed), pool, 5);

            expect(taken).toHaveLength(5);
            expect(new Set(taken).size).toBe(5);
            expect(taken.every((item) => pool.includes(item))).toBe(true);
        }
    });

    it('never takes more than exist, and never invents one', () => {
        expect(pickDistinct(seededRng(1), pool, 99)).toHaveLength(pool.length);
        expect(pickDistinct(seededRng(1), [], 5)).toEqual([]);
        expect(pickDistinct(seededRng(1), pool, 0)).toEqual([]);
    });

    it('leaves the pool alone', () => {
        const original = [...pool];
        pickDistinct(seededRng(1), pool, 5);

        expect(pool).toEqual(original);
    });

    /**
     * A partial Fisher–Yates is only unbiased if each slot draws from the *survivors* — `rng.next(slot,
     * …)` and not `rng.next(0, …)`. Getting that wrong still returns distinct items, so nothing above
     * would notice; it just quietly makes some items likelier than others.
     *
     * 22k draws of 5 from 11: each item should appear in 5/11 of hands (~45.5%). The tolerance is
     * loose enough not to flake and far tighter than the ~10-point skew the off-by-one produces.
     */
    it('gives every item the same chance — the bias a wrong swap would introduce', () => {
        const draws = 22000;
        const counts = new Map<number, number>(pool.map((item) => [item, 0]));

        for (let i = 0; i < draws; i++) {
            for (const item of pickDistinct(realRng, pool, 5)) {
                counts.set(item, counts.get(item)! + 1);
            }
        }

        const expected = draws * (5 / pool.length);
        const worst = Math.max(...[...counts.values()].map((count) => Math.abs(count - expected) / expected));

        expect(worst).toBeLessThan(0.05);
    });

    it('does not favour any position within the hand', () => {
        // The first card is drawn from the full pool and the last from seven survivors; neither
        // should make a given item likelier to land in a given slot.
        const draws = 11000;
        const firstSlot = new Map<number, number>(pool.map((item) => [item, 0]));

        for (let i = 0; i < draws; i++) {
            const [first] = pickDistinct(realRng, pool, 5);
            firstSlot.set(first, firstSlot.get(first)! + 1);
        }

        const expected = draws / pool.length;
        const worst = Math.max(...[...firstSlot.values()].map((count) => Math.abs(count - expected) / expected));

        expect(worst).toBeLessThan(0.1);
    });
});
