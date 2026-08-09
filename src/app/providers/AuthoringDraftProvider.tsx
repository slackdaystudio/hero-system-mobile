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
 * The draft being authored, shared by the screens that edit it.
 *
 * Editing one trait happens on its own screen, so the draft cannot live in either screen's
 * `useState` — the trait editor would have to hand its result back through navigation, and route
 * params are meant to be serialisable identifiers rather than a whole character.
 *
 * So the draft lives here and the screens address parts of it by **category and index**. Context
 * plus `useState`, which is how this app holds state everywhere (see the Phase 3 note in
 * CLAUDE.md — there is deliberately no redux).
 */
import React, {createContext, useCallback, useContext, useMemo, useRef, useState} from 'react';
import {emptyDraft, type AuthoredCharacter, type AuthoredFramework, type AuthoredPower, type AuthoredSlot, type AuthoredTrait} from 'core/authoring';

/** Where a trait lives on a draft. `frameworks` is addressed separately — its traits nest. */
export type DraftKey = 'skills' | 'perks' | 'talents' | 'powers' | 'martialArts' | 'equipment' | 'complications';

/**
 * Which trait an editor is editing.
 *
 * A framework slot needs two indices — which framework, then which slot — so it gets its own
 * shape rather than being squeezed into the flat one. Both are plain data, so a route can carry
 * one without anybody having to think about serialisability.
 */
export type TraitAddress =
    | {readonly kind: 'trait'; readonly key: DraftKey; readonly index: number}
    | {readonly kind: 'slot'; readonly framework: number; readonly index: number}
    /** A framework's pool. Not a trait — it has no catalogue entry — but it does carry modifiers. */
    | {readonly kind: 'pool'; readonly framework: number}
    /**
     * One power inside a Compound Power.
     *
     * Its own shape rather than a nested address, because a compound power holds powers and nothing
     * else — no compound power inside a compound power, no compound power as a framework slot. The
     * data has no such case and a general nested address would be describing a tree the rules do not
     * have; see the same reasoning on nested adders.
     */
    | {readonly kind: 'compound'; readonly key: DraftKey; readonly index: number; readonly child: number};

interface DraftApi {
    readonly draft: AuthoredCharacter;
    readonly setDraft: (draft: AuthoredCharacter) => void;
    /**
     * Start a fresh authoring session from `initial`.
     *
     * The provider outlives any one screen — that is the point of it — so something has to say
     * when a *new* character is being authored rather than the same one being navigated around.
     * `sessionKey` is that: reset happens when the key changes, so returning from the trait form
     * does not wipe the draft.
     */
    readonly beginSession: (sessionKey: string, initial?: AuthoredCharacter) => void;
    /** Read the trait at an address, or null when the address no longer points at one. */
    readonly traitAt: (address: TraitAddress) => AuthoredTrait | null;
    /** Read a framework by index, or null when it has gone. */
    readonly frameworkAt: (index: number) => AuthoredFramework | null;
    /** Replace a framework by index. */
    readonly replaceFramework: (index: number, framework: AuthoredFramework) => void;
    /** Replace the trait at an address. A no-op if the address has gone stale. */
    readonly replaceAt: (address: TraitAddress, trait: AuthoredTrait) => void;
    /** Remove the trait at an address. */
    readonly removeAt: (address: TraitAddress) => void;
}

const DraftContext = createContext<DraftApi | null>(null);

export interface AuthoringDraftProviderProps {
    /** What to start from — a stored draft when re-opening, an empty one when creating. */
    initial?: AuthoredCharacter;
    children: React.ReactNode;
}

