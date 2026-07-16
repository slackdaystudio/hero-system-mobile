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
 * The generate action, end to end: roll → engine → save. Drives the same repository contract the
 * import path writes through, so a generated character lands in the library identically.
 *
 * Rolling and keeping are separate actions, and the split is the subject of half of these: a roll
 * writes nothing, and only `keep` reaches storage. See the header of `GenerateProvider`.
 */
import React from 'react';
import {act, create} from 'react-test-renderer';
import type {Rng, SaveCharacter} from 'core/ports';
import type {Repositories} from 'infra/persistence/repositories';
import {heroDesignerCharacter} from 'core/hero';
import {LOW_POWERED_5E, STANDARD_6E, type GeneratedCharacter, type PowerLevel} from 'core/random';
import {GenerateProvider, useKeepCharacter, useRollCharacter, type GenerateResult} from 'app/providers/GenerateProvider';
import {RepositoriesProvider} from 'app/providers/RepositoriesProvider';

const seededRng = (seed: number): Rng => {
    let state = seed % 4294967296;

    return {
        next: (min: number, max: number): number => {
            state = (state * 1664525 + 1013904223) % 4294967296;

            return min + (state % (max - min + 1));
        },
    };
};

const fakeRepositories = (saved: SaveCharacter[]) =>
    ({
        characters: {
            list: async () => saved.map((character) => ({id: character.id})),
            save: async (character: SaveCharacter) => {
                saved.push(character);
            },
        },
    } as unknown as Repositories);

/** Mounts the provider and hands the two actions to `run`. */
const withProvider = async (saved: SaveCharacter[], rng: Rng, run: (actions: {roll: (level: PowerLevel) => GeneratedCharacter; keep: (rolled: GeneratedCharacter) => Promise<GenerateResult>}) => void): Promise<void> => {
    function Probe(): React.JSX.Element | null {
        const roll = useRollCharacter();
        const keep = useKeepCharacter();

        React.useEffect(() => {
            run({roll, keep});
        }, [roll, keep]);

        return null;
    }

    await act(async () => {
        create(
            <RepositoriesProvider repositories={fakeRepositories(saved)}>
                <GenerateProvider rng={rng}>
                    <Probe />
                </GenerateProvider>
            </RepositoriesProvider>,
        );
    });
};

/** Rolls once and keeps it — what the dialog does when the player taps Generate then View. */
const generateOnce = async (saved: SaveCharacter[], rng: Rng, level: PowerLevel = LOW_POWERED_5E): Promise<GenerateResult> => {
    let result: GenerateResult | undefined;

    await withProvider(saved, rng, ({roll, keep}) => {
        keep(roll(level)).then((value) => {
            result = value;
        }, undefined);
    });

    return result!;
};

/** Rolls without keeping — what the dialog does when the player taps Generate and walks away. */
const rollOnce = async (saved: SaveCharacter[], rng: Rng, level: PowerLevel = LOW_POWERED_5E): Promise<GeneratedCharacter> => {
    let rolled: GeneratedCharacter | undefined;

    await withProvider(saved, rng, ({roll}) => {
        rolled = roll(level);
    });

    return rolled!;
};

