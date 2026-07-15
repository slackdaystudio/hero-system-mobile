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
import type {Character, CharacterDocument, Rng} from 'core/ports';
import {buildRecipe, generateRandomCharacter, type CharacterRecipe} from 'core/random';
import {mathRandomRng} from 'infra/rng/mathRandomRng';
import {useRepositories} from 'app/providers/RepositoriesProvider';

/**
 * Provides the "generate a random character" and "re-roll one" actions (docs/RANDOM_CHARACTER.md).
 *
 * Mirrors {@link ImportProvider}: the domain builds a `ParsedCharacter` — the same `.hdc`-shaped
 * input an import produces — and it is run through the engine and saved down the identical path,
 * so a generated character is indistinguishable from an imported one.
 *
 * Both actions share one save shape, so a generated character and a re-rolled one are stored
 * identically. Only the archetypes with a structured powerset can appear; `spent`/`total` come back
 * so callers can report the build rather than assert it.
 */
export interface GenerateResult {
    readonly id: string;
    readonly name: string;
    readonly archetype: string;
    /** Points actually built. A finished 5E Low Powered roll spends its full 250. */
    readonly spent: number;
    readonly total: number;
}

type GenerateCharacter = () => Promise<GenerateResult>;

/**
 * Re-save a generated character from a revised recipe.
 *
 * Takes the existing {@link Character} rather than an id so it can carry forward what the recipe
 * doesn't describe — player, filename, and the portrait (omitted from the save, which means keep).
 * A revise that passed `player: null` would quietly erase it.
 */
type ReviseCharacter = (character: Character, recipe: CharacterRecipe) => Promise<GenerateResult>;

interface GenerateApi {
    readonly generate: GenerateCharacter;
    readonly revise: ReviseCharacter;
    /** The same generator a roll uses — recipe edits that re-draw a powerset need it. */
    readonly rng: Rng;
}

const GenerateContext = createContext<GenerateApi | null>(null);

export interface GenerateProviderProps {
    /** Inject a seeded `Rng` in tests; defaults to Math.random. */
    rng?: Rng;
    children: React.ReactNode;
}

export function GenerateProvider({rng, children}: GenerateProviderProps): React.JSX.Element {
    const repositories = useRepositories();
    const generator = useMemo(() => rng ?? mathRandomRng(), [rng]);

    const generate = useCallback<GenerateCharacter>(async () => {
        const generated = generateRandomCharacter(generator);
        const document = heroDesignerCharacter.getCharacter(generated.parsed) as unknown as CharacterDocument;

        // Unique per generation: a generated character is a new one every time, never an upsert
        // over a previous roll (unlike an import, whose id comes from its file name).
        const id = `generated-${generated.recipe.archetype.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-${await nextSuffix(repositories)}`;

        await repositories.characters.save({
            id,
            name: generated.recipe.name,
            player: null,
            edition: heroDesignerCharacter.isFifth(document) ? '5E' : '6E',
            filename: id,
            document,
            portrait: null,
            // Stated, not inferred from the id prefix: this is the row the player is allowed to
            // edit, and the recipe is the only record of what it was rolled from.
            origin: 'generated',
            recipe: generated.recipe,
        });

        return {id, name: generated.recipe.name, archetype: generated.recipe.archetype, spent: generated.spent, total: generated.level.total};
    }, [generator, repositories]);

    /**
     * An edit rebuilds through the same pipeline a roll does — the recipe fully determines the
     * character, so no rng is needed here and the result is identical to having rolled it that way.
     */
    const revise = useCallback<ReviseCharacter>(
        async (character, recipe) => {
            const built = buildRecipe(recipe);
            const document = heroDesignerCharacter.getCharacter(built.parsed) as unknown as CharacterDocument;

            await repositories.characters.save({
                id: character.id,
                name: recipe.name,
                player: character.player,
                edition: heroDesignerCharacter.isFifth(document) ? '5E' : '6E',
                filename: character.filename,
                document,
                // `portrait` omitted → keep the existing one. Passing null would clear it.
                origin: 'generated',
                recipe,
            });

            return {id: character.id, name: recipe.name, archetype: recipe.archetype, spent: built.spent, total: built.level.total};
        },
        [repositories],
    );

    const api = useMemo<GenerateApi>(() => ({generate, revise, rng: generator}), [generate, revise, generator]);

    return <GenerateContext.Provider value={api}>{children}</GenerateContext.Provider>;
}

/** Monotonic-ish suffix from the current library, so repeated rolls never collide on id. */
async function nextSuffix(repositories: ReturnType<typeof useRepositories>): Promise<string> {
    const existing = await repositories.characters.list();

    return String(existing.filter((summary) => summary.id.startsWith('generated-')).length + 1);
}

function useGenerateApi(): GenerateApi {
    const value = useContext(GenerateContext);

    if (value === null) {
        throw new Error('useGenerateCharacter must be used within a GenerateProvider');
    }

    return value;
}

export const useGenerateCharacter = (): GenerateCharacter => useGenerateApi().generate;

/** Re-save a generated character from a revised recipe. Only generated characters may be revised. */
export const useReviseCharacter = (): ReviseCharacter => useGenerateApi().revise;

/** The generator's rng, for recipe edits that re-draw (see `rerollArchetype`). */
export const useGeneratorRng = (): Rng => useGenerateApi().rng;
