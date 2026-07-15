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
 */
import React from 'react';
import {act, create} from 'react-test-renderer';
import type {Rng, SaveCharacter} from 'core/ports';
import type {Repositories} from 'infra/persistence/repositories';
import {heroDesignerCharacter} from 'core/hero';
import {GenerateProvider, useGenerateCharacter, type GenerateResult} from 'app/providers/GenerateProvider';
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

/** Renders the provider and invokes the action once, returning its result. */
const generateOnce = async (saved: SaveCharacter[], rng: Rng): Promise<GenerateResult> => {
    let result: GenerateResult | undefined;

    function Probe(): React.JSX.Element | null {
        const generate = useGenerateCharacter();

        React.useEffect(() => {
            generate().then((value) => {
                result = value;
            }, undefined);
        }, [generate]);

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

    return result!;
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
});
