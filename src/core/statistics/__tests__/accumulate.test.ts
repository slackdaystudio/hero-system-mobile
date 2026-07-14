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

import {DEFAULT_STATISTICS} from 'core/ports';
import {RollType} from 'core/dice';
import {accumulateStatistics} from '../accumulate';

describe('accumulateStatistics', () => {
    it('folds a skill check into the aggregate without mutating the input', () => {
        const result = accumulateStatistics(DEFAULT_STATISTICS, {rollType: RollType.SkillCheck, rolls: [3, 4, 5]});

        expect(result.sum).toBe(12);
        expect(result.largestSum).toBe(12);
        expect(result.largestDieRoll).toBe(3);
        expect(result.totals.skillChecks).toBe(1);
        expect(result.totals.diceRolled).toBe(3);
        expect(result.distributions).toMatchObject({three: 1, four: 1, five: 1});

        expect(DEFAULT_STATISTICS.sum).toBe(0); // input untouched
    });

    it('tallies normal damage: rolls, stun, body, knockback and hit location', () => {
        const result = accumulateStatistics(DEFAULT_STATISTICS, {
            rollType: RollType.NormalDamage,
            rolls: [6, 6, 1],
            stun: 13,
            body: 4,
            knockback: 2,
            hitLocationDetails: {location: 'Chest'},
        });

        expect(result.totals.normalDamage).toEqual({rolls: 1, stun: 13, body: 4});
        expect(result.totals.knockback).toBe(2);
        expect(result.totals.hitLocations.chest).toBe(1);
    });

    it('clamps negative knockback to zero and routes killing damage to its own bucket', () => {
        const result = accumulateStatistics(DEFAULT_STATISTICS, {
            rollType: RollType.KillingDamage,
            rolls: [6, 6],
            stun: 24,
            body: 12,
            knockback: -3,
            hitLocationDetails: {location: 'Head'},
        });

        expect(result.totals.killingDamage).toEqual({rolls: 1, stun: 24, body: 12});
        expect(result.totals.knockback).toBe(0);
        expect(result.totals.normalDamage.rolls).toBe(0);
    });

    it('chains across multiple rolls', () => {
        let stats = accumulateStatistics(DEFAULT_STATISTICS, {rollType: RollType.Effect, rolls: [2, 2]});
        stats = accumulateStatistics(stats, {rollType: RollType.ToHit, rolls: [1, 1, 1]});

        expect(stats.sum).toBe(7);
        expect(stats.totals.effectRolls).toBe(1);
        expect(stats.totals.hitRolls).toBe(1);
        expect(stats.totals.diceRolled).toBe(5);
        expect(stats.distributions.one).toBe(3);
        expect(stats.distributions.two).toBe(2);
    });
});
