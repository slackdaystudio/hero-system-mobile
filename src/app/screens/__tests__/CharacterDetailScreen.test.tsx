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

import React from 'react';
import TestRenderer, {act, type ReactTestRenderer} from 'react-test-renderer';
import type {Character, CharacterRepository} from 'core/ports';
import type {Repositories} from 'infra/persistence/repositories';
import {RepositoriesProvider} from 'app/providers/RepositoriesProvider';
import {ThemeProvider} from 'app/theme';
import {CharacterDetailScreen, type CharacterDetailScreenProps} from '../CharacterDetailScreen';

const character = (over: Partial<Character> = {}): Character => ({
    id: 'c1',
    name: 'Defensor',
    player: 'Phil',
    edition: '6E',
    slot: 0,
    isActive: true,
    portraitUri: null,
    filename: 'defensor.hsmc',
    updatedAt: '2026-01-01T00:00:00.000Z',
    document: {
        characteristics: [{name: 'STR', value: 20}],
        powers: [{name: 'Force Field', xmlid: 'FORCEFIELD'}],
    },
    ...over,
});

const fakeCharacters = (result: Character | null): CharacterRepository =>
    ({
        get: async () => result,
    } as unknown as CharacterRepository);

const collectText = (node: unknown): string[] => {
    if (node === null || node === undefined) {
        return [];
    }
    if (typeof node === 'string') {
        return [node];
    }
    if (Array.isArray(node)) {
        return node.flatMap(collectText);
    }

    return collectText((node as {children?: unknown}).children);
};

const renderScreen = async (repo: CharacterRepository, props: Partial<CharacterDetailScreenProps> = {}): Promise<ReactTestRenderer> => {
    const repositories = {characters: repo} as unknown as Repositories;

    let tree!: ReactTestRenderer;
    await act(async () => {
        tree = TestRenderer.create(
            <ThemeProvider colorScheme="dark">
                <RepositoriesProvider repositories={repositories}>
                    <CharacterDetailScreen characterId="c1" {...props} />
                </RepositoriesProvider>
            </ThemeProvider>,
        );
    });
    await act(async () => {});

    return tree;
};

describe('CharacterDetailScreen', () => {
    it('renders the header, details, characteristics and powers from the parsed document', async () => {
        const tree = await renderScreen(fakeCharacters(character()));

        const text = collectText(tree.toJSON());
        expect(text).toContain('Defensor');
        expect(text).toContain('6E · Phil');
        expect(text).toContain('Active');
        expect(text).toContain('defensor.hsmc');
        expect(text).toContain('Slot 1'); // slot 0 shown 1-indexed
        expect(text).toContain('STR');
        expect(text).toContain('20');
        expect(text).toContain('Force Field');
    });

    it('calls onReady with the loaded character (for the header title)', async () => {
        const onReady = jest.fn();
        await renderScreen(fakeCharacters(character({name: 'Grond'})), {onReady});

        expect(onReady).toHaveBeenCalledTimes(1);
        expect(onReady.mock.calls[0][0].name).toBe('Grond');
    });

    it('shows a not-found state when the character is missing', async () => {
        const tree = await renderScreen(fakeCharacters(null));

        expect(collectText(tree.toJSON())).toContain('Character not found');
    });

    it('renders the portrait when present', async () => {
        const tree = await renderScreen(fakeCharacters(character({portraitUri: 'file:///images/p1.png'})));

        expect(tree.root.findByProps({testID: 'portrait'}).props.source.uri).toBe('file:///images/p1.png');
    });
});
