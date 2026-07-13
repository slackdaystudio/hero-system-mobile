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
import {
    D3_MAX,
    D6_MAX,
    ROLL_MIN,
    PartialDie,
    RollType,
    type DamageForm,
    type DamageResult,
    type DiceRoll,
    type EffectForm,
    type EffectResult,
    type HitLocationDetails,
    type LastRoll,
    type SkillCheckResult,
    type ToHitResult,
    type ToHitResults,
} from './types';

/**
 * Working shape used while a result is assembled. Modelled on the legacy
 * roller, which grows a single object field-by-field; the public methods narrow
 * it back to a concrete result type on return.
 */
type WorkingRoll = DiceRoll &
    Partial<
        Omit<DamageResult, keyof DiceRoll> & Omit<ToHitResult, keyof DiceRoll> & Omit<SkillCheckResult, keyof DiceRoll> & Omit<EffectResult, keyof DiceRoll>
    >;

const toInt = (value: number | string): number => parseInt(String(value), 10);

/**
 * The HERO System dice engine, ported from legacy `src/lib/DieRoller.js`.
 *
 * Two decouplings vs. legacy (see REBUILD_PLAN.md):
 *  - randomness arrives through the injected {@link Rng} port instead of
 *    `getRandomNumber` reaching up into `App.js`;
 *  - rolling has no side effects — methods return a plain result object and the
 *    app layer decides whether to feed it to a statistics sink.
 */
export class DieRoller {
    constructor(private readonly rng: Rng) {}

    rollCheck(threshold: string | null = null): SkillCheckResult {
        const regex = /^([0-9]+-|[0-9]+-\s\/\s[0-9]+-)$/;
        const result = this.roll(3, RollType.SkillCheck) as WorkingRoll;
        result.threshold = -1;

        if (threshold !== null && regex.test(threshold)) {
            let rollThreshold = threshold;

            if (threshold.indexOf('/') !== -1) {
                rollThreshold = threshold.split(' / ')[1];
            }

            result.threshold = rollThreshold.slice(0, -1);
        }

        return result as SkillCheckResult;
    }

    rollToHit(cv: number | string, numberOfRolls: number, isAutofire: boolean, targetDcv: number): ToHitResults {
        const results: ToHitResult[] = [];

        for (let i = 0; i < numberOfRolls; i++) {
            const result = this.roll(3, RollType.ToHit) as WorkingRoll;
            result.hitCv = 11 + toInt(cv) - result.total;
            result.cv = cv;
            result.isAutofire = isAutofire;
            result.targetDcv = targetDcv;

            if (isAutofire) {
                result.hits = 0;

                if (result.hitCv - targetDcv >= 0) {
                    result.hits = Math.floor((result.hitCv - targetDcv) / 2) + 1;
                }
            }

            results.push(result as ToHitResult);
        }

        return {results};
    }

    rollDamage(damageForm: DamageForm): DamageResult {
        const resultRoll = this.roll(damageForm.dice, damageForm.damageType, damageForm.partialDie) as WorkingRoll;
        const hitLocationRoll = damageForm.useHitLocations ? this.roll(3, RollType.HitLocations).total : 10;
        resultRoll.damageForm = damageForm;
        resultRoll.sfx = damageForm.sfx;

        if (damageForm.damageType === RollType.KillingDamage) {
            resultRoll.stunMultiplier = damageForm.stunMultiplier;
        }

        resultRoll.hitLocationDetails = this.getHitLocationModifiers(hitLocationRoll);
        resultRoll.body = this.calculateBody(resultRoll);
        resultRoll.stun = this.calculateStun(resultRoll);
        resultRoll.knockback = this.calculateKnockback(
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
                    stun: resultRoll.stun!,
                    body: resultRoll.body!,
                    knockback: resultRoll.knockback!,
                },
            ];

            const newResultRoll: WorkingRoll = {...resultRoll};
            newResultRoll.rolls = resultRoll.rolls.slice();

