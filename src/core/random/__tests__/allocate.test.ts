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

/** Phase 2 of docs/RANDOM_CHARACTER.md — the budget allocator. */
import type {Rng} from 'core/ports';
import {allocate, ARCHETYPES_5E, complicationsTotal, COMPLICATIONS_5E, randomBudget, SKILLSETS} from '../allocate';
import {LOW_POWERED_5E, POWER_LEVELS, powerLevel, STANDARD_6E} from '../powerLevel';

/**
 * A seeded LCG — deterministic, so generation is reproducible and fuzzable. Kept in modulo form
 * rather than the usual bitwise one: `state * 1664525 + 1013904223` peaks around 7.2e15, inside
 * a double's exact integer range (2^53 ≈ 9.0e15), so no precision is lost.
 */
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

describe('power levels', () => {
    /**
     * The invariant that survives the editions quoting their tiers differently — 5E states
     * base/disads (add), 6E states total/complications (subtract). Reduced, they agree.
     */
    it('reduce to a consistent (base, limit, total) triple in both editions', () => {
        for (const level of POWER_LEVELS) {
            expect({[level.id]: level.total}).toEqual({[level.id]: level.base + level.limit});
        }
    });

    it('carries the four levels, with the original ask as 250 and 400 — both totals', () => {
        expect(POWER_LEVELS.map((l) => l.total)).toEqual([250, 350, 300, 400]);
        expect(LOW_POWERED_5E.total).toBe(250);
        expect(STANDARD_6E.total).toBe(400);
        expect(powerLevel('6e-standard')).toBe(STANDARD_6E);
        expect(() => powerLevel('nope')).toThrow('Unknown power level');
    });
});

describe('allocator (5E Low Powered, 250)', () => {
    it.each(ARCHETYPES_5E.map((a) => [a.name, a] as const))('%s: the buckets spend the total exactly', (_name, archetype) => {
        for (const skillset of SKILLSETS) {
            const budget = allocate(LOW_POWERED_5E, archetype, skillset);

            expect(budget.characteristics + budget.skills + budget.powers).toBe(LOW_POWERED_5E.total);
            expect(budget.powers).toBeGreaterThan(0);
            expect(budget.complications).toBe(LOW_POWERED_5E.limit);
        }
    });

    it('leaves the balance to powers, moving the line by archetype', () => {
        const scientist = SKILLSETS.find((s) => s.profession === 'Scientist')!;
        const budgetFor = (name: string) => allocate(LOW_POWERED_5E, ARCHETYPES_5E.find((a) => a.name === name)!, scientist);

        // The archetype moves the characteristics line; powers take whatever is left.
        expect(budgetFor('Energy Projector')).toMatchObject({characteristics: 100, skills: 25, powers: 125});
        expect(budgetFor('Brick')).toMatchObject({characteristics: 150, skills: 25, powers: 75});
        expect(budgetFor('Speedster')).toMatchObject({characteristics: 125, skills: 25, powers: 100});
        expect(budgetFor('Gadgeteer')).toMatchObject({characteristics: 93, skills: 25, powers: 132});
    });

    it('charges skills out of the powers budget, whichever skillset is picked', () => {
        // All eleven cost 25, so the balance no longer moves with the choice. Warrior stated 28
        // until Phil corrected it — a data error that left every archetype 3 points short.
        const brick = ARCHETYPES_5E.find((a) => a.name === 'Brick')!;

        for (const skillset of SKILLSETS) {
            expect(allocate(LOW_POWERED_5E, brick, skillset)).toMatchObject({skills: 25, powers: 75});
        }
    });
});

describe('powerset sizing — the phase 3 authoring spec', () => {
    /**
     * How far each legacy powerset must flex to fill the balance the allocator computes, with a
     * 25-point skillset. This is the input to phase 3: 0 means the legacy powerset is already
     * the right size and lifts unchanged.
     *
     * Eight of eleven are exactly 0, which is what tells us the cutoff model *is* the original's
     * design rather than one imposed on it. The exceptions:
     *   - Gadgeteer +7  — from un-swapping its transposed INT/EGO (93 chars, not 100)
     *   - Powered Armor −3 — its spread costs 103, not the 100 its dropped label claimed
     *   - Martial Artist +10 / −15 — the only archetype whose two powersets disagree (115, 140),
     *     and neither matches its 125 balance. A genuine data slip; needs a look when authoring.
     */
    const REQUIRED_FLEX: Record<string, number[]> = {
        'Energy Projector': [0, 0, 0, 0, 0],
        Gadgeteer: [7, 7, 7],
        'Martial Artist': [10, -15],
        Mentalist: [0, 0, 0],
        Metamorph: [0, 0, 0, 0, 0, 0],
        Mystic: [0, 0, 0],
        Patriot: [0, 0],
        'Powered Armor': [-3],
        Speedster: [0, 0, 0, 0, 0, 0],
        'Weapons Master': [0, 0],
        Brick: [0, 0, 0, 0],
    };

    it.each(ARCHETYPES_5E.map((a) => [a.name, a] as const))('%s: legacy powersets vs the computed balance', (name, archetype) => {
        const scientist = SKILLSETS.find((s) => s.profession === 'Scientist')!;
        const {powers} = allocate(LOW_POWERED_5E, archetype, scientist);

        expect(archetype.powersets!.map((powerset) => powers - powerset.powersCost)).toEqual(REQUIRED_FLEX[name]);
    });

    it('needs no flex at all for eight of the eleven archetypes', () => {
        const unchanged = Object.entries(REQUIRED_FLEX).filter(([, flex]) => flex.every((f) => f === 0));

        expect(unchanged).toHaveLength(8);
    });
});

