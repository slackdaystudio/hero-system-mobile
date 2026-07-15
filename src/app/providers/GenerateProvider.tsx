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

import React, {createContext, useCallback, useContext, useMemo} from 'react';
import {heroDesignerCharacter} from 'core/hero';
import type {CharacterDocument, Rng} from 'core/ports';
import {generateRandomCharacter} from 'core/random';
import {mathRandomRng} from 'infra/rng/mathRandomRng';
import {useRepositories} from 'app/providers/RepositoriesProvider';

/**
 * Provides the "generate a random character" action to the tree (docs/RANDOM_CHARACTER.md).
 *
 * Mirrors {@link ImportProvider}: the domain builds a `ParsedCharacter` — the same `.hdc`-shaped
 * input an import produces — and it is run through the engine and saved down the identical path,
 * so a generated character is indistinguishable from an imported one.
 *
 * **Preview, not the finished feature.** Phase 3 is still in progress: a generated character has
 * characteristics and powers but no skills or complications, and only the archetypes with
 * structured powersets can appear. `spent`/`total` come back so callers can say so out loud.
 */
export interface GenerateResult {
    readonly id: string;
    readonly name: string;
    readonly archetype: string;
    /** Points actually built — below `total` until phase 3 finishes. */
    readonly spent: number;
    readonly total: number;
}

type GenerateCharacter = () => Promise<GenerateResult>;

const GenerateContext = createContext<GenerateCharacter | null>(null);

export interface GenerateProviderProps {
    /** Inject a seeded `Rng` in tests; defaults to Math.random. */
    rng?: Rng;
    children: React.ReactNode;
}

export function GenerateProvider({rng, children}: GenerateProviderProps): React.JSX.Element {
    const repositories = useRepositories();
    const generator = useMemo(() => rng ?? mathRandomRng(), [rng]);

    const generateCharacter = useCallback<GenerateCharacter>(async () => {
        const generated = generateRandomCharacter(generator);
        const document = heroDesignerCharacter.getCharacter(generated.parsed) as unknown as CharacterDocument;

        // Unique per generation: a generated character is a new one every time, never an upsert
        // over a previous roll (unlike an import, whose id comes from its file name).
        const id = `generated-${generated.archetype.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-${await nextSuffix(repositories)}`;

        await repositories.characters.save({
            id,
            name: generated.name,
            player: null,
            edition: heroDesignerCharacter.isFifth(document) ? '5E' : '6E',
            filename: id,
            document,
            portrait: null,
        });

        return {id, name: generated.name, archetype: generated.archetype, spent: generated.spent, total: generated.level.total};
    }, [generator, repositories]);

    return <GenerateContext.Provider value={generateCharacter}>{children}</GenerateContext.Provider>;
}

/** Monotonic-ish suffix from the current library, so repeated rolls never collide on id. */
async function nextSuffix(repositories: ReturnType<typeof useRepositories>): Promise<string> {
    const existing = await repositories.characters.list();

    return String(existing.filter((summary) => summary.id.startsWith('generated-')).length + 1);
}

export function useGenerateCharacter(): GenerateCharacter {
    const value = useContext(GenerateContext);

    if (value === null) {
        throw new Error('useGenerateCharacter must be used within a GenerateProvider');
    }

    return value;
}
