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
import {Modal} from 'react-native';
import TestRenderer, {act, type ReactTestRenderer} from 'react-test-renderer';
import type {CharacterSummary, Settings} from 'core/ports';
import {DEFAULT_SETTINGS} from 'core/ports';
import type {Repositories} from 'infra/persistence/repositories';
import {RepositoriesProvider} from 'app/providers/RepositoriesProvider';
import {SettingsProvider} from 'app/providers/SettingsProvider';
import {ThemeProvider} from 'app/theme';
import {QuickPickSheet} from '../QuickPickSheet';

const summary = (id: string): CharacterSummary => ({
    id,
    name: id.toUpperCase(),
    player: null,
    edition: '6E',
    isActive: false,
    portraitUri: null,
    portraitFocus: null,
});

const render = async (recent: CharacterSummary[] = [summary('a')]): Promise<{tree: ReactTestRenderer; onActivate: jest.Mock; setActive: jest.Mock}> => {
    // Animations off: the slide resolves synchronously, so open/close is deterministic in tests.
    const settings: Settings = {...DEFAULT_SETTINGS, showAnimations: false};
    const setActive = jest.fn(async () => {});
    const repositories = {
        characters: {list: async () => recent, recent: async () => recent, setActive},
        settings: {get: async () => settings, set: async () => {}},
    } as unknown as Repositories;
    const onActivate = jest.fn();

    let tree!: ReactTestRenderer;
    await act(async () => {
        tree = TestRenderer.create(
            <ThemeProvider colorScheme="dark">
                <RepositoriesProvider repositories={repositories}>
                    <SettingsProvider initialSettings={settings}>
                        <QuickPickSheet onActivate={onActivate} />
                    </SettingsProvider>
                </RepositoriesProvider>
            </ThemeProvider>,
        );
    });
    await act(async () => {});
    return {tree, onActivate, setActive};
};

const fire = async (tree: ReactTestRenderer, testID: string, handler: 'onPress' = 'onPress'): Promise<void> => {
    await act(async () => {
        tree.root
            .findAllByProps({testID})
            .find((n) => typeof n.props[handler] === 'function')
            ?.props[handler]();
    });
    await act(async () => {});
};

const sheetOpen = (tree: ReactTestRenderer): boolean => tree.root.findAllByType(Modal)[0]?.props.visible === true;

describe('QuickPickSheet', () => {
    it('shows a persistent handle and opens the sheet on tap', async () => {
        const {tree} = await render();

        expect(tree.root.findAllByProps({testID: 'quickpick-handle'}).length).toBeGreaterThan(0);
        expect(sheetOpen(tree)).toBe(false);

        await fire(tree, 'quickpick-handle');
        expect(sheetOpen(tree)).toBe(true);
    });

    it('dismisses on the backdrop', async () => {
        const {tree} = await render();

        await fire(tree, 'quickpick-handle');
        expect(sheetOpen(tree)).toBe(true);

        await fire(tree, 'quickpick-sheet-backdrop');
        expect(sheetOpen(tree)).toBe(false);
    });

    it('switching a character from the open sheet activates and opens it', async () => {
        const {tree, onActivate, setActive} = await render([summary('a')]);

        await fire(tree, 'quickpick-handle');
        await fire(tree, 'quickpick-slot-0');

        expect(setActive).toHaveBeenCalledWith('a');
        expect(onActivate).toHaveBeenCalledWith('a');
    });
});
