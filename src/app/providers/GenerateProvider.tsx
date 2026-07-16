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
import {buildRecipe, generateRandomCharacter, type CharacterRecipe, type GeneratedCharacter, type PowerLevel} from 'core/random';
import {mathRandomRng} from 'infra/rng/mathRandomRng';
import {useRepositories} from 'app/providers/RepositoriesProvider';

/**
 * Provides the "generate a random character" and "re-roll one" actions (docs/RANDOM_CHARACTER.md).
 *
 * Mirrors {@link ImportProvider}: the domain builds a `ParsedCharacter` — the same `.hdc`-shaped
 * input an import produces — and it is run through the engine and saved down the identical path,
 * so a generated character is indistinguishable from an imported one.
 *
 * **Rolling and keeping are separate, and that is the point.** This used to be one `generate()`
 * that rolled, built and saved before the player had seen a single word of the result — dismissing
 * the dialog left a character behind in the library. The Generate dialog offers "Roll Again", which
 * turns that into a pile of them, so:
 *
 * ```
 * roll(level)   pure and synchronous — nothing is written
 * keep(rolled)  the only thing that touches storage
 * ```
 *
 * A rejected roll is now simply never saved, and there is nothing to clean up because nothing was
 * created. `revise` keeps the same save shape, so a generated character, a re-rolled one and a kept
 * one are all stored identically.
 */
export interface GenerateResult {
    readonly id: string;
    readonly name: string;
    readonly archetype: string;
    /** Points actually built. A finished 5E Low Powered roll spends its full 250. */
    readonly spent: number;
    readonly total: number;
}

/**
 * Roll a character without saving it.
 *
 * Synchronous because it is pure — the domain does no I/O, and pretending otherwise would make the
 * dialog await something that never yields. The `Rng` is the provider's, so a seeded one reaches it
 * in tests.
 */
type RollCharacter = (level: PowerLevel) => GeneratedCharacter;

/** Save a rolled character. The only write on the generate path, and only the player triggers it. */
type KeepCharacter = (rolled: GeneratedCharacter) => Promise<GenerateResult>;

/**
 * Re-save a generated character from a revised recipe.
 *
 * Takes the existing {@link Character} rather than an id so it can carry forward what the recipe
 * doesn't describe — player, filename, and the portrait (omitted from the save, which means keep).
 * A revise that passed `player: null` would quietly erase it.
 */
type ReviseCharacter = (character: Character, recipe: CharacterRecipe) => Promise<GenerateResult>;

interface GenerateApi {
    readonly roll: RollCharacter;
    readonly keep: KeepCharacter;
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

    // The level is passed, never defaulted: `generateRandomCharacter` falls back to 5E Low Powered,
    // and calling it bare is how every roll was silently 5E while the whole 6E dataset sat unreachable.
    const roll = useCallback<RollCharacter>((level) => generateRandomCharacter(generator, level), [generator]);

    const keep = useCallback<KeepCharacter>(
        async (rolled) => {
            const document = heroDesignerCharacter.getCharacter(rolled.parsed) as unknown as CharacterDocument;

            // Unique per generation: a kept character is a new one every time, never an upsert over
            // a previous roll (unlike an import, whose id comes from its file name).
            const id = `generated-${rolled.recipe.archetype.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-${await nextSuffix(repositories)}`;

            await repositories.characters.save({
                id,
                name: rolled.recipe.name,
                player: null,
                edition: heroDesignerCharacter.isFifth(document) ? '5E' : '6E',
                filename: id,
                document,
                portrait: null,
                // Stated, not inferred from the id prefix: this is the row the player is allowed to
                // edit, and the recipe is the only record of what it was rolled from.
                origin: 'generated',
                recipe: rolled.recipe,
            });

            return {id, name: rolled.recipe.name, archetype: rolled.recipe.archetype, spent: rolled.spent, total: rolled.level.total};
        },
        [repositories],
    );

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

    const api = useMemo<GenerateApi>(() => ({roll, keep, revise, rng: generator}), [roll, keep, revise, generator]);

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

/** Roll a character at a level. Pure — nothing is saved until {@link useKeepCharacter}. */
export const useRollCharacter = (): RollCharacter => useGenerateApi().roll;

/** Save a rolled character. Only the player's "View" reaches this. */
export const useKeepCharacter = (): KeepCharacter => useGenerateApi().keep;

/** Re-save a generated character from a revised recipe. Only generated characters may be revised. */
export const useReviseCharacter = (): ReviseCharacter => useGenerateApi().revise;

/** The generator's rng, for recipe edits that re-draw (see `rerollArchetype`). */
export const useGeneratorRng = (): Rng => useGenerateApi().rng;
