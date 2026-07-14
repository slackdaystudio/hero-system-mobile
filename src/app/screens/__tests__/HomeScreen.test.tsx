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
import {HomeScreen, type HomeScreenProps} from '../HomeScreen';

const activeCharacter: Character = {
    id: 'c1',
    name: 'Defensor',
    player: 'Phil',
    edition: '6E',
    isActive: true,
    portraitUri: null,
    filename: 'defensor.hsmc',
    updatedAt: '2026-01-01T00:00:00.000Z',
    document: {},
};

const collectText = (node: unknown): string[] => {
    if (node === null || node === undefined) {
        return [];
    }
    if (typeof node === 'string' || typeof node === 'number') {
        return [String(node)];
    }
    if (Array.isArray(node)) {
        return node.flatMap(collectText);
    }
    return collectText((node as {children?: unknown}).children);
};

const callbacks = (): HomeScreenProps => ({
    onOpenCharacters: jest.fn(),
    onOpenActiveCharacter: jest.fn(),
    onOpenDice: jest.fn(),
    onOpenStatistics: jest.fn(),
    onOpenSettings: jest.fn(),
});

const render = async (active: Character | null, props: HomeScreenProps): Promise<ReactTestRenderer> => {
    const repositories = {characters: {getActive: async () => active} as unknown as CharacterRepository} as unknown as Repositories;
    let tree!: ReactTestRenderer;
    await act(async () => {
        tree = TestRenderer.create(
            <ThemeProvider colorScheme="dark">
                <RepositoriesProvider repositories={repositories}>
                    <HomeScreen {...props} />
                </RepositoriesProvider>
            </ThemeProvider>,
        );
    });
    await act(async () => {}); // flush the active-character load
    return tree;
};

const press = async (tree: ReactTestRenderer, testID: string): Promise<void> => {
    const target = tree.root.findAllByProps({testID}).find((node) => typeof node.props.onPress === 'function');
    await act(async () => {
        target?.props.onPress();
    });
};

describe('HomeScreen', () => {
    it('shows the active character and opens it when tapped', async () => {
        const props = callbacks();
        const tree = await render(activeCharacter, props);

        const text = collectText(tree.toJSON());
        expect(text).toContain('Defensor');
        expect(text).toContain('6E · Phil');

        await press(tree, 'active-character');
        expect(props.onOpenActiveCharacter).toHaveBeenCalledWith('c1');
    });

    it('shows an empty state when there is no active character', async () => {
        const tree = await render(null, callbacks());
        expect(collectText(tree.toJSON())).toContain('No active character');
    });

    it('launches a dice roller in the chosen mode', async () => {
        const props = callbacks();
        const tree = await render(null, props);

        await press(tree, 'tile-Damage');
        expect(props.onOpenDice).toHaveBeenCalledWith('normal');

        await press(tree, 'tile-To Hit');
        expect(props.onOpenDice).toHaveBeenCalledWith('hit');
    });

    it('navigates to the library and game tools', async () => {
        const props = callbacks();
        const tree = await render(null, props);

        await press(tree, 'tile-All Characters');
        await press(tree, 'tile-Statistics');
        await press(tree, 'tile-Settings');

        expect(props.onOpenCharacters).toHaveBeenCalledTimes(1);
        expect(props.onOpenStatistics).toHaveBeenCalledTimes(1);
        expect(props.onOpenSettings).toHaveBeenCalledTimes(1);
    });
});
