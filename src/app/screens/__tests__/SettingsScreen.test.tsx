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
import {DEFAULT_SETTINGS, type Settings, type SettingsRepository} from 'core/ports';
import type {Repositories} from 'infra/persistence/repositories';
import {RepositoriesProvider} from 'app/providers/RepositoriesProvider';
import {SettingsProvider, useSettings} from 'app/providers/SettingsProvider';
import {darkTheme, lightTheme, ThemeProvider, useTheme} from 'app/theme';
import {SettingsScreen} from '../SettingsScreen';

const fakeSettings = (initial: Settings = DEFAULT_SETTINGS) => {
    let stored: Settings = {...initial};
    const repo = {
        get: async () => stored,
        set: async (key, value) => {
            stored = {...stored, [key]: value};
        },
        reset: async () => {
            stored = {...DEFAULT_SETTINGS};
        },
    } as SettingsRepository;
    return {repo, current: () => stored};
};

// A probe that surfaces the currently-resolved theme so a test can assert the
// live re-theme (background) and font scaling (title size).
let observedBackground = '';
let observedTitleSize = 0;
function ThemeProbe(): null {
    const theme = useTheme();
    observedBackground = theme.colors.background;
    observedTitleSize = theme.fontSize.title;
    return null;
}

const renderApp = async (settingsRepo: SettingsRepository): Promise<ReactTestRenderer> => {
    const repositories = {settings: settingsRepo} as unknown as Repositories;

    let tree!: ReactTestRenderer;
    await act(async () => {
        tree = TestRenderer.create(
            <RepositoriesProvider repositories={repositories}>
                <SettingsProvider>
                    <LiveTheme />
                </SettingsProvider>
            </RepositoriesProvider>,
        );
    });
    await act(async () => {}); // flush the settings load
    return tree;
};

// Mirrors App.tsx: theme follows the persisted colour scheme, live.
function LiveTheme(): React.JSX.Element {
    const {settings} = useSettings();
    return (
        <ThemeProvider colorScheme={settings.colorScheme} fontScale={settings.fontScale}>
            <ThemeProbe />
            <SettingsScreen />
        </ThemeProvider>
    );
}

const pressSegment = async (tree: ReactTestRenderer, value: string): Promise<void> => {
    const target = tree.root.findAllByProps({testID: `segment-${value}`}).find((node) => typeof node.props.onPress === 'function');
    await act(async () => {
        target?.props.onPress();
    });
    await act(async () => {});
};

describe('SettingsScreen', () => {
    it('changes the theme live and persists the choice', async () => {
        const {repo, current} = fakeSettings();
        const tree = await renderApp(repo);

        await pressSegment(tree, 'light');
        expect(observedBackground).toBe(lightTheme.colors.background);
        expect(current().colorScheme).toBe('light');

        await pressSegment(tree, 'dark');
        expect(observedBackground).toBe(darkTheme.colors.background);
        expect(current().colorScheme).toBe('dark');
    });

    it('reflects the persisted colour scheme on load', async () => {
        const {repo} = fakeSettings({...DEFAULT_SETTINGS, colorScheme: 'light'});
        await renderApp(repo);

        expect(observedBackground).toBe(lightTheme.colors.background);
    });

    it('toggles screen animations and persists the choice', async () => {
        const {repo, current} = fakeSettings();
        const tree = await renderApp(repo);

        const toggle = tree.root.findAllByProps({testID: 'toggle-animations'}).find((node) => typeof node.props.onValueChange === 'function');
        expect(toggle?.props.value).toBe(true); // default on

        await act(async () => {
            toggle?.props.onValueChange(false);
        });
        await act(async () => {});

        expect(current().showAnimations).toBe(false);
    });

    const pressButton = async (tree: ReactTestRenderer, testID: string): Promise<void> => {
        const target = tree.root.findAllByProps({testID}).find((node) => typeof node.props.onPress === 'function');
        await act(async () => {
            target?.props.onPress();
        });
        await act(async () => {});
    };

    it('bumps the font scale up and down and persists it', async () => {
        const {repo, current} = fakeSettings();
        const tree = await renderApp(repo);

        await pressButton(tree, 'font-increase');
        expect(current().fontScale).toBe(1.1);

        await pressButton(tree, 'font-decrease');
        await pressButton(tree, 'font-decrease');
        expect(current().fontScale).toBe(0.9);
    });

    it('scales the theme font sizes live from the persisted setting', async () => {
        const {repo} = fakeSettings({...DEFAULT_SETTINGS, fontScale: 1.5});
        await renderApp(repo);

        expect(observedTitleSize).toBe(Math.round(darkTheme.fontSize.title * 1.5));

        await renderApp(fakeSettings().repo); // back to default scale
        expect(observedTitleSize).toBe(darkTheme.fontSize.title);
    });
});
