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
import {combatDetails} from './combatDetails';

type Obj = Record<string, any>;

/** Per-phase tracking flag: acted this turn, or aborted to a defensive action. */
export interface CombatPhase {
    used: boolean;
    aborted: boolean;
}

/**
 * The live, mutable combat state for a character: current health, current combat
 * values (temporary modifiers baked in), and the per-segment phase chart. Derived
 * from the golden-mastered {@link combatDetails}; every reducer below is pure and
 * returns a fresh state (no mutation), so it is trivially testable and safe to
 * persist as-is.
 */
export interface CombatState {
    stun: number;
    body: number;
    endurance: number;
    ocv: number;
    dcv: number;
    omcv: number;
    dmcv: number;
    phases: Record<string, CombatPhase>;
}

/** The character's maximum vitals — recovery and reset ceilings. */
export interface CombatMaximums {
    stun: number;
    body: number;
    endurance: number;
    recovery: number;
}

export type Vital = 'stun' | 'body' | 'endurance';
export type CombatValueKey = 'ocv' | 'dcv' | 'omcv' | 'dmcv';

const clonePhases = (phases: Record<string, CombatPhase> | undefined): Record<string, CombatPhase> => {
    const out: Record<string, CombatPhase> = {};
    for (const key of Object.keys(phases ?? {})) {
        out[key] = {used: Boolean(phases![key].used), aborted: Boolean(phases![key].aborted)};
    }

    return out;
};

/** Maximum vitals (totals, including power bonuses) for recovery/reset ceilings. */
export function combatMaximums(character: Obj): CombatMaximums {
    return {
        stun: heroDesignerCharacter.getCharacteristicTotal('STUN', character),
        body: heroDesignerCharacter.getCharacteristicTotal('BODY', character),
        endurance: heroDesignerCharacter.getCharacteristicTotal('END', character),
        recovery: heroDesignerCharacter.getCharacteristicTotal('REC', character),
    };
}

/** Fresh combat state at full health with an empty phase chart (nothing used yet). */
export function initialCombatState(character: Obj): CombatState {
    // combatDetails.init flips showSecondary as it works, so give it its own copy.
    const primary = combatDetails.init({...character}).primary as Obj;

    return {
        stun: Number(primary.stun) || 0,
        body: Number(primary.body) || 0,
        endurance: Number(primary.endurance) || 0,
        ocv: Number(primary.ocv) || 0,
        dcv: Number(primary.dcv) || 0,
        omcv: Number(primary.omcv) || 0,
        dmcv: Number(primary.dmcv) || 0,
        phases: clonePhases(primary.phases as Record<string, CombatPhase>),
    };
}

/** Set a vital to an explicit value (e.g. after typing damage taken). */
export function setVital(state: CombatState, vital: Vital, value: number): CombatState {
    return {...state, [vital]: value};
}

/** Restore a single vital to its maximum. */
export function resetVital(state: CombatState, vital: Vital, max: CombatMaximums): CombatState {
    return {...state, [vital]: max[vital]};
}

/**
 * Take a Recovery: add REC to STUN and END, each capped at its maximum. BODY is
 * unaffected (it heals over days, not in combat) — faithful to legacy.
 */
export function takeRecovery(state: CombatState, max: CombatMaximums): CombatState {
    return {
        ...state,
        stun: Math.min(max.stun, state.stun + max.recovery),
        endurance: Math.min(max.endurance, state.endurance + max.recovery),
    };
}

/** Nudge a combat value by a delta (temporary modifiers from levels, maneuvers, etc.). */
export function adjustCombatValue(state: CombatState, key: CombatValueKey, delta: number): CombatState {
    return {...state, [key]: state[key] + delta};
}

/** Restore combat values to the character's base (clears temporary modifiers). */
export function resetCombatValues(state: CombatState, character: Obj): CombatState {
    const base = initialCombatState(character);

    return {...state, ocv: base.ocv, dcv: base.dcv, omcv: base.omcv, dmcv: base.dmcv};
}

/** Toggle a phase's used flag; using clears any abort on that phase. */
export function togglePhaseUsed(state: CombatState, phase: string): CombatState {
    const current = state.phases[phase];
    if (current === undefined) {
        return state;
    }

    return {...state, phases: {...state.phases, [phase]: {used: !current.used, aborted: false}}};
}

/** Toggle a phase's aborted flag; aborting clears any used on that phase. */
export function togglePhaseAborted(state: CombatState, phase: string): CombatState {
    const current = state.phases[phase];
    if (current === undefined) {
        return state;
    }

    return {...state, phases: {...state.phases, [phase]: {aborted: !current.aborted, used: false}}};
}

/** Clear every phase's used/aborted flags — the start of a new turn. */
export function startNewTurn(state: CombatState): CombatState {
    const phases: Record<string, CombatPhase> = {};
    for (const key of Object.keys(state.phases)) {
        phases[key] = {used: false, aborted: false};
    }

    return {...state, phases};
}

/**
 * Reconcile a stored state's phase chart against the character's current SPD:
 * keep flags for phases that still exist, add any new phases fresh, drop the rest.
 * Lets a persisted state survive a re-import that changed the character's speed.
 */
export function reconcilePhases(state: CombatState, character: Obj): CombatState {
    const fresh = initialCombatState(character).phases;
    const phases: Record<string, CombatPhase> = {};

    for (const key of Object.keys(fresh)) {
        const existing = state.phases[key];
        phases[key] = existing === undefined ? {used: false, aborted: false} : {used: Boolean(existing.used), aborted: Boolean(existing.aborted)};
    }

    return {...state, phases};
}
