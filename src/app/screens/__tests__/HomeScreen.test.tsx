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
import type {CharacterRepository, CharacterSummary} from 'core/ports';
import type {Repositories} from 'infra/persistence/repositories';
import {RepositoriesProvider} from 'app/providers/RepositoriesProvider';
import {ThemeProvider} from 'app/theme';
import {HomeScreen, type HomeScreenProps} from '../HomeScreen';

const summary = (over: Partial<CharacterSummary> = {}): CharacterSummary => ({
    id: 'c1',
    name: 'Defensor',
    player: 'Phil',
    edition: '6E',
    isActive: false,
    portraitUri: null,
    /** Unframed — reads as the centre crop every portrait got before framing existed. */
    portraitFocus: null,
    ...over,
});

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
    onOpenCharacter: jest.fn(),
    onOpenDice: jest.fn(),
    onOpenStatistics: jest.fn(),
    onOpenSettings: jest.fn(),
});

const render = async (recent: CharacterSummary[], props: HomeScreenProps): Promise<ReactTestRenderer> => {
    const repositories = {characters: {recent: async () => recent} as unknown as CharacterRepository} as unknown as Repositories;
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
    await act(async () => {}); // flush the recent-characters load
    return tree;
};

const press = async (tree: ReactTestRenderer, testID: string): Promise<void> => {
    const target = tree.root.findAllByProps({testID}).find((node) => typeof node.props.onPress === 'function');
    await act(async () => {
        target?.props.onPress();
    });
};

describe('HomeScreen', () => {
    it('shows recent characters and opens one when tapped', async () => {
        const props = callbacks();
        const tree = await render([summary({id: 'c1', name: 'Defensor'}), summary({id: 'c2', name: 'Grond'})], props);

        const text = collectText(tree.toJSON());
        expect(text).toContain('Defensor');
        expect(text).toContain('Grond');

        await press(tree, 'recent-c2');
        expect(props.onOpenCharacter).toHaveBeenCalledWith('c2');
    });

    it('shows an empty state when there are no characters', async () => {
        const tree = await render([], callbacks());
        expect(collectText(tree.toJSON())).toContain('No characters yet');
    });

    it('launches a dice roller in the chosen mode', async () => {
        const props = callbacks();
        const tree = await render([], props);

        await press(tree, 'tile-Damage');
        expect(props.onOpenDice).toHaveBeenCalledWith('normal');

        await press(tree, 'tile-To Hit');
        expect(props.onOpenDice).toHaveBeenCalledWith('hit');
    });

    it('navigates to the library and game tools', async () => {
        const props = callbacks();
        const tree = await render([], props);

        await press(tree, 'tile-All Characters');
        await press(tree, 'tile-Statistics');
        await press(tree, 'tile-Settings');

        expect(props.onOpenCharacters).toHaveBeenCalledTimes(1);
        expect(props.onOpenStatistics).toHaveBeenCalledTimes(1);
        expect(props.onOpenSettings).toHaveBeenCalledTimes(1);
    });

    /**
     * "Recent" is ordered by `accessed_at`, so it restates itself every time it is looked at. Home
     * never unmounts (it is the stack root), so a mount-only load would freeze the list at its
     * launch-time order for the whole session — the navigator bumps `refreshToken` on focus.
     */
    it('reloads the recent list when refreshToken changes (e.g. on returning to Home)', async () => {
        let recent = [summary({id: 'c1', name: 'Defensor'})];
        const characters = {recent: async () => recent} as unknown as CharacterRepository;
        const repositories = {characters} as unknown as Repositories;
        const wrap = (token: number): React.JSX.Element => (
            <ThemeProvider colorScheme="dark">
                <RepositoriesProvider repositories={repositories}>
                    <HomeScreen {...callbacks()} refreshToken={token} />
                </RepositoriesProvider>
            </ThemeProvider>
        );

        let tree!: ReactTestRenderer;
        await act(async () => {
            tree = TestRenderer.create(wrap(0));
        });
        await act(async () => {});
        expect(collectText(tree.toJSON())).toContain('Defensor');

        // Someone opened Grond, which reorders `recent`, and deleted Defensor.
        recent = [summary({id: 'c2', name: 'Grond'})];

        await act(async () => {
            tree.update(wrap(0)); // same token: still the stale list
        });
        await act(async () => {});
        expect(collectText(tree.toJSON())).toContain('Defensor');

        await act(async () => {
            tree.update(wrap(1));
        });
        await act(async () => {});

        const text = collectText(tree.toJSON());
        expect(text).toContain('Grond');
        expect(text).not.toContain('Defensor');
    });
});
