import {NORMAL_DAMAGE, KILLING_DAMAGE, TO_HIT, EFFECT, SKILL_CHECK, PARTIAL_DIE_HALF} from './DieRoller';
import {persistence} from './Persistence';

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

const AVERAGE_DIE_ROLL = 3.5;

const AVERAGE_HALF_DIE_ROLL = 2.0;

class Statistics {
    async add(resultRoll) {
        let stats = await persistence.initializeStatistics();
        let total = resultRoll.rolls.reduce((a, b) => a + b, 0);

        stats.sum += total;
        stats.totals.diceRolled += resultRoll.rolls.length;
        stats.largestDieRoll = resultRoll.rolls.length > stats.largestDieRoll ? resultRoll.rolls.length : stats.largestDieRoll;
        stats.largestSum = total > stats.largestSum ? total : stats.largestSum;

        if (resultRoll.rollType === NORMAL_DAMAGE || resultRoll.rollType === KILLING_DAMAGE) {
            if (resultRoll.rollType === NORMAL_DAMAGE) {
                stats.totals.normalDamage.rolls++;
                stats.totals.normalDamage.stun += resultRoll.stun;
                stats.totals.normalDamage.body += resultRoll.body;
            } else if (resultRoll.rollType === KILLING_DAMAGE) {
                stats.totals.killingDamage.rolls++;
                stats.totals.killingDamage.stun += resultRoll.stun;
                stats.totals.killingDamage.body += resultRoll.body;
            }

            stats.totals.knockback += resultRoll.knockback < 0 ? 0 : resultRoll.knockback;
            stats.totals.hitLocations[resultRoll.hitLocationDetails.location.toLowerCase()]++;
        } else if (resultRoll.rollType === TO_HIT) {
            stats.totals.hitRolls++;
        } else if (resultRoll.rollType === EFFECT) {
            stats.totals.effectRolls++;
        } else if (resultRoll.rollType === SKILL_CHECK) {
            stats.totals.skillChecks++;
        }

        this._updateDistributions(resultRoll.rolls, stats.distributions);

        return persistence.setStatistics(stats);
    }

    getMostFrequentHitLocation(hitLocationStats) {
        let location = {
            location: '',
            hits: 0,
        };

        for (let property in hitLocationStats) {
            if (hitLocationStats.hasOwnProperty(property)) {
                if (hitLocationStats[property] > location.hits) {
                    location = {
                        location: property,
                        hits: hitLocationStats[property],
                    };
                }
            }
        }

        return location;
    }

    getPercentage(roll) {
        let sum = roll.rolls.reduce((a, b) => a + b, 0);
        let average = 0.0;

        if (roll.partialDie === PARTIAL_DIE_HALF) {
            // The last entry on the rolls array is the half die
            roll.rolls.pop();

            average += AVERAGE_HALF_DIE_ROLL;
        }

        average += roll.rolls.length * AVERAGE_DIE_ROLL;

        return Math.round((sum / average - 1) * 100 * 10) / 10;
    }

    _updateDistributions(rolls, distributions) {
        for (let roll of rolls) {
            switch (roll) {
                case 1:
                    distributions.one++;
                    break;
                case 2:
                    distributions.two++;
                    break;
                case 3:
                    distributions.three++;
                    break;
                case 4:
                    distributions.four++;
                    break;
                case 5:
                    distributions.five++;
                    break;
                case 6:
                    distributions.six++;
                    break;
                default:
                // do nothing
            }
        }
    }
}

export let statistics = new Statistics();
