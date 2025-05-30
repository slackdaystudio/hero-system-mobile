import {statistics} from './Statistics';
import {getRandomNumber} from '../../App';

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

export const SKILL_CHECK = 1;

export const TO_HIT = 2;

export const NORMAL_DAMAGE = 3;

export const KILLING_DAMAGE = 4;

export const EFFECT = 5;

export const HIT_LOCATIONS = 6;

export const KNOCKBACK = 7;

export const PARTIAL_DIE_NONE = 0;

export const PARTIAL_DIE_PLUS_ONE = 1;

export const PARTIAL_DIE_HALF = 2;

export const PARTIAL_DIE_MINUS_ONE = 3;

export const ROLL_MIN = 1;

export const D6_MAX = 6;

export const D3_MAX = 3;

class DieRoller {
    constructor() {
        this.validLastRollTypes = [SKILL_CHECK, TO_HIT, NORMAL_DAMAGE, KILLING_DAMAGE, EFFECT];
    }

    rollCheck(db, threshold = null) {
        let regex = /^([0-9]+-|[0-9]+-\s\/\s[0-9]+-)$/;
        let result = this._roll(3, SKILL_CHECK);
        result.threshold = -1;

        if (threshold !== null && regex.test(threshold)) {
            let rollThreshold = threshold;

            if (threshold.indexOf('/') !== -1) {
                rollThreshold = threshold.split(' / ')[1];
            }

            result.threshold = rollThreshold.slice(0, -1);
        }

        statistics.add(db, result).catch((error) => console.error(error));

        return result;
    }

    rollToHit(db, cv, numberOfRolls, isAutofire, targetDcv) {
        let results = [];
        let result;

        for (let i = 0; i < numberOfRolls; i++) {
            result = this._roll(3, TO_HIT);
            result.hitCv = 11 + parseInt(cv, 10) - result.total;
            result.cv = cv;
            result.isAutofire = isAutofire;
            result.targetDcv = targetDcv;

            if (isAutofire) {
                result.hits = 0;

                if (result.hitCv - targetDcv >= 0) {
                    result.hits = Math.floor((result.hitCv - targetDcv) / 2) + 1;
                }
            }

            results.push(result);
        }

        statistics.add(db, result).catch((error) => console.error(error));

        return {results: results};
    }

    rollDamage(db, damageForm) {
        let resultRoll = this._roll(damageForm.dice, damageForm.damageType, damageForm.partialDie);
        let hitLocationRoll = damageForm.useHitLocations ? this._roll(3, HIT_LOCATIONS).total : 10;
        resultRoll.damageForm = damageForm;
        resultRoll.sfx = damageForm.sfx;

        if (damageForm.damageType === KILLING_DAMAGE) {
            resultRoll.stunMultiplier = damageForm.stunMultiplier;
        }

        resultRoll.hitLocationDetails = this._getHitLocationModifiers(hitLocationRoll);
        resultRoll.body = this._calculateBody(resultRoll);
        resultRoll.stun = this._calculateStun(resultRoll);
        resultRoll.knockback = this._calculateKnockback(
            resultRoll,
            damageForm.isTargetFlying,
            damageForm.isMartialManeuver,
            damageForm.isTargetInZeroG,
            damageForm.isTargetUnderwater,
            damageForm.rollWithPunch,
            damageForm.isUsingClinging,
        );

        if (damageForm.isExplosion) {
            resultRoll.rolls.sort((a, b) => a - b).reverse();
            resultRoll.explosion = [
                {
                    distance: 0,
                    stun: resultRoll.stun,
                    body: resultRoll.body,
                    knockback: resultRoll.knockback,
                },
            ];

            let newResultRoll = {...resultRoll};
            newResultRoll.rolls = resultRoll.rolls.slice();

            this._buildExplosionTable(resultRoll, newResultRoll);
        }

        statistics.add(db, resultRoll).catch((error) => console.error(error));

        return resultRoll;
    }

