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
 * The Quick Pick state: loads characters, resolves the nine slots, and owns the mutations.
 *
 * Two data sources feed the grid — the full list (for the picker, for resolving pinned ids, and for
 * the active ring) and the recent list (the suggestion pool). Pins live in {@link Settings}; a
 * mutation writes through `update`, and the grid re-derives from that in-memory change with no
 * reload. Reloading from the repository only matters when the *underlying* data moves (a character
 * opened, deleted, or its active flag changed elsewhere), which the host signals via `refreshToken`.
 */
import {useCallback, useEffect, useMemo, useState} from 'react';
import type {CharacterSummary} from 'core/ports';
import {useRepositories} from 'app/providers/RepositoriesProvider';
import {useSettings} from 'app/providers/SettingsProvider';
import {computeSlots, normalizePins, SLOT_COUNT, type Slot} from './quickPick/slots';

export interface QuickPickController {
    slots: Slot[];
    /** Every character, for the picker to choose from. */
    candidates: CharacterSummary[];
    loading: boolean;
    /** Make a character active and hand it to the host to open. */
    activate: (id: string) => void;
    /** Pin a character at a grid position, clearing any slot it already occupied. */
    pin: (position: number, id: string) => void;
    /** Empty a grid position. */
    removePin: (position: number) => void;
    reload: () => void;
}

export interface UseQuickPickOptions {
    onActivate: (id: string) => void;
    /** Bump to force a reload — the navigator does this when Quick Pick's host regains focus. */
    refreshToken?: unknown;
}

export function useQuickPick({onActivate, refreshToken}: UseQuickPickOptions): QuickPickController {
    const {characters} = useRepositories();
    const {settings, update} = useSettings();
    const [all, setAll] = useState<CharacterSummary[] | undefined>(undefined);
    const [recents, setRecents] = useState<CharacterSummary[]>([]);

    const load = useCallback(async () => {
        try {
            const [list, recent] = await Promise.all([characters.list(), characters.recent(SLOT_COUNT)]);
            setAll(list);
            setRecents(recent);
        } catch {
            setAll([]);
            setRecents([]);
        }
    }, [characters]);

    useEffect(() => {
        load();
    }, [load, refreshToken]);

    const pins = useMemo(() => normalizePins(settings.pinnedCharacterIds), [settings.pinnedCharacterIds]);
    const byId = useMemo(() => new Map((all ?? []).map((character) => [character.id, character])), [all]);
    const slots = useMemo(() => computeSlots(pins, recents, byId), [pins, recents, byId]);

    const activate = useCallback(
        (id: string) => {
            characters.setActive(id).catch(() => {
                // Best-effort: navigation still proceeds, and the sheet re-reads the DB on next load.
            });
            onActivate(id);
        },
        [characters, onActivate],
    );

    const pin = useCallback(
        (position: number, id: string) => {
            const next = normalizePins(settings.pinnedCharacterIds);
            // A character occupies exactly one slot — clear any existing home before parking it here.
            for (let i = 0; i < next.length; i++) {
                if (next[i] === id) {
                    next[i] = null;
                }
            }
            next[position] = id;
            update('pinnedCharacterIds', normalizePins(next));
        },
        [settings.pinnedCharacterIds, update],
    );

    const removePin = useCallback(
        (position: number) => {
            const next = normalizePins(settings.pinnedCharacterIds);
            next[position] = null;
            update('pinnedCharacterIds', next);
        },
        [settings.pinnedCharacterIds, update],
    );

    return {slots, candidates: all ?? [], loading: all === undefined, activate, pin, removePin, reload: load};
}
