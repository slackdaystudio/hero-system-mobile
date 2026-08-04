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
import type {CharacterSummary} from 'core/ports';
import {DEFAULT_SETTINGS} from 'core/ports';
import type {Repositories} from 'infra/persistence/repositories';
import {RepositoriesProvider} from 'app/providers/RepositoriesProvider';
import {SettingsProvider} from 'app/providers/SettingsProvider';
import {ThemeProvider} from 'app/theme';
import {HomeScreen, type HomeScreenProps} from '../HomeScreen';

const summary = (over: Partial<CharacterSummary> = {}): CharacterSummary => ({
    id: 'c1',
    name: 'Defensor',
    player: 'Phil',
    edition: '6E',
    isActive: false,
    portraitUri: null,
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

interface Deps {
    characters: CharacterSummary[];
    setActive: jest.Mock;
}

const deps = (characters: CharacterSummary[]): Deps => ({characters, setActive: jest.fn(async () => {})});

const wrap = (d: Deps, props: HomeScreenProps, refreshToken?: unknown): React.JSX.Element => {
    const repositories = {
        characters: {list: async () => d.characters, recent: async () => d.characters, setActive: d.setActive},
        settings: {get: async () => DEFAULT_SETTINGS, set: async () => {}},
    } as unknown as Repositories;

    return (
        <ThemeProvider colorScheme="dark">
            <RepositoriesProvider repositories={repositories}>
                <SettingsProvider initialSettings={DEFAULT_SETTINGS}>
                    <HomeScreen {...props} refreshToken={refreshToken} />
                </SettingsProvider>
            </RepositoriesProvider>
        </ThemeProvider>
    );
};

const render = async (characters: CharacterSummary[], props: HomeScreenProps): Promise<{tree: ReactTestRenderer; d: Deps}> => {
    const d = deps(characters);
    let tree!: ReactTestRenderer;
    await act(async () => {
        tree = TestRenderer.create(wrap(d, props));
    });
    await act(async () => {}); // flush the quick-pick load
    return {tree, d};
};

const press = async (tree: ReactTestRenderer, testID: string): Promise<void> => {
    const target = tree.root.findAllByProps({testID}).find((node) => typeof node.props.onPress === 'function');
    await act(async () => {
        target?.props.onPress();
    });
    await act(async () => {});
};

describe('HomeScreen', () => {
    it('surfaces characters in the quick pick and opens the one tapped', async () => {
        const props = callbacks();
        const {tree, d} = await render([summary({id: 'c1', name: 'Defensor'}), summary({id: 'c2', name: 'Grond'})], props);

        const text = collectText(tree.toJSON());
        expect(text).toContain('Defensor');
        expect(text).toContain('Grond');

        // Slot 1 is the second recent, Grond — tapping it activates and opens him.
        await press(tree, 'quickpick-slot-1');
        expect(d.setActive).toHaveBeenCalledWith('c2');
        expect(props.onOpenCharacter).toHaveBeenCalledWith('c2');
    });

    it('shows empty placeholder slots when there are no characters', async () => {
        const {tree} = await render([], callbacks());
        expect(tree.root.findAllByProps({testID: 'quickpick-empty-0'}).length).toBeGreaterThan(0);
    });

    it('launches a dice roller in the chosen mode', async () => {
        const props = callbacks();
        const {tree} = await render([], props);

        await press(tree, 'tile-Damage');
        expect(props.onOpenDice).toHaveBeenCalledWith('normal');

        await press(tree, 'tile-To Hit');
        expect(props.onOpenDice).toHaveBeenCalledWith('hit');
    });

    it('navigates to the library and game tools', async () => {
        const props = callbacks();
        const {tree} = await render([], props);

        await press(tree, 'tile-All Characters');
        await press(tree, 'tile-Statistics');
        await press(tree, 'tile-Settings');

        expect(props.onOpenCharacters).toHaveBeenCalledTimes(1);
        expect(props.onOpenStatistics).toHaveBeenCalledTimes(1);
        expect(props.onOpenSettings).toHaveBeenCalledTimes(1);
    });

    /**
     * The quick pick fills empty slots from the recent list, which restates itself every time a
     * character is opened. Home never unmounts (it is the stack root), so a mount-only load would
     * freeze the grid at its launch-time order — the navigator bumps `refreshToken` on focus.
     */
    it('reloads the grid when refreshToken changes (e.g. on returning to Home)', async () => {
        // One stable repositories object: a fresh one each render would change the loader's identity
        // and reload on its own, hiding the very staleness this test is about.
        const holder = {characters: [summary({id: 'c1', name: 'Defensor'})]};
        const repositories = {
            characters: {list: async () => holder.characters, recent: async () => holder.characters, setActive: jest.fn(async () => {})},
            settings: {get: async () => DEFAULT_SETTINGS, set: async () => {}},
        } as unknown as Repositories;
        const el = (token: number): React.JSX.Element => (
            <ThemeProvider colorScheme="dark">
                <RepositoriesProvider repositories={repositories}>
                    <SettingsProvider initialSettings={DEFAULT_SETTINGS}>
                        <HomeScreen {...callbacks()} refreshToken={token} />
                    </SettingsProvider>
                </RepositoriesProvider>
            </ThemeProvider>
        );

        let tree!: ReactTestRenderer;
        await act(async () => {
            tree = TestRenderer.create(el(0));
        });
        await act(async () => {});
        expect(collectText(tree.toJSON())).toContain('Defensor');

        // Someone opened Grond, which reorders the recent list, and deleted Defensor.
        holder.characters = [summary({id: 'c2', name: 'Grond'})];

        await act(async () => {
            tree.update(el(0)); // same token: still the stale grid
        });
        await act(async () => {});
        expect(collectText(tree.toJSON())).toContain('Defensor');

        await act(async () => {
            tree.update(el(1));
        });
        await act(async () => {});

        const text = collectText(tree.toJSON());
        expect(text).toContain('Grond');
        expect(text).not.toContain('Defensor');
    });
});