    rollEffect(db, effectForm) {
        const resultRoll = this._roll(effectForm.dice, EFFECT, effectForm.partialDie);

        resultRoll.effectForm = effectForm;

        statistics.add(db, resultRoll).catch((error) => console.error(error));

        return resultRoll;
    }

    rollAgain(db, lastResult) {
        let numberOfRolls;

        if (lastResult.hasOwnProperty('results')) {
            numberOfRolls = lastResult.results.length;
            lastResult = lastResult.results[0];
        }

        switch (lastResult.rollType) {
            case SKILL_CHECK:
                return this.rollCheck(db, lastResult.threshold + '-');
            case TO_HIT:
                return this.rollToHit(db, lastResult.cv, numberOfRolls, lastResult.isAutofire, lastResult.targetDcv);
            case EFFECT:
                return this.rollEffect(db, lastResult.effectForm);
            default:
                return this.rollDamage(db, lastResult.damageForm);
        }
    }

    countNormalDamageBody(resultRoll) {
        let body = 0;

        for (let roll of resultRoll.rolls) {
            if (roll >= 2 && roll <= 5) {
                body += 1;
            } else if (roll === D6_MAX) {
                body += 2;
            }
        }

        return body;
    }

    countLuck(resultRoll) {
        let luckPoints = 0;

        for (let roll of resultRoll.rolls) {
            if (roll === D6_MAX) {
                luckPoints++;
            }
        }

        return luckPoints;
    }

    getPartialDieName(partialDieType) {
        let name = 'None';

        if (partialDieType === PARTIAL_DIE_PLUS_ONE) {
            name = '+1 pip';
        } else if (partialDieType === PARTIAL_DIE_MINUS_ONE) {
            name = '1d6-1';
        } else if (partialDieType === PARTIAL_DIE_HALF) {
            name = '½d6';
        }

        return name;
    }

    _roll(dice, rollType, partialDieType) {
        const resultRoll = {
            rollType: rollType,
            total: 0,
            rolls: [],
            partialDieType: partialDieType || PARTIAL_DIE_NONE,
        };

        resultRoll.rolls = [getRandomNumber(ROLL_MIN, D6_MAX, dice)].flat();
        resultRoll.total = resultRoll.rolls.reduce((total, current) => total + current, 0);

        if (partialDieType === PARTIAL_DIE_PLUS_ONE) {
            resultRoll.total += 1;
        } else if (partialDieType === PARTIAL_DIE_MINUS_ONE) {
            let partialDie = getRandomNumber(ROLL_MIN, D6_MAX);

            if (--partialDie < ROLL_MIN) {
                partialDie = ROLL_MIN;
            }

            resultRoll.total += partialDie;
            resultRoll.rolls.push(partialDie);
        } else if (partialDieType === PARTIAL_DIE_HALF) {
            const halfDie = getRandomNumber(ROLL_MIN, D3_MAX);

            resultRoll.total += halfDie;
            resultRoll.rolls.push(halfDie);
        }

        return resultRoll;
    }

    _calculateStun(resultRoll) {
        let stun = 0;

        if (resultRoll.rollType === KILLING_DAMAGE) {
            if (resultRoll.damageForm.useHitLocations) {
                stun = resultRoll.total * (resultRoll.hitLocationDetails.stunX + parseInt(resultRoll.stunMultiplier, 10));
            } else {
                if (resultRoll.stunModifier === undefined) {
                    resultRoll.stunModifier = 1;

                    if (resultRoll.damageForm.useFifthEdition) {
                        resultRoll.stunModifier = getRandomNumber(ROLL_MIN, D6_MAX);

                        if (--resultRoll.stunModifier === 0) {
                            resultRoll.stunModifier = 1;
                        }
                    } else {
                        resultRoll.stunModifier = getRandomNumber(ROLL_MIN, D3_MAX);
                    }
                }

                stun = resultRoll.total * (resultRoll.stunModifier + parseInt(resultRoll.stunMultiplier, 10));
            }
        } else {
            stun = resultRoll.total;
        }

        return stun;
    }