describe('powerset internal arithmetic — the phase 3 authoring hazard', () => {
    /**
     * Whether each powerset's listed power costs sum to its own `powersCost`. Most do; five do
     * not, and for those **neither number can be trusted** — the prose and the total disagree, so
     * authoring one means deciding which is wrong first.
     *
     * Two are inferable typos that resolve cleanly, both in an elemental control (30 active − a
     * 15-point reserve = 15 real):
     *   - `Brick [0]` states `Flight 10", 8x NCM` at 35; at 15 the powerset sums to exactly 75.
     *   - `Speedster [1]` states `Desolid` at 35; Desolidification's basecost is 40, so 40 − 15
     *     = 25, and at 25 it sums to exactly 100.
     * The remaining three need a rules/design call — see docs/RANDOM_CHARACTER.md.
     */
    const KNOWN_MISMATCH: Record<string, number> = {
        'Martial Artist|1': -25,
        'Patriot|1': 2,
        'Speedster|1': 10,
        'Brick|0': 20,
        'Brick|1': -10,
    };

    const statedCost = (cost: number | string): number => {
        // Slot costs are strings like "5u" / "2u"; the number is the real cost, the u is the slot type.
        const match = /^\s*(\d+(?:\.\d+)?)/.exec(String(cost));

        return match === null ? 0 : Number(match[1]);
    };

    it('flags exactly the powersets whose listed powers do not sum to their stated total', () => {
        const mismatched: Record<string, number> = {};

        for (const archetype of ARCHETYPES_5E) {
            archetype.powersets!.forEach((powerset, index) => {
                const sum = powerset.powers.reduce((total, power) => total + statedCost(power.cost), 0);

                if (sum !== powerset.powersCost) {
                    mismatched[`${archetype.name}|${index}`] = sum - powerset.powersCost;
                }
            });
        }

        expect(mismatched).toEqual(KNOWN_MISMATCH);
    });

    it('leaves 32 of the 37 powersets internally consistent', () => {
        const total = ARCHETYPES_5E.reduce((count, archetype) => count + archetype.powersets!.length, 0);

        expect(total - Object.keys(KNOWN_MISMATCH).length).toBe(32);
    });
});

describe('complications', () => {
    it('every 5E package is worth exactly the Low Powered limit', () => {
        // 100 — which is what makes the legacy data a coherent Low Powered set.
        for (const complications of COMPLICATIONS_5E) {
            expect(complicationsTotal(complications)).toBe(LOW_POWERED_5E.limit);
        }
    });

    it('does not yet cover the other levels', () => {
        // 5E Standard wants 150 and the 6E levels 60/75 — authoring, tracked in the doc.
        expect(COMPLICATIONS_5E.every((c) => complicationsTotal(c) !== POWER_LEVELS[1].limit)).toBe(true);
    });
});

describe('random selection', () => {
    it('is deterministic for a seeded Rng', () => {
        expect(randomBudget(seededRng(42), LOW_POWERED_5E)).toEqual(randomBudget(seededRng(42), LOW_POWERED_5E));
        expect(randomBudget(seededRng(1), LOW_POWERED_5E)).not.toEqual(randomBudget(seededRng(7), LOW_POWERED_5E));
    });

    it('fuzzes: 2000 budgets all spend the total exactly, with a positive powers balance', () => {
        const seen = new Set<string>();

        for (let seed = 0; seed < 2000; seed++) {
            const budget = randomBudget(seededRng(seed), LOW_POWERED_5E);

            expect(budget.characteristics + budget.skills + budget.powers).toBe(250);
            expect(budget.powers).toBeGreaterThan(0);
            seen.add(`${budget.archetype}|${budget.skillset}`);
        }

        // ...and it actually explores: every archetype turns up.
        expect(new Set([...seen].map((k) => k.split('|')[0])).size).toBe(ARCHETYPES_5E.length);
    });
});
