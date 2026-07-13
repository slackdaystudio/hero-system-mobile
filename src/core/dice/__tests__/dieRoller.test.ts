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

import type {Rng} from 'core/ports';
import {DieRoller, PartialDie, RollType, type DamageForm} from 'core/dice';

/**
 * Deterministic {@link Rng} that hands back a fixed script of values in order,
 * ignoring the requested bounds. Lets a test pin every die face and assert exact
 * totals/body/stun without leaning on the legacy tree.
 */
const scriptedRng = (values: number[]): Rng => {
    let index = 0;
    return {
        next: (): number => {
            if (index >= values.length) {
                throw new Error('scriptedRng exhausted: the roller drew more numbers than scripted');
            }
            return values[index++];
        },
    };
};

const baseDamage: DamageForm = {
    dice: 3,
    damageType: RollType.NormalDamage,
    partialDie: PartialDie.None,
    stunMultiplier: 0,
    useHitLocations: false,
    useFifthEdition: false,
    isMartialManeuver: false,
    isTargetFlying: false,
    isTargetInZeroG: false,
    isTargetUnderwater: false,
    rollWithPunch: false,
    isUsingClinging: false,
    isExplosion: false,
    fadeRate: 1,
    sfx: null,
};

describe('DieRoller (core/dice)', () => {
    it('injects randomness through the Rng port — no reach into App globals', () => {
        // Constructing with a scripted Rng and getting deterministic output is the
        // proof the App.js `getRandomNumber` coupling is gone.
        const roller = new DieRoller(scriptedRng([1, 2, 3]));

        expect(roller.rollCheck().rolls).toEqual([1, 2, 3]);
    });

    describe('rollCheck', () => {
        it('defaults threshold to -1 when none is supplied', () => {
            const result = new DieRoller(scriptedRng([1, 2, 3])).rollCheck();

            expect(result).toMatchObject({rollType: RollType.SkillCheck, total: 6, rolls: [1, 2, 3], threshold: -1});
        });

        it('strips the trailing dash from a simple threshold', () => {
            expect(new DieRoller(scriptedRng([1, 1, 1])).rollCheck('11-').threshold).toBe('11');
        });

        it('takes the second clause of a compound threshold', () => {
            expect(new DieRoller(scriptedRng([1, 1, 1])).rollCheck('13- / 11-').threshold).toBe('11');
        });

        it('ignores a malformed threshold', () => {
            expect(new DieRoller(scriptedRng([1, 1, 1])).rollCheck('not-a-threshold').threshold).toBe(-1);
        });
    });

    describe('_roll partial dice', () => {
        it('adds a flat pip for +1 without drawing a die', () => {
            const result = new DieRoller(scriptedRng([2, 2, 2])).rollEffect({dice: 3, partialDie: PartialDie.PlusOne});

            expect(result.total).toBe(7);
            expect(result.rolls).toEqual([2, 2, 2]);
        });

        it('appends a d3 for a half die', () => {
            const result = new DieRoller(scriptedRng([2, 2, 2, 3])).rollEffect({dice: 3, partialDie: PartialDie.Half});

            expect(result.rolls).toEqual([2, 2, 2, 3]);
            expect(result.total).toBe(9);
        });

        it('clamps a minus-one die at the minimum face', () => {
            // Drawn 1, minus one -> 0, clamped back up to ROLL_MIN (1).
            const result = new DieRoller(scriptedRng([2, 2, 2, 1])).rollEffect({dice: 3, partialDie: PartialDie.MinusOne});

            expect(result.rolls).toEqual([2, 2, 2, 1]);
            expect(result.total).toBe(7);
        });
    });

    describe('rollDamage — normal', () => {
        it('computes body, stun and knockback from the dice', () => {
            // rolls [6,6,2] then knockback dice [4,3].
            const result = new DieRoller(scriptedRng([6, 6, 2, 4, 3])).rollDamage(baseDamage);

            expect(result).toEqual({
                rollType: RollType.NormalDamage,
                total: 14,
                rolls: [6, 6, 2],
                partialDieType: PartialDie.None,
                damageForm: baseDamage,
                sfx: null,
                hitLocationDetails: {location: 'Chest', stunX: 3, nStun: 1, bodyX: 1},
                body: 5,
                stun: 14,
                knockback: -4,
                knockbackRollTotal: 7,
            });
        });
    });

    describe('rollDamage — killing', () => {
        it('rolls a d3 stun multiplier in 6th edition and applies the stun multiplier', () => {
            const killing: DamageForm = {...baseDamage, damageType: RollType.KillingDamage, dice: 2, stunMultiplier: 1};
            // rolls [5,4], stunModifier d3 -> 2, knockback dice (2 + 1 for killing) -> [1,1,1].
            const result = new DieRoller(scriptedRng([5, 4, 2, 1, 1, 1])).rollDamage(killing);

            expect(result).toMatchObject({
                rollType: RollType.KillingDamage,
                total: 9,
                body: 9,
                stunMultiplier: 1,
                stunModifier: 2,
                stun: 27, // 9 * (2 + 1)
                knockbackRollTotal: 3,
                knockback: 12, // (9 - 3) * 2
            });
        });
    });

    describe('helpers', () => {
        it('names each partial die type', () => {
            const roller = new DieRoller(scriptedRng([]));

            expect(roller.getPartialDieName(PartialDie.None)).toBe('None');
            expect(roller.getPartialDieName(PartialDie.PlusOne)).toBe('+1 pip');
            expect(roller.getPartialDieName(PartialDie.Half)).toBe('½d6');
            expect(roller.getPartialDieName(PartialDie.MinusOne)).toBe('1d6-1');
        });

        it('counts luck as the number of sixes', () => {
            const roller = new DieRoller(scriptedRng([]));

            expect(roller.countLuck({rollType: RollType.Effect, total: 0, rolls: [6, 3, 6, 6, 1], partialDieType: PartialDie.None})).toBe(3);
        });
    });
});
