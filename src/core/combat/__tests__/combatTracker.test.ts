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

import {heroDesignerCharacter} from 'core/hero';
import type {Obj} from 'core/traits';
import {
    addStatus,
    adjustCombatValue,
    clearStatuses,
    combatMaximums,
    describeStatus,
    initialCombatState,
    normalizeCombatState,
    reconcilePhases,
    removeStatus,
    resetCombatValues,
    resetVital,
    setVital,
    startNewTurn,
    takeRecovery,
    togglePhaseAborted,
    togglePhaseUsed,
    updateStatus,
    type CombatState,
    type CombatStatus,
} from '../combatTracker';

const load = (fixture: string): Obj => heroDesignerCharacter.getCharacter(JSON.parse(JSON.stringify(require(`../../hero/__tests__/fixtures/${fixture}.json`))) as never) as unknown as Obj;

// A minimal state for reducer tests that don't need a real character.
const state = (over: Partial<CombatState> = {}): CombatState => ({
    stun: 20,
    body: 10,
    endurance: 20,
    ocv: 8,
    dcv: 8,
    omcv: 3,
    dmcv: 3,
    phases: {'6': {used: false, aborted: false}, '12': {used: false, aborted: false}},
    statuses: [],
    ...over,
});

describe('combatTracker', () => {
    describe('initialCombatState', () => {
        it('seeds full health, combat values, and an empty phase chart (6E)', () => {
            const defensor = load('defensor');
            const initial = initialCombatState(defensor);

            expect(initial.stun).toBeGreaterThan(0);
            expect(initial.ocv).toBeGreaterThan(0);
            expect(Object.keys(initial.phases).length).toBeGreaterThan(0);
            expect(Object.values(initial.phases).every((phase) => !phase.used && !phase.aborted)).toBe(true);
        });

        it('does not mutate the character it reads (showSecondary preserved)', () => {
            const defensor = load('defensor');
            defensor.showSecondary = false;
            initialCombatState(defensor);
            expect(defensor.showSecondary).toBe(false);
        });
    });

    describe('recovery', () => {
        it('adds REC to STUN and END, capping at the maximum, leaving BODY alone', () => {
            const max = {stun: 30, body: 12, endurance: 40, recovery: 10};
            const recovered = takeRecovery(state({stun: 5, body: 3, endurance: 35}), max);

            expect(recovered.stun).toBe(15); // 5 + 10
            expect(recovered.endurance).toBe(40); // 35 + 10 capped at 40
            expect(recovered.body).toBe(3); // untouched
        });
    });

    it('sets and resets a single vital', () => {
        const max = {stun: 30, body: 12, endurance: 40, recovery: 10};
        expect(setVital(state(), 'stun', 4).stun).toBe(4);
        expect(resetVital(state({stun: 4}), 'stun', max).stun).toBe(30);
    });

    it('nudges and resets combat values', () => {
        const defensor = load('defensor');
        const base = initialCombatState(defensor);

        const bumped = adjustCombatValue(adjustCombatValue(base, 'ocv', 2), 'dcv', -1);
        expect(bumped.ocv).toBe(base.ocv + 2);
        expect(bumped.dcv).toBe(base.dcv - 1);

        const reset = resetCombatValues(bumped, defensor);
        expect(reset.ocv).toBe(base.ocv);
        expect(reset.dcv).toBe(base.dcv);
    });

    describe('phases', () => {
        it('toggles used and aborted mutually exclusively', () => {
            let s = togglePhaseUsed(state(), '6');
            expect(s.phases['6']).toEqual({used: true, aborted: false});

            s = togglePhaseAborted(s, '6');
            expect(s.phases['6']).toEqual({used: false, aborted: true}); // abort clears used

            s = togglePhaseUsed(s, '6');
            expect(s.phases['6']).toEqual({used: true, aborted: false}); // use clears abort
        });

        it('ignores a phase the character does not have', () => {
            const s = togglePhaseUsed(state(), '3');
            expect(s).toEqual(state());
        });

        it('clears every flag on a new turn', () => {
            const used = togglePhaseAborted(togglePhaseUsed(state(), '6'), '12');
            const fresh = startNewTurn(used);
            expect(Object.values(fresh.phases).every((phase) => !phase.used && !phase.aborted)).toBe(true);
        });

        it('is a pure reducer — the input state is not mutated', () => {
            const before = state();
            togglePhaseUsed(before, '6');
            expect(before.phases['6']).toEqual({used: false, aborted: false});
        });
    });

    describe('reconcilePhases', () => {
        it('keeps flags for surviving phases and drops the rest', () => {
            const defensor = load('defensor');
            const fresh = initialCombatState(defensor);
            const segments = Object.keys(fresh.phases);

            // Mark the first surviving segment used, plus a stale segment that no longer exists.
            const stored: CombatState = {
                ...fresh,
                phases: {...fresh.phases, [segments[0]]: {used: true, aborted: false}, '99': {used: true, aborted: false}},
            };

            const reconciled = reconcilePhases(stored, defensor);
            expect(reconciled.phases[segments[0]]).toEqual({used: true, aborted: false});
            expect(reconciled.phases['99']).toBeUndefined();
            expect(Object.keys(reconciled.phases).sort()).toEqual(segments.slice().sort());
        });
    });

    describe('statuses', () => {
        const aid: CombatStatus = {name: 'Aid', label: 'Blessing', activePoints: 15, targetTrait: 'STR'};

        it('adds, updates, and removes statuses immutably', () => {
            const withOne = addStatus(state(), aid);
            expect(withOne.statuses).toEqual([aid]);

            const drain: CombatStatus = {name: 'Drain', label: '', activePoints: -10, targetTrait: 'DEX'};
            const updated = updateStatus(withOne, 0, drain);
            expect(updated.statuses).toEqual([drain]);

            const removed = removeStatus(updated, 0);
            expect(removed.statuses).toEqual([]);

            expect(state().statuses).toEqual([]); // original untouched
        });

        it('ignores an out-of-range update', () => {
            const s = addStatus(state(), aid);
            expect(updateStatus(s, 5, aid)).toBe(s);
        });

        it('clears all statuses', () => {
            const s = addStatus(addStatus(state(), aid), aid);
            expect(clearStatuses(s).statuses).toEqual([]);
        });

        it('describes each status type the way the sheet lists it', () => {
            expect(describeStatus(aid)).toBe('Blessing (Aid): +15 AP to STR');
            expect(describeStatus({name: 'Drain', label: '', activePoints: -10, targetTrait: 'DEX'})).toBe('Drain: -10 AP to DEX');
            expect(describeStatus({name: 'Entangle', label: 'Web', body: 4, pd: 3, ed: 2})).toBe('Web (Entangle): 4 BODY, 3/2');
            expect(describeStatus({name: 'Flash', label: '', segments: 3})).toBe('Flash: For 3 segments');
        });

        it('normalizes a legacy state that predates statuses', () => {
            const legacy = {stun: 1, body: 1, endurance: 1, ocv: 1, dcv: 1, omcv: 0, dmcv: 0, phases: {}} as unknown as CombatState;
            expect(normalizeCombatState(legacy).statuses).toEqual([]);
        });
    });

    it('exposes maximum vitals from the character totals', () => {
        const defensor = load('defensor');
        const max = combatMaximums(defensor);
        expect(max.stun).toBe(heroDesignerCharacter.getCharacteristicTotal('STUN', defensor));
        expect(max.recovery).toBe(heroDesignerCharacter.getCharacteristicTotal('REC', defensor));
    });
});
