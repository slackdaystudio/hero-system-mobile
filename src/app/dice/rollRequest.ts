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

import {DieRoller, PartialDie, RollType, type DamageForm, type LastRoll} from 'core/dice';
import type {RollDescriptor} from 'core/traits';
import {accumulateStatistics, type StatisticsRoll} from 'core/statistics';
import type {Statistics} from 'core/ports';

/**
 * A serializable description of a roll to make — the shared currency between the
 * dice screen (which builds one from its inputs, or receives one to pre-fill) and
 * the character sheet (which builds one from a tapped characteristic/trait roll).
 */
export type RollRequest =
    | {mode: 'skill'; threshold: number; label?: string}
    | {mode: 'hit'; ocv: number; dcv: number; label?: string}
    | {mode: 'normal' | 'killing' | 'effect'; dice: number; partialDie: PartialDie; label?: string};

export const damageForm = (dice: number, damageType: RollType.NormalDamage | RollType.KillingDamage, partialDie: PartialDie): DamageForm => ({
    dice,
    damageType,
    partialDie,
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
    fadeRate: 5,
    sfx: null,
});

/** Execute a request against a roller, producing a domain roll result. */
export function performRoll(roller: DieRoller, request: RollRequest): LastRoll {
    switch (request.mode) {
        case 'skill':
            return roller.rollCheck(`${request.threshold}-`);
        case 'hit':
            return roller.rollToHit(request.ocv, 1, false, request.dcv);
        case 'normal':
            return roller.rollDamage(damageForm(request.dice, RollType.NormalDamage, request.partialDie));
        case 'killing':
            return roller.rollDamage(damageForm(request.dice, RollType.KillingDamage, request.partialDie));
        case 'effect':
            return roller.rollEffect({dice: request.dice, partialDie: request.partialDie});
        default:
            throw new Error('unknown roll request');
    }
}

/** Map a roll result to the statistics rolls it should record (one per die-group). */
export function statisticsRollsFor(result: LastRoll): StatisticsRoll[] {
    if ('results' in result) {
        return result.results.map((hit) => ({rollType: hit.rollType, rolls: hit.rolls}));
    }
    if (result.rollType === RollType.NormalDamage || result.rollType === RollType.KillingDamage) {
        return [{rollType: result.rollType, rolls: result.rolls, stun: result.stun, body: result.body, knockback: result.knockback, hitLocationDetails: result.hitLocationDetails}];
    }
    return [{rollType: result.rollType, rolls: result.rolls}];
}

/** Fold a result into the aggregate (used after both screen rolls and sheet rolls). */
export const recordRoll = (stats: Statistics, result: LastRoll): Statistics => statisticsRollsFor(result).reduce(accumulateStatistics, stats);

const parseLeadingInt = (value: string, fallback: number): number => {
    const parsed = Number.parseInt(value, 10);
    return Number.isNaN(parsed) ? fallback : parsed;
};

const parsePartialDie = (roll: string): PartialDie => {
    if (roll.includes('½')) {
        return PartialDie.Half;
    }
    if (/\+\s*1(?!\d)/.test(roll)) {
        return PartialDie.PlusOne;
    }
    if (/d6\s*-\s*1(?!\d)/.test(roll)) {
        return PartialDie.MinusOne;
    }
    return PartialDie.None;
};

/** A characteristic roll (e.g. "13-") becomes a skill check against that number. */
export function characteristicRollRequest(roll: string | null, label: string): RollRequest | null {
    if (roll === null) {
        return null;
    }
    return {mode: 'skill', threshold: parseLeadingInt(roll, 11), label};
}

/** A decorated trait's roll becomes the matching skill / damage / effect request. */
export function traitRollRequest(roll: RollDescriptor | null, label: string): RollRequest | null {
    if (roll === null) {
        return null;
    }
    switch (roll.type) {
        case RollType.SkillCheck:
            return {mode: 'skill', threshold: parseLeadingInt(roll.roll, 11), label};
        case RollType.NormalDamage:
            return {mode: 'normal', dice: parseLeadingInt(roll.roll, 1), partialDie: parsePartialDie(roll.roll), label};
        case RollType.KillingDamage:
            return {mode: 'killing', dice: parseLeadingInt(roll.roll, 1), partialDie: parsePartialDie(roll.roll), label};
        case RollType.Effect:
            return {mode: 'effect', dice: parseLeadingInt(roll.roll, 1), partialDie: parsePartialDie(roll.roll), label};
        default:
            return null;
    }
}

/** A one-line-ish summary of a result, for the sheet's immediate-roll popup. */
export function describeRoll(result: LastRoll): {title: string; lines: string[]; dice: number[]} {
    if ('results' in result) {
        const hit = result.results[0];
        return {title: 'To Hit', lines: [`Rolled ${hit.total}`, `Hits DCV ≤ ${hit.hitCv}`, hit.targetDcv <= hit.hitCv ? 'HIT' : 'MISS'], dice: hit.rolls};
    }
    if (result.rollType === RollType.SkillCheck) {
        const threshold = Number(result.threshold);
        const margin = threshold - result.total;
        const lines = [`Rolled ${result.total}`];
        if (result.threshold !== -1 && !Number.isNaN(threshold)) {
            lines.push(margin >= 0 ? `Made by ${margin}` : `Missed by ${-margin}`);
        }
        return {title: 'Skill Check', lines, dice: result.rolls};
    }
    if (result.rollType === RollType.NormalDamage || result.rollType === RollType.KillingDamage) {
        const kind = result.rollType === RollType.NormalDamage ? 'Normal Damage' : 'Killing Damage';
        return {title: kind, lines: [`STUN ${result.stun}`, `BODY ${result.body}`, `Knockback ${Math.max(0, result.knockback)}m`], dice: result.rolls};
    }
    return {title: 'Effect', lines: [`Effect ${result.total}`], dice: result.rolls};
}
