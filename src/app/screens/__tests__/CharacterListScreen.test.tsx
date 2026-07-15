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
import {Alert} from 'react-native';
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
    isActive: false,
    portraitUri: null,
    ...over,
});

const fakeCharacters = (summaries: CharacterSummary[], opts: {fail?: boolean; deleted?: string[]; deleteFails?: boolean} = {}): CharacterRepository =>
    ({
        list: async () => {
            if (opts.fail) {
                throw new Error('disk on fire');
            }
            return summaries;
        },
        delete: async (id: string) => {
            if (opts.deleteFails) {
                throw new Error('rows are load-bearing');
            }
            opts.deleted?.push(id);
        },
    } as unknown as CharacterRepository);

/** The buttons an `Alert.alert` was offered, so a test can pick one. */
type AlertButton = {text?: string; style?: string; onPress?: () => void};

const alertSpy = () => jest.spyOn(Alert, 'alert').mockImplementation(() => undefined);

const pressAlertButton = async (spy: jest.SpyInstance, text: string): Promise<void> => {
    const buttons = spy.mock.calls[spy.mock.calls.length - 1][2] as AlertButton[];

    await act(async () => {
        buttons.find((button) => button.text === text)?.onPress?.();
    });
};

const longPress = async (tree: ReactTestRenderer, id: string): Promise<void> => {
    const row = tree.root.findAllByProps({testID: `character-${id}`}).find((node) => typeof node.props.onLongPress === 'function');

    await act(async () => {
        row?.props.onLongPress();
    });
};

/** Tap the row's trash button — the discoverable path to the same confirmation. */
const pressTrash = async (tree: ReactTestRenderer, id: string): Promise<void> => {
    const trash = tree.root.findAllByProps({testID: `character-${id}-delete`}).find((node) => typeof node.props.onPress === 'function');

    await act(async () => {
        trash?.props.onPress();
    });
};

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
    it('reloads the list when refreshToken changes (e.g. after an import)', async () => {
        let names = ['Alpha'];
        const characters = {list: async () => names.map((name, i) => summary({id: String(i), name}))} as unknown as CharacterRepository;
        const repositories = {characters} as unknown as Repositories;
        const wrap = (token: number): React.JSX.Element => (
            <ThemeProvider colorScheme="dark">
                <RepositoriesProvider repositories={repositories}>
                    <CharacterListScreen refreshToken={token} />
                </RepositoriesProvider>
            </ThemeProvider>
        );

        let tree!: ReactTestRenderer;
        await act(async () => {
            tree = TestRenderer.create(wrap(0));
        });
        await act(async () => {});
        expect(collectText(tree.toJSON())).toContain('Alpha');

        names = ['Beta'];
        await act(async () => {
            tree.update(wrap(1));
        });
        await act(async () => {});

        const text = collectText(tree.toJSON());
        expect(text).toContain('Beta');
        expect(text).not.toContain('Alpha');
    });

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

    describe('deleting a character', () => {
        afterEach(() => jest.restoreAllMocks());

        it('asks before deleting, naming the character and defaulting to Cancel', async () => {
            const spy = alertSpy();
            const tree = await renderScreen(fakeCharacters([summary({name: 'Defensor'})]));

            await longPress(tree, 'c1');

            // Deleting is irreversible, so the nag has to name what is about to go.
            expect(spy).toHaveBeenCalledTimes(1);
            expect(spy.mock.calls[0][0]).toBe('Delete Defensor?');
            expect(spy.mock.calls[0][1]).toBe('This cannot be undone.');

            const buttons = spy.mock.calls[0][2] as AlertButton[];
            expect(buttons.map((button) => [button.text, button.style])).toEqual([
                ['Cancel', 'cancel'],
                ['Delete', 'destructive'],
            ]);
        });

        it('deletes nothing until the nag is confirmed', async () => {
            const deleted: string[] = [];
            const spy = alertSpy();
            const tree = await renderScreen(fakeCharacters([summary()], {deleted}));

            await longPress(tree, 'c1');
            expect(deleted).toEqual([]); // the long-press alone must not delete

            await pressAlertButton(spy, 'Cancel');
            expect(deleted).toEqual([]); // ...and neither must Cancel
        });

        it('deletes and reloads once confirmed', async () => {
            const deleted: string[] = [];
            const spy = alertSpy();
            const tree = await renderScreen(fakeCharacters([summary({id: 'c1', name: 'Defensor'})], {deleted}));

            await longPress(tree, 'c1');
            await pressAlertButton(spy, 'Delete');

            expect(deleted).toEqual(['c1']);
        });

        it('surfaces a failed delete instead of silently doing nothing', async () => {
            const spy = alertSpy();
            const tree = await renderScreen(fakeCharacters([summary()], {deleteFails: true}));

            await longPress(tree, 'c1');
            await pressAlertButton(spy, 'Delete');

            expect(spy.mock.calls[spy.mock.calls.length - 1][0]).toBe('Delete failed');
            expect(spy.mock.calls[spy.mock.calls.length - 1][1]).toBe('rows are load-bearing');
        });
    });

    describe('the trash button', () => {
        afterEach(() => jest.restoreAllMocks());

        it('offers one per row, naming its character for screen readers', async () => {
            const spy = alertSpy();
            const tree = await renderScreen(fakeCharacters([summary({id: 'c1', name: 'Defensor'}), summary({id: 'c2', name: 'Grond'})]));

            const trash = tree.root.findByProps({testID: 'character-c2-delete'});
            expect(trash.props.accessibilityLabel).toBe('Delete Grond');

            await pressTrash(tree, 'c2');
            expect(spy.mock.calls[0][0]).toBe('Delete Grond?');
        });

        it('does not open the character it deletes', async () => {
            // The trash sits inside the row's own Pressable. If the touch fell through, a delete
            // would also navigate to the character being deleted.
            const spy = alertSpy();
            const onSelect = jest.fn();
            const tree = await renderScreen(fakeCharacters([summary()]), {onSelect});

            await pressTrash(tree, 'c1');

            expect(onSelect).not.toHaveBeenCalled();
            expect(spy).toHaveBeenCalledTimes(1);
        });

        it('still confirms — a visible button is easier to mis-tap than a long-press', async () => {
            const deleted: string[] = [];
            const spy = alertSpy();
            const tree = await renderScreen(fakeCharacters([summary()], {deleted}));

            await pressTrash(tree, 'c1');
            expect(deleted).toEqual([]);

            await pressAlertButton(spy, 'Cancel');
            expect(deleted).toEqual([]);

            await pressTrash(tree, 'c1');
            await pressAlertButton(spy, 'Delete');
            expect(deleted).toEqual(['c1']);
        });
    });
});

const tree_portraitUri = (tree: ReactTestRenderer): string => tree.root.findByProps({testID: 'portrait'}).props.source.uri;