            this.buildExplosionTable(resultRoll, newResultRoll);
        }

        return resultRoll as DamageResult;
    }

    rollEffect(effectForm: EffectForm): EffectResult {
        const resultRoll = this.roll(effectForm.dice, RollType.Effect, effectForm.partialDie) as WorkingRoll;

        resultRoll.effectForm = effectForm;

        return resultRoll as EffectResult;
    }

    rollAgain(lastResult: LastRoll): SkillCheckResult | ToHitResults | DamageResult | EffectResult {
        let numberOfRolls = 1;
        let last: SkillCheckResult | ToHitResult | DamageResult | EffectResult;

        if (Object.prototype.hasOwnProperty.call(lastResult, 'results')) {
            const toHit = lastResult as ToHitResults;
            numberOfRolls = toHit.results.length;
            last = toHit.results[0];
        } else {
            last = lastResult as SkillCheckResult | DamageResult | EffectResult;
        }

        switch (last.rollType) {
            case RollType.SkillCheck:
                return this.rollCheck(last.threshold + '-');
            case RollType.ToHit:
                return this.rollToHit(last.cv, numberOfRolls, last.isAutofire, last.targetDcv);
            case RollType.Effect:
                return this.rollEffect(last.effectForm);
            default:
                return this.rollDamage(last.damageForm);
        }
    }

    countNormalDamageBody(resultRoll: DiceRoll): number {
        let body = 0;

        for (const roll of resultRoll.rolls) {
            if (roll >= 2 && roll <= 5) {
                body += 1;
            } else if (roll === D6_MAX) {
                body += 2;
            }
        }

        return body;
    }

    countLuck(resultRoll: DiceRoll): number {
        let luckPoints = 0;

        for (const roll of resultRoll.rolls) {
            if (roll === D6_MAX) {
                luckPoints++;
            }
        }

        return luckPoints;
    }

    getPartialDieName(partialDieType: PartialDie): string {
        let name = 'None';

        if (partialDieType === PartialDie.PlusOne) {
            name = '+1 pip';
        } else if (partialDieType === PartialDie.MinusOne) {
            name = '1d6-1';
        } else if (partialDieType === PartialDie.Half) {
            name = '½d6';
        }

        return name;
    }

    private roll(dice: number, rollType: RollType, partialDieType?: PartialDie): WorkingRoll {
        const resultRoll: WorkingRoll = {
            rollType,
            total: 0,
            rolls: [],
            partialDieType: partialDieType || PartialDie.None,
        };

        for (let i = 0; i < dice; i++) {
            resultRoll.rolls.push(this.rng.next(ROLL_MIN, D6_MAX));
        }
        resultRoll.total = resultRoll.rolls.reduce((total, current) => total + current, 0);

        if (partialDieType === PartialDie.PlusOne) {
            resultRoll.total += 1;
        } else if (partialDieType === PartialDie.MinusOne) {
            let partialDie = this.rng.next(ROLL_MIN, D6_MAX);

            if (--partialDie < ROLL_MIN) {
                partialDie = ROLL_MIN;
            }

            resultRoll.total += partialDie;
            resultRoll.rolls.push(partialDie);
        } else if (partialDieType === PartialDie.Half) {
            const halfDie = this.rng.next(ROLL_MIN, D3_MAX);

            resultRoll.total += halfDie;
            resultRoll.rolls.push(halfDie);
        }

        return resultRoll;
    }

    private calculateStun(resultRoll: WorkingRoll): number {
        let stun = 0;

        if (resultRoll.rollType === RollType.KillingDamage) {
            if (resultRoll.damageForm!.useHitLocations) {
                stun = resultRoll.total * (resultRoll.hitLocationDetails!.stunX + toInt(resultRoll.stunMultiplier!));
            } else {
                if (resultRoll.stunModifier === undefined) {
                    resultRoll.stunModifier = 1;

                    if (resultRoll.damageForm!.useFifthEdition) {
                        resultRoll.stunModifier = this.rng.next(ROLL_MIN, D6_MAX);

                        if (--resultRoll.stunModifier === 0) {
                            resultRoll.stunModifier = 1;
                        }
                    } else {
                        resultRoll.stunModifier = this.rng.next(ROLL_MIN, D3_MAX);
                    }
                }

                stun = resultRoll.total * (resultRoll.stunModifier + toInt(resultRoll.stunMultiplier!));
            }
        } else {
            stun = resultRoll.total;
        }

        return stun;
    }

    private calculateBody(resultRoll: WorkingRoll): number {
        let body = 0;

        if (resultRoll.rollType === RollType.NormalDamage) {
            body += this.countNormalDamageBody(resultRoll);
        } else if (resultRoll.rollType === RollType.KillingDamage) {
            body += resultRoll.total;
        }

        return body;
    }

    private calculateKnockback(
        resultRoll: WorkingRoll,
        isTargetFlying?: boolean,
        isMartialManeuver?: boolean,
        zeroG?: boolean,
        underwater?: boolean,
        rolledWithPunch?: boolean,
        usingClinging?: boolean,
    ): number {
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

            if (resultRoll.rollType === RollType.KillingDamage) {
                knockbackDice++;
            }

            resultRoll.knockbackRollTotal = knockbackDice <= 0 ? 0 : this.roll(knockbackDice, RollType.Knockback).total;
        }

        return (resultRoll.body! - resultRoll.knockbackRollTotal) * 2;
    }

    private buildExplosionTable(resultRoll: WorkingRoll, newResultRoll: WorkingRoll): void {
        newResultRoll.rolls.shift();
        newResultRoll.total = newResultRoll.rolls.reduce((a, b) => a + b, 0);
        newResultRoll.stun = this.calculateStun(newResultRoll);
        newResultRoll.body = this.calculateBody(newResultRoll);
        newResultRoll.knockback = this.calculateKnockback(newResultRoll);

        resultRoll.explosion!.push({
            distance: (resultRoll.rolls.length - newResultRoll.rolls.length) * resultRoll.damageForm!.fadeRate * 2,
            stun: newResultRoll.stun,
            body: newResultRoll.body,
            knockback: newResultRoll.knockback,
        });

        if (newResultRoll.rolls.length >= 2) {
            this.buildExplosionTable(resultRoll, newResultRoll);
        }
    }

    private getHitLocationModifiers(hitLocationRoll: number): HitLocationDetails {
        if (hitLocationRoll >= 3 && hitLocationRoll <= 5) {
            return {location: 'Head', stunX: 5, nStun: 2, bodyX: 2};
        } else if (hitLocationRoll === 6) {
            return {location: 'Hands', stunX: 1, nStun: 0.5, bodyX: 0.5};
        } else if (hitLocationRoll >= 7 && hitLocationRoll <= 8) {
            return {location: 'Arms', stunX: 2, nStun: 0.5, bodyX: 0.5};
        } else if (hitLocationRoll === 9) {
            return {location: 'Shoulders', stunX: 3, nStun: 1, bodyX: 1};
        } else if (hitLocationRoll >= 10 && hitLocationRoll <= 11) {
            return {location: 'Chest', stunX: 3, nStun: 1, bodyX: 1};
        } else if (hitLocationRoll === 12) {
            return {location: 'Stomach', stunX: 4, nStun: 1.5, bodyX: 1};
        } else if (hitLocationRoll === 13) {
            return {location: 'Vitals', stunX: 4, nStun: 1.5, bodyX: 2};
        } else if (hitLocationRoll === 14) {
            return {location: 'Thighs', stunX: 2, nStun: 1, bodyX: 1};
        } else if (hitLocationRoll >= 15 && hitLocationRoll <= 16) {
            return {location: 'Legs', stunX: 2, nStun: 0.5, bodyX: 0.5};
        } else {
            return {location: 'Feet', stunX: 1, nStun: 0.5, bodyX: 0.5};
        }
    }
}
