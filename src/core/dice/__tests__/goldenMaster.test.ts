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
 * Golden-master harness for the dice engine.
 *
 * We run the *real* legacy `DieRoller` (from the sibling `master` worktree) and
 * the freshly ported `core/dice` `DieRoller` off the identical seeded RNG stream,
 * then assert their result objects are byte-for-byte equal across every roll
 * type and edge case. The legacy roller's two couplings are stubbed out:
 *   - `App.getRandomNumber` -> a seeded generator (mocked below),
 *   - `Statistics` -> a no-op (so no Persistence/SQLite is dragged in).
 *
 * This is the safety net described in REBUILD_PLAN.md: a rules engine fails
 * silently, so we pin the ported numbers to the legacy numbers permanently.
 */
import type {Rng} from 'core/ports';
import {DieRoller} from 'core/dice';
import {PartialDie, RollType, type DamageForm, type EffectForm} from 'core/dice';
import {seededRng} from './support/seededRng';

// Seeded generator feeding the legacy roller's mocked `getRandomNumber`. Reset
// per scenario. Named `mock*` so jest's factory-hoist allows the reference.
let mockRng: Rng;

jest.mock('../../../../../hero-system-mobile/App', () => ({
    getRandomNumber: (min: number, max: number, rolls = 1): number | number[] => {
        const out: number[] = [];
        for (let i = 0; i < rolls; i++) {
            out.push(mockRng.next(min, max));
        }
        return out.length === 1 ? out[0] : out;
    },
}));

jest.mock('../../../../../hero-system-mobile/src/lib/Statistics', () => ({
    statistics: {add: () => Promise.resolve()},
}));

const legacy = require('../../../../../hero-system-mobile/src/lib/DieRoller') as {
    dieRoller: {
        rollCheck(db: unknown, threshold?: string | null): unknown;
        rollToHit(db: unknown, cv: number, numberOfRolls: number, isAutofire: boolean, targetDcv: number): unknown;
        rollDamage(db: unknown, form: DamageForm): unknown;
        rollEffect(db: unknown, form: EffectForm): unknown;
        rollAgain(db: unknown, last: unknown): unknown;
    };
};

/** Shared surface so a scenario can drive legacy and core identically. */
interface RollerLike {
    rollCheck(threshold?: string | null): unknown;
    rollToHit(cv: number, numberOfRolls: number, isAutofire: boolean, targetDcv: number): unknown;
    rollDamage(form: DamageForm): unknown;
    rollEffect(form: EffectForm): unknown;
    rollAgain(last: unknown): unknown;
}

// Adapts the legacy `dieRoller` singleton (db-first args, stat side effects) to
// the decoupled core surface, so scenarios are written once.
const legacyRoller: RollerLike = {
    rollCheck: (threshold) => legacy.dieRoller.rollCheck(null, threshold),
    rollToHit: (cv, n, autofire, dcv) => legacy.dieRoller.rollToHit(null, cv, n, autofire, dcv),
    rollDamage: (form) => legacy.dieRoller.rollDamage(null, form),
    rollEffect: (form) => legacy.dieRoller.rollEffect(null, form),
    rollAgain: (last) => legacy.dieRoller.rollAgain(null, last),
};

const baseDamage: DamageForm = {
    dice: 12,
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

const killing: DamageForm = {...baseDamage, damageType: RollType.KillingDamage, dice: 2, stunMultiplier: 1};

const baseEffect: EffectForm = {dice: 3, partialDie: PartialDie.None, effectType: 'None', sfx: null};

interface Scenario {
    name: string;
    act: (roller: RollerLike) => unknown;
}

const scenarios: Scenario[] = [
    {name: 'skill check, no threshold', act: (r) => r.rollCheck()},
    {name: 'skill check, simple threshold', act: (r) => r.rollCheck('11-')},
    {name: 'skill check, compound threshold', act: (r) => r.rollCheck('13- / 11-')},
    {name: 'to-hit, single non-autofire', act: (r) => r.rollToHit(7, 1, false, 0)},
    {name: 'to-hit, autofire 5 rolls', act: (r) => r.rollToHit(8, 5, true, 4)},
    {name: 'normal damage', act: (r) => r.rollDamage(baseDamage)},
    {name: 'normal damage, hit locations', act: (r) => r.rollDamage({...baseDamage, useHitLocations: true})},
    {name: 'normal damage, +1 pip', act: (r) => r.rollDamage({...baseDamage, partialDie: PartialDie.PlusOne})},
    {name: 'normal damage, half die', act: (r) => r.rollDamage({...baseDamage, partialDie: PartialDie.Half})},
    {name: 'normal damage, minus one', act: (r) => r.rollDamage({...baseDamage, partialDie: PartialDie.MinusOne})},
    {name: 'killing damage, 6E no hit locations', act: (r) => r.rollDamage(killing)},
    {name: 'killing damage, 5E no hit locations', act: (r) => r.rollDamage({...killing, useFifthEdition: true})},
    {name: 'killing damage, hit locations', act: (r) => r.rollDamage({...killing, useHitLocations: true})},
    {name: 'explosion, normal', act: (r) => r.rollDamage({...baseDamage, dice: 6, isExplosion: true})},
    {name: 'explosion, killing', act: (r) => r.rollDamage({...killing, dice: 4, isExplosion: true})},
    {
        name: 'knockback flags, all set',
        act: (r) =>
            r.rollDamage({
                ...baseDamage,
                isMartialManeuver: true,
                isTargetUnderwater: true,
                isUsingClinging: true,
                isTargetFlying: true,
                isTargetInZeroG: true,
                rollWithPunch: true,
            }),
    },
    {name: 'effect', act: (r) => r.rollEffect(baseEffect)},
    {name: 'effect, half die', act: (r) => r.rollEffect({...baseEffect, partialDie: PartialDie.Half})},
    {name: 'roll again from damage', act: (r) => r.rollAgain(r.rollDamage(baseDamage))},
    {name: 'roll again from to-hit', act: (r) => r.rollAgain(r.rollToHit(7, 2, false, 0))},
    {name: 'roll again from skill check', act: (r) => r.rollAgain(r.rollCheck('11-'))},
    {name: 'roll again from effect', act: (r) => r.rollAgain(r.rollEffect(baseEffect))},
];

const SEEDS = Array.from({length: 30}, (_unused, i) => i + 1);

describe('golden master: core/dice DieRoller reproduces legacy DieRoller', () => {
    for (const {name, act} of scenarios) {
        describe(name, () => {
            it.each(SEEDS)('matches legacy at seed %i', (seed) => {
                mockRng = seededRng(seed);
                const legacyResult = act(legacyRoller);

                const core = new DieRoller(seededRng(seed));
                const coreResult = act(core);

                expect(coreResult).toEqual(legacyResult);
            });
        });
    }
});