describe('GenerateProvider', () => {
    it('saves a generated character through the same repository the import path uses', async () => {
        const saved: SaveCharacter[] = [];
        const result = await generateOnce(saved, seededRng(42));

        expect(saved).toHaveLength(1);
        expect(saved[0]).toMatchObject({id: result.id, name: result.name, edition: '5E', player: null, portrait: null});
        expect(saved[0].filename).toBe(saved[0].id);
    });

    it('saves a document the engine and sheet can read back', async () => {
        const saved: SaveCharacter[] = [];
        await generateOnce(saved, seededRng(1));

        const document = saved[0].document as unknown as Record<string, any>;

        expect(heroDesignerCharacter.isFifth(document)).toBe(true);
        expect(document.characteristics.length).toBeGreaterThan(0);
        expect(document.powers.length).toBeGreaterThan(0);
    });

    it('builds a whole character — the full 250', async () => {
        const saved: SaveCharacter[] = [];
        const result = await generateOnce(saved, seededRng(5));

        expect(result.total).toBe(250);
        expect(result.spent).toBe(result.total);
        expect(result.archetype).toBeTruthy();
    });

    it('never upserts over a previous roll — every generation is a new character', async () => {
        // Unlike an import, whose id comes from its file name, a re-roll is a different character.
        const saved: SaveCharacter[] = [];
        const first = await generateOnce(saved, seededRng(2));
        const second = await generateOnce(saved, seededRng(2));

        expect(saved).toHaveLength(2);
        expect(second.id).not.toBe(first.id);
    });

    /**
     * The whole reason rolling and keeping are two actions.
     *
     * `generate()` used to roll, build and save in one go, before the player had read a word of the
     * result — dismissing the dialog left a character behind in the library. The dialog now offers
     * "Roll Again", which would have turned one stray character into a pile of them.
     */
    describe('a roll is not a save', () => {
        it('writes nothing at all', async () => {
            const saved: SaveCharacter[] = [];
            const rolled = await rollOnce(saved, seededRng(42));

            expect(rolled.recipe.name).toBeTruthy();
            expect(saved).toEqual([]);
        });

        it('writes nothing however many times the player rolls again', async () => {
            const saved: SaveCharacter[] = [];

            await withProvider(saved, seededRng(42), ({roll}) => {
                for (let attempt = 0; attempt < 5; attempt++) {
                    roll(LOW_POWERED_5E);
                }
            });

            expect(saved).toEqual([]);
        });

        it('saves exactly the character that was rolled, and only when kept', async () => {
            const saved: SaveCharacter[] = [];
            let rolled: GeneratedCharacter | undefined;

            await withProvider(saved, seededRng(7), ({roll, keep}) => {
                // Three rolls, one kept — the pile the player rejected leaves no trace.
                roll(LOW_POWERED_5E);
                roll(LOW_POWERED_5E);
                rolled = roll(LOW_POWERED_5E);
                keep(rolled).then(undefined, undefined);
            });

            expect(saved).toHaveLength(1);
            expect(saved[0].name).toBe(rolled!.recipe.name);
            expect(saved[0].recipe).toEqual(rolled!.recipe);
        });
    });

    /**
     * **The level has to be passed, and this is where it was lost.**
     *
     * `generateRandomCharacter(rng, level = LOW_POWERED_5E)` defaults, and the provider called it
     * bare — so every roll the app ever made was 5E Low Powered while the entire 6E dataset sat
     * authored and unreachable. Nothing in `src/app/` so much as imported a `PowerLevel`.
     */
    describe('the level reaches the domain', () => {
        it('rolls 5E Low Powered when asked for it', async () => {
            const saved: SaveCharacter[] = [];
            const result = await generateOnce(saved, seededRng(5), LOW_POWERED_5E);

            expect(result.total).toBe(250);
            expect(result.spent).toBe(250);
            expect(saved[0].edition).toBe('5E');
            expect(heroDesignerCharacter.isFifth(saved[0].document as unknown as Record<string, any>)).toBe(true);
        });

        it('rolls 6E Standard when asked for it', async () => {
            const saved: SaveCharacter[] = [];
            const result = await generateOnce(saved, seededRng(5), STANDARD_6E);

            expect(result.total).toBe(400);
            expect(result.spent).toBe(400);
            expect(saved[0].edition).toBe('6E');
            expect(heroDesignerCharacter.isFifth(saved[0].document as unknown as Record<string, any>)).toBe(false);
        });

        /** The recipe is the only record of what a character was rolled from — including its level. */
        it('stores the level on the recipe, so an edit rebuilds in the right edition', async () => {
            const saved: SaveCharacter[] = [];
            await generateOnce(saved, seededRng(3), STANDARD_6E);

            expect((saved[0].recipe as {level: string}).level).toBe('6e-standard');
        });
    });
});