export function AuthoringDraftProvider({initial, children}: AuthoringDraftProviderProps): React.JSX.Element {
    const [draft, setDraft] = useState<AuthoredCharacter>(initial ?? emptyDraft('6E'));
    const session = useRef<string | null>(null);

    const beginSession = useCallback((sessionKey: string, seed?: AuthoredCharacter): void => {
        if (session.current === sessionKey) {
            return;
        }

        session.current = sessionKey;
        setDraft(seed ?? emptyDraft('6E'));
    }, []);

    const traitAt = useCallback(
        (address: TraitAddress): AuthoredTrait | null => {
            if (address.kind === 'pool') {
                return null; // a pool is not a trait; see `frameworkAt`
            }

            if (address.kind === 'compound') {
                return (draft[address.key][address.index] as AuthoredPower | undefined)?.powers?.[address.child] ?? null;
            }

            return address.kind === 'trait' ? draft[address.key][address.index] ?? null : draft.frameworks[address.framework]?.slots[address.index] ?? null;
        },
        [draft],
    );

    const frameworkAt = useCallback((index: number): AuthoredFramework | null => draft.frameworks[index] ?? null, [draft]);

    const replaceFramework = useCallback(
        (index: number, framework: AuthoredFramework): void =>
            setDraft({...draft, frameworks: draft.frameworks.map((entry, position) => (position === index ? framework : entry))}),
        [draft],
    );

    const replaceAt = useCallback(
        (address: TraitAddress, trait: AuthoredTrait): void => {
            if (address.kind === 'pool') {
                return;
            }

            if (address.kind === 'compound') {
                setDraft({
                    ...draft,
                    [address.key]: draft[address.key].map((entry, index) =>
                        index !== address.index
                            ? entry
                            : {
                                  ...entry,
                                  powers: ((entry as AuthoredPower).powers ?? []).map((child, order) =>
                                      order === address.child ? {...child, ...(trait as AuthoredPower)} : child,
                                  ),
                              },
                    ),
                });
                return;
            }

            if (address.kind === 'trait') {
                setDraft({...draft, [address.key]: draft[address.key].map((entry, index) => (index === address.index ? trait : entry))});
                return;
            }

            setDraft({
                ...draft,
                frameworks: draft.frameworks.map((framework, index) =>
                    index === address.framework
                        // Spread over the slot rather than replacing it, so the fields only a slot
                        // has — `variable` — survive an edit made by the trait form, which is
                        // typed to the trait and knows nothing about them.
                        ? {...framework, slots: framework.slots.map((slot, order) => (order === address.index ? {...slot, ...(trait as AuthoredSlot)} : slot))}
                        : framework,
                ),
            });
        },
        [draft],
    );

    const removeAt = useCallback(
        (address: TraitAddress): void => {
            if (address.kind === 'pool') {
                return;
            }

            if (address.kind === 'compound') {
                setDraft({
                    ...draft,
                    [address.key]: draft[address.key].map((entry, index) =>
                        index !== address.index ? entry : {...entry, powers: ((entry as AuthoredPower).powers ?? []).filter((_, order) => order !== address.child)},
                    ),
                });
                return;
            }

            if (address.kind === 'trait') {
                setDraft({...draft, [address.key]: draft[address.key].filter((_, index) => index !== address.index)});
                return;
            }

            setDraft({
                ...draft,
                frameworks: draft.frameworks.map((framework: AuthoredFramework, index) =>
                    index === address.framework ? {...framework, slots: framework.slots.filter((_, order) => order !== address.index)} : framework,
                ),
            });
        },
        [draft],
    );

    const api = useMemo<DraftApi>(
        () => ({draft, setDraft, beginSession, traitAt, frameworkAt, replaceFramework, replaceAt, removeAt}),
        [draft, beginSession, traitAt, frameworkAt, replaceFramework, replaceAt, removeAt],
    );

    return <DraftContext.Provider value={api}>{children}</DraftContext.Provider>;
}

export function useAuthoringDraft(): DraftApi {
    const value = useContext(DraftContext);

    if (value === null) {
        throw new Error('useAuthoringDraft must be used within an AuthoringDraftProvider');
    }

    return value;
}
