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
import {CharacterListScreen, type CharacterListScreenProps} from '../CharacterListScreen';

const summary = (over: Partial<CharacterSummary> = {}): CharacterSummary => ({
    id: 'c1',
    name: 'Defensor',
    player: 'Phil',
    edition: '6E',
    slot: 0,
    isActive: false,
    portraitUri: null,
    ...over,
});

const fakeCharacters = (summaries: CharacterSummary[], opts: {fail?: boolean} = {}): CharacterRepository =>
    ({
        list: async () => {
            if (opts.fail) {
                throw new Error('disk on fire');
            }
            return summaries;
        },
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

const renderScreen = async (characters: CharacterRepository, props: CharacterListScreenProps = {}): Promise<ReactTestRenderer> => {
    const repositories = {characters} as unknown as Repositories;

    let tree!: ReactTestRenderer;
    await act(async () => {
        tree = TestRenderer.create(
            <ThemeProvider colorScheme="dark">
                <RepositoriesProvider repositories={repositories}>
                    <CharacterListScreen {...props} />
                </RepositoriesProvider>
            </ThemeProvider>,
        );
    });
    await act(async () => {}); // flush the list() promise -> setState

    return tree;
};

describe('CharacterListScreen', () => {
    it('renders a row per character with name and edition · player subtitle', async () => {
        const tree = await renderScreen(fakeCharacters([summary({id: 'a', name: 'Alpha'}), summary({id: 'z', name: 'Zed', player: null})]));

        const text = collectText(tree.toJSON());
        expect(text).toContain('Alpha');
        expect(text).toContain('Zed');
        expect(text).toContain('6E · Phil'); // has a player
        expect(text).toContain('6E'); // player-less subtitle is just the edition
        expect(tree.root.findAllByProps({testID: 'loading'})).toHaveLength(0);
    });

    it('shows the empty state when there are no characters', async () => {
        const tree = await renderScreen(fakeCharacters([]));

        expect(collectText(tree.toJSON())).toContain('No characters yet');
    });

    it('marks the active character with a badge', async () => {
        const tree = await renderScreen(fakeCharacters([summary({id: 'a', isActive: false}), summary({id: 'b', name: 'Grond', isActive: true})]));

        // Filter to host nodes: RN's View surfaces both a composite and a host
        // instance carrying the same testID.
        const badges = tree.root.findAllByProps({testID: 'active-badge'}).filter((instance) => typeof instance.type === 'string');
        expect(badges).toHaveLength(1);
    });

    it('renders the portrait when present, else the name initial', async () => {
        const withPortrait = await renderScreen(fakeCharacters([summary({portraitUri: 'file:///images/p1.png'})]));
        expect(tree_portraitUri(withPortrait)).toBe('file:///images/p1.png');

        const withoutPortrait = await renderScreen(fakeCharacters([summary({name: 'Grond', portraitUri: null})]));
        expect(withoutPortrait.root.findAllByProps({testID: 'portrait'})).toHaveLength(0);
        expect(collectText(withoutPortrait.toJSON())).toContain('G'); // initial fallback
    });

    it('calls onSelect with the character id when a row is pressed', async () => {
        const onSelect = jest.fn();
        const tree = await renderScreen(fakeCharacters([summary({id: 'hero-7'})]), {onSelect});

        await act(async () => {
            tree.root.findByProps({testID: 'character-hero-7'}).props.onPress();
        });

        expect(onSelect).toHaveBeenCalledWith('hero-7');
    });

    it('shows an error message when loading fails', async () => {
        const tree = await renderScreen(fakeCharacters([], {fail: true}));

        expect(collectText(tree.toJSON())).toContain('disk on fire');
    });
});

const tree_portraitUri = (tree: ReactTestRenderer): string => tree.root.findByProps({testID: 'portrait'}).props.source.uri;
