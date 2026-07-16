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

import React, {createContext, useCallback, useContext, useEffect, useMemo, useState} from 'react';
import {
    combatMaximums,
    enduranceBurnDice,
    initialCombatState,
    normalizeCombatState,
    reconcilePhases,
    setVital,
    spendEndurance,
    type CombatMaximums,
    type CombatState,
} from 'core/combat';
import {PartialDie} from 'core/dice';
import type {Obj} from 'core/traits';
import {useDieRoller} from 'app/providers/DiceProvider';
import {useRepositories} from 'app/providers/RepositoriesProvider';

/** What a single END spend did: how much was asked, how much the pool couldn't cover, and the STUN it cost. */
export interface SpendOutcome {
    amount: number;
    shortfall: number;
    stunLost: number;
}

export interface CombatStateApi {
    /** Live combat state, or null while it loads. */
    state: CombatState | null;
    /** The character's maximum vitals (recovery/reset ceilings). */
    max: CombatMaximums;
    /** Persist a new state (from a reducer) and share it with every consumer. */
    apply: (next: CombatState) => void;
    /**
     * Spend END from the shared pool, burning STUN for any shortfall (6E). Returns what happened so
     * the caller can show feedback, or null if there's nothing to spend / no state yet.
     */
    spend: (amount: number) => SpendOutcome | null;
    /** The most recent spend, for a transient "spent N END" readout. */
    lastSpend: SpendOutcome | null;
}

const CombatStateContext = createContext<CombatStateApi | null>(null);

/**
 * Owns one character's live combat state above the Character/Combat tab split, so a power tapped on
 * the sheet and the tracker's own controls spend from the **same** END pool and both stay in sync.
 * Seeds from the character's derived maximums, persists every change per-character, and settles the
 * STUN-burn die roll here (the one place with both the pool and the roller).
 */
export function CombatStateProvider({character, characterId, children}: {character: Obj; characterId: string; children: React.ReactNode}): React.JSX.Element {
    const {combatState: repository} = useRepositories();
    const roller = useDieRoller();
    const max = useMemo(() => combatMaximums(character), [character]);

    const [state, setState] = useState<CombatState | null>(null);
    const [lastSpend, setLastSpend] = useState<SpendOutcome | null>(null);

    useEffect(() => {
        let cancelled = false;
        (async () => {
            const stored = await repository.get(characterId);
            const base = normalizeCombatState(stored === null ? initialCombatState(character) : reconcilePhases(stored, character));
            if (stored === null || JSON.stringify(base) !== JSON.stringify(stored)) {
                await repository.save(characterId, base);
            }
            if (!cancelled) {
                setState(base);
                setLastSpend(null);
            }
        })();
        return () => {
            cancelled = true;
        };
    }, [repository, characterId, character]);

    const apply = useCallback(
        (next: CombatState) => {
            setState(next);
            repository.save(characterId, next).catch(() => {
                // Best-effort persist; in-memory state already reflects the change.
            });
        },
        [repository, characterId],
    );

    const spend = useCallback(
        (amount: number): SpendOutcome | null => {
            if (state === null || amount <= 0) {
                return null;
            }
            const {state: next, shortfall} = spendEndurance(state, amount);
            let stunLost = 0;
            if (shortfall > 0) {
                stunLost = roller.rollEffect({dice: enduranceBurnDice(shortfall), partialDie: PartialDie.None}).total;
                apply(setVital(next, 'stun', next.stun - stunLost));
            } else {
                apply(next);
            }
            const outcome: SpendOutcome = {amount, shortfall, stunLost};
            setLastSpend(outcome);
            return outcome;
        },
        [state, roller, apply],
    );

    const api = useMemo<CombatStateApi>(() => ({state, max, apply, spend, lastSpend}), [state, max, apply, spend, lastSpend]);

    return <CombatStateContext.Provider value={api}>{children}</CombatStateContext.Provider>;
}

/** The shared combat state, or null when rendered outside a {@link CombatStateProvider}. */
export function useCombatState(): CombatStateApi | null {
    return useContext(CombatStateContext);
}

/** One-line summary of a spend for a transient readout: "Spent 6 END", or the STUN burn when short. */
export function describeSpend(outcome: SpendOutcome): string {
    if (outcome.shortfall > 0) {
        return `Spent ${outcome.amount} END · ${outcome.shortfall} short → ${outcome.stunLost} STUN`;
    }

    return `Spent ${outcome.amount} END`;
}
