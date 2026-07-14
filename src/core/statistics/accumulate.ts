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

import type {Statistics} from 'core/ports';
import {RollType} from 'core/dice';

/** The slice of a roll result the aggregate statistics care about. */
export interface StatisticsRoll {
    rollType: RollType;
    rolls: number[];
    stun?: number;
    body?: number;
    knockback?: number;
    hitLocationDetails?: {location: string};
}

const DISTRIBUTION_KEYS = ['', 'one', 'two', 'three', 'four', 'five', 'six'] as const;

/**
 * Fold one roll into the aggregate statistics — the pure port of legacy
 * `Statistics.add` (minus the database). Returns a new {@link Statistics}; the
 * input is never mutated. The app persists the result via `StatisticsRepository`.
 */
export function accumulateStatistics(stats: Statistics, roll: StatisticsRoll): Statistics {
    const next = JSON.parse(JSON.stringify(stats)) as Statistics;
    const total = roll.rolls.reduce((sum, die) => sum + die, 0);

    next.sum += total;
    next.largestDieRoll = Math.max(next.largestDieRoll, roll.rolls.length);
    next.largestSum = Math.max(next.largestSum, total);

    switch (roll.rollType) {
        case RollType.NormalDamage:
        case RollType.KillingDamage: {
            const bucket = roll.rollType === RollType.NormalDamage ? next.totals.normalDamage : next.totals.killingDamage;
            bucket.rolls++;
            bucket.stun += roll.stun ?? 0;
            bucket.body += roll.body ?? 0;
            next.totals.knockback += Math.max(0, roll.knockback ?? 0);

            const location = roll.hitLocationDetails?.location.toLowerCase();
            const locations = next.totals.hitLocations as unknown as Record<string, number>;
            if (location !== undefined && location in locations) {
                locations[location]++;
            }
            break;
        }
        case RollType.ToHit:
            next.totals.hitRolls++;
            break;
        case RollType.Effect:
            next.totals.effectRolls++;
            break;
        case RollType.SkillCheck:
            next.totals.skillChecks++;
            break;
        default:
            break;
    }

    next.totals.diceRolled += roll.rolls.length;

    const distributions = next.distributions as unknown as Record<string, number>;
    for (const die of roll.rolls) {
        if (die >= 1 && die <= 6) {
            distributions[DISTRIBUTION_KEYS[die]]++;
        }
    }

    return next;
}