    _calculateBody(resultRoll) {
        let body = 0;

        if (resultRoll.rollType === NORMAL_DAMAGE) {
            body += this.countNormalDamageBody(resultRoll);
        } else if (resultRoll.rollType === KILLING_DAMAGE) {
            body += resultRoll.total;
        }

        return body;
    }

    _calculateKnockback(resultRoll, isTargetFlying, isMartialManeuver, zeroG, underwater, rolledWithPunch, usingClinging) {
        if (resultRoll.knockbackRollTotal === undefined) {
            let knockbackDice = 2;

            if (isMartialManeuver) {
                knockbackDice++;
            }

            if (underwater) {
                knockbackDice++;
            }

            if (usingClinging) {
                knockbackDice++;
            }

            if (isTargetFlying) {
                knockbackDice--;
            }

            if (zeroG) {
                knockbackDice--;
            }

            if (rolledWithPunch) {
                knockbackDice--;
            }

            if (resultRoll.rollType === KILLING_DAMAGE) {
                knockbackDice++;
            }

            resultRoll.knockbackRollTotal = knockbackDice <= 0 ? 0 : this._roll(knockbackDice, KNOCKBACK).total;
        }

        return (resultRoll.body - resultRoll.knockbackRollTotal) * 2;
    }

    _buildExplosionTable(resultRoll, newResultRoll) {
        newResultRoll.rolls.shift();
        newResultRoll.total = newResultRoll.rolls.reduce((a, b) => a + b, 0);
        newResultRoll.stun = this._calculateStun(newResultRoll);
        newResultRoll.body = this._calculateBody(newResultRoll);
        newResultRoll.knockback = this._calculateKnockback(newResultRoll);

        resultRoll.explosion.push({
            distance: (resultRoll.rolls.length - newResultRoll.rolls.length) * resultRoll.damageForm.fadeRate * 2,
            stun: newResultRoll.stun,
            body: newResultRoll.body,
            knockback: newResultRoll.knockback,
        });

        if (newResultRoll.rolls.length >= 2) {
            this._buildExplosionTable(resultRoll, newResultRoll);
        }
    }

    _getHitLocationModifiers(hitLocationRoll) {
        if (hitLocationRoll >= 3 && hitLocationRoll <= 5) {
            return {
                location: 'Head',
                stunX: 5,
                nStun: 2,
                bodyX: 2,
            };
        } else if (hitLocationRoll === 6) {
            return {
                location: 'Hands',
                stunX: 1,
                nStun: 0.5,
                bodyX: 0.5,
            };
        } else if (hitLocationRoll >= 7 && hitLocationRoll <= 8) {
            return {
                location: 'Arms',
                stunX: 2,
                nStun: 0.5,
                bodyX: 0.5,
            };
        } else if (hitLocationRoll === 9) {
            return {
                location: 'Shoulders',
                stunX: 3,
                nStun: 1,
                bodyX: 1,
            };
        } else if (hitLocationRoll >= 10 && hitLocationRoll <= 11) {
            return {
                location: 'Chest',
                stunX: 3,
                nStun: 1,
                bodyX: 1,
            };
        } else if (hitLocationRoll === 12) {
            return {
                location: 'Stomach',
                stunX: 4,
                nStun: 1.5,
                bodyX: 1,
            };
        } else if (hitLocationRoll === 13) {
            return {
                location: 'Vitals',
                stunX: 4,
                nStun: 1.5,
                bodyX: 2,
            };
        } else if (hitLocationRoll === 14) {
            return {
                location: 'Thighs',
                stunX: 2,
                nStun: 1,
                bodyX: 1,
            };
        } else if (hitLocationRoll >= 15 && hitLocationRoll <= 16) {
            return {
                location: 'Legs',
                stunX: 2,
                nStun: 0.5,
                bodyX: 0.5,
            };
        } else {
            return {
                location: 'Feet',
                stunX: 1,
                nStun: 0.5,
                bodyX: 0.5,
            };
        }
    }
}

export let dieRoller = new DieRoller();
