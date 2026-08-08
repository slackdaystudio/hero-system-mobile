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
 * Saving an authored character (docs/CHARACTER_AUTHORING.md).
 *
 * The same shape as `GenerateProvider`, deliberately: build the engine's input, price it through
 * `getCharacter`, store the document alongside the thing it was built from. The only difference is
 * which "thing" that is — a generated character keeps its recipe, an authored one keeps its draft.
 *
 * There is one save path for both creating and editing, because a draft fully determines a
 * character. Nothing is mutated in place, so no edit can leave a character half-changed.
 */
import React, {createContext, useCallback, useContext, useMemo} from 'react';
import {build, toSource, type AuthoredCharacter} from 'core/authoring';
import {heroDesignerCharacter} from 'core/hero';
import type {CharacterDocument} from 'core/ports';
import {useRepositories} from 'app/providers/RepositoriesProvider';

/** What a save reports back, so the caller can navigate to what it just wrote. */
export interface AuthoredResult {
    readonly id: string;
    readonly name: string;
}

export type SaveAuthored = (draft: AuthoredCharacter, existingId?: string) => Promise<AuthoredResult>;

interface AuthoringApi {
    readonly save: SaveAuthored;
}

const AuthoringContext = createContext<AuthoringApi | null>(null);

/** A name a player typed, as an id fragment. Empty names are possible, so there is a fallback. */
const slugOf = (name: string): string => {
    const slug = name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '');

    return slug === '' ? 'character' : slug;
};

export function AuthoringProvider({children}: {children: React.ReactNode}): React.JSX.Element {
    const repositories = useRepositories();

    const save = useCallback<SaveAuthored>(
        async (draft, existingId) => {
            const document = build(draft) as unknown as CharacterDocument;
            const name = draft.name.trim() === '' ? 'Unnamed' : draft.name.trim();

            // An edit keeps its id; a new character takes one derived from its name, suffixed
            // until it is free. An authored character has no filename to key on the way an import
            // does, and reusing a name would silently overwrite somebody's other character.
            const id = existingId ?? (await nextFreeId(repositories, slugOf(name)));

            await repositories.characters.save({
                id,
                name,
                player: draft.player.trim() === '' ? null : draft.player.trim(),
                edition: heroDesignerCharacter.isFifth(document as never) ? '5E' : '6E',
                filename: id,
                document,
                // Stated, not inferred: this is the row the player is allowed to edit, and the
                // source is the only record of what it was built from.
                origin: 'authored',
                source: toSource(draft),
            });

            return {id, name};
        },
        [repositories],
    );

    const api = useMemo<AuthoringApi>(() => ({save}), [save]);

    return <AuthoringContext.Provider value={api}>{children}</AuthoringContext.Provider>;
}

/** `authored-<slug>`, then `-2`, `-3`… until nothing is using it. */
async function nextFreeId(repositories: ReturnType<typeof useRepositories>, slug: string): Promise<string> {
    const taken = new Set((await repositories.characters.list()).map((summary) => summary.id));
    const base = `authored-${slug}`;

    if (!taken.has(base)) {
        return base;
    }

    let suffix = 2;
    while (taken.has(`${base}-${suffix}`)) {
        suffix += 1;
    }

    return `${base}-${suffix}`;
}

function useAuthoringApi(): AuthoringApi {
    const value = useContext(AuthoringContext);

    if (value === null) {
        throw new Error('useSaveAuthored must be used within an AuthoringProvider');
    }

    return value;
}

/** Save a draft — new when no id is given, an edit in place when one is. */
export const useSaveAuthored = (): SaveAuthored => useAuthoringApi().save;
