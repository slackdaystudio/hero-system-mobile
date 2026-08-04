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
import type {CharacterSummary, Settings} from 'core/ports';
import {DEFAULT_SETTINGS} from 'core/ports';
import type {Repositories} from 'infra/persistence/repositories';
import {RepositoriesProvider} from 'app/providers/RepositoriesProvider';
import {SettingsProvider} from 'app/providers/SettingsProvider';
import {ThemeProvider} from 'app/theme';
import {QuickPick} from '../QuickPick';

const summary = (id: string): CharacterSummary => ({
    id,
    name: id.toUpperCase(),
    player: null,
    edition: '6E',
    isActive: false,
    portraitUri: null,
    portraitFocus: null,
});

interface Options {
    list?: CharacterSummary[];
    recent?: CharacterSummary[];
    settings?: Partial<Settings>;
}

interface Harness {
    tree: ReactTestRenderer;
    onActivate: jest.Mock;
    setActive: jest.Mock;
    set: jest.Mock;
}

const render = async (opts: Options = {}): Promise<Harness> => {
    const settings: Settings = {...DEFAULT_SETTINGS, ...opts.settings};
    const setActive = jest.fn(async () => {});
    const set = jest.fn(async () => {});
    const repositories = {
        characters: {
            list: async () => opts.list ?? [],
            recent: async () => opts.recent ?? [],
            setActive,
        },
        settings: {get: async () => settings, set},
    } as unknown as Repositories;
    const onActivate = jest.fn();

    let tree!: ReactTestRenderer;
    await act(async () => {
        tree = TestRenderer.create(
            <ThemeProvider colorScheme="dark">
                <RepositoriesProvider repositories={repositories}>
                    <SettingsProvider initialSettings={settings}>
                        <QuickPick onActivate={onActivate} />
                    </SettingsProvider>
                </RepositoriesProvider>
            </ThemeProvider>,
        );
    });
    await act(async () => {}); // flush list/recent + settings load

    return {tree, onActivate, setActive, set};
};

const fire = async (tree: ReactTestRenderer, testID: string, handler: 'onPress' | 'onLongPress'): Promise<void> => {
    await act(async () => {
        tree.root
            .findAllByProps({testID})
            .find((n) => typeof n.props[handler] === 'function')
            ?.props[handler]();
    });
    await act(async () => {});
};

const exists = (tree: ReactTestRenderer, testID: string): boolean => tree.root.findAllByProps({testID}).length > 0;

describe('QuickPick', () => {
    it('activating a tile marks it active in the store, then opens it', async () => {
        const {tree, onActivate, setActive} = await render({list: [summary('a')], recent: [summary('a')]});

        await fire(tree, 'quickpick-slot-0', 'onPress');

        expect(setActive).toHaveBeenCalledWith('a');
        expect(onActivate).toHaveBeenCalledWith('a');
    });

    it('pinning a character through the picker persists the slot', async () => {
        const {tree, set} = await render({list: [summary('a'), summary('b')], recent: [summary('a'), summary('b')]});

        await fire(tree, 'quickpick-slot-0', 'onLongPress'); // curate slot 0
        await fire(tree, 'picker-row-b', 'onPress'); // pin B there

        const call = set.mock.calls.find(([key]) => key === 'pinnedCharacterIds');
        expect(call).toBeDefined();
        expect(call![1]).toEqual(['b', null, null, null, null, null, null, null, null]);

        // The tile is now a committed pin, and carries the pinned marker.
        expect(exists(tree, 'quickpick-pinned-0')).toBe(true);
    });

    it('never offers a character that is already pinned', async () => {
        const {tree} = await render({list: [summary('a'), summary('b')], recent: [], settings: {pinnedCharacterIds: ['a']}});

        await fire(tree, 'quickpick-slot-1', 'onLongPress'); // an empty slot

        expect(exists(tree, 'picker-row-a')).toBe(false); // 'a' is pinned in slot 0
        expect(exists(tree, 'picker-row-b')).toBe(true);
    });

    it('removing a pin empties its slot', async () => {
        const {tree, set} = await render({list: [summary('a')], recent: [], settings: {pinnedCharacterIds: ['a']}});

        await fire(tree, 'quickpick-slot-0', 'onLongPress'); // the pinned slot offers Remove
        expect(exists(tree, 'picker-remove')).toBe(true);

        await fire(tree, 'picker-remove', 'onPress');

        const call = set.mock.calls.find(([key]) => key === 'pinnedCharacterIds');
        expect(call![1]).toEqual([null, null, null, null, null, null, null, null, null]);
    });
});
