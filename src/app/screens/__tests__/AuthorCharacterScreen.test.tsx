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
 * Authoring a character, end to end through the screen.
 *
 * What is worth testing here is not that fields render — it is the three claims the feature rests
 * on: the points meter is the engine's own answer, a draft that saves can be re-opened and rebuilds
 * the same character, and an unbuildable draft cannot be saved.
 */
import React from 'react';
import TestRenderer, {act, type ReactTestRenderer} from 'react-test-renderer';
import type {CharacterRepository, SaveCharacter} from 'core/ports';
import {parseSource, build, emit, type AuthoredCharacter} from 'core/authoring';
import type {Repositories} from 'infra/persistence/repositories';
import {AuthoringProvider} from 'app/providers/AuthoringProvider';
import {RepositoriesProvider} from 'app/providers/RepositoriesProvider';
import {ThemeProvider} from 'app/theme';
import {AuthorCharacterScreen} from '../AuthorCharacterScreen';

type Obj = Record<string, any>;

const renderScreen = async (
    props: Partial<React.ComponentProps<typeof AuthorCharacterScreen>> = {},
    existing: string[] = [],
): Promise<{tree: ReactTestRenderer; saved: SaveCharacter[]; savedIds: string[]}> => {
    const saved: SaveCharacter[] = [];
    const savedIds: string[] = [];
    const characters = {
        save: async (input: SaveCharacter) => {
            saved.push(input);
        },
        list: async () => existing.map((id) => ({id})),
    } as unknown as CharacterRepository;

    let tree!: ReactTestRenderer;
    await act(async () => {
        tree = TestRenderer.create(
            <ThemeProvider colorScheme="dark">
                <RepositoriesProvider repositories={{characters} as unknown as Repositories}>
                    <AuthoringProvider>
                        <AuthorCharacterScreen onSaved={(id) => savedIds.push(id)} onCancel={() => {}} {...props} />
                    </AuthoringProvider>
                </RepositoriesProvider>
            </ThemeProvider>,
        );
    });
    await act(async () => {});

    return {tree, saved, savedIds};
};

const type = async (tree: ReactTestRenderer, testID: string, value: string): Promise<void> => {
    await act(async () => {
        tree.root
            .findAllByProps({testID})
            .find((node) => typeof node.props.onChangeText === 'function')
            ?.props.onChangeText(value);
    });
};

const press = async (tree: ReactTestRenderer, testID: string): Promise<void> => {
    await act(async () => {
        tree.root
            .findAllByProps({testID})
            .find((node) => typeof node.props.onPress === 'function')
            ?.props.onPress();
    });
    await act(async () => {});
};

const textOf = (tree: ReactTestRenderer, testID: string): string => {
    const node = tree.root.findAllByProps({testID}).find((candidate) => candidate.props.children !== undefined);
    const flatten = (children: unknown): string =>
        Array.isArray(children) ? children.map(flatten).join('') : children === null || children === undefined || typeof children === 'boolean' ? '' : String(children);

    return node === undefined ? '' : flatten(node.props.children);
};

describe('AuthorCharacterScreen', () => {
    it("shows the engine's own points total as characteristics change", async () => {
        const {tree} = await renderScreen();

        // 6E STR is 1 point per point over a base of 10, DEX is 2 per point over 10.
        await type(tree, 'author-char-str', '20');
        expect(textOf(tree, 'author-spend')).toBe('10 spent of 400');

        await type(tree, 'author-char-dex', '18');
        expect(textOf(tree, 'author-spend')).toBe('26 spent of 400');
        expect(textOf(tree, 'author-remaining')).toBe('374 remaining');
    });

    it('agrees exactly with what core prices, because it asks the same engine', async () => {
        const {tree} = await renderScreen();

        await type(tree, 'author-char-str', '30');
        await type(tree, 'author-char-con', '25');

        const reference = build({edition: '6E', name: '', player: '', characteristics: {str: 30, con: 25}, complications: []});
        const spent = (reference.characteristics as Obj[]).reduce((total, entry) => total + Number(entry.cost), 0);

        expect(textOf(tree, 'author-spend')).toBe(`${spent} spent of 400`);
    });

    it('reports going over budget rather than preventing it', async () => {
        const {tree} = await renderScreen();

        await type(tree, 'author-char-str', '500');

        expect(textOf(tree, 'author-remaining')).toContain('over budget');
        // Still saveable: over budget is a GM's problem, not a malformed character.
        expect(tree.root.findAllByProps({testID: 'author-save'}).some((node) => node.props.disabled === false)).toBe(true);
    });

    it('says complications fund a 5E build and not a 6E one', async () => {
        const sixth = await renderScreen();
        expect(textOf(sixth.tree, 'author-complications-total')).toContain('grant no points');

        const fifth = await renderScreen({initial: {edition: '5E', name: 'Fifth', player: '', characteristics: {}, complications: []}});
        expect(textOf(fifth.tree, 'author-complications-total')).toContain('fund the build');
    });
});

describe('AuthorCharacterScreen — saving', () => {
    const draft: AuthoredCharacter = {
        edition: '6E',
        name: 'Testable',
        player: 'Phil',
        characteristics: {str: 20, dex: 18},
        complications: [
            {
                xmlid: 'PSYCHOLOGICALLIMITATION',
                input: 'Code Of The Hero',
                adders: [
                    {xmlid: 'SITUATION', option: 'COMMON'},
                    {xmlid: 'INTENSITY', option: 'STRONG'},
                ],
            },
        ],
    };

    it('saves the document, the draft, and marks it authored', async () => {
        const {tree, saved, savedIds} = await renderScreen({initial: draft});

        await press(tree, 'author-save');

        expect(saved).toHaveLength(1);
        expect(saved[0]).toMatchObject({name: 'Testable', player: 'Phil', edition: '6E', origin: 'authored'});
        expect(saved[0].source).toBeDefined();
        expect(savedIds).toEqual(['authored-testable']);
    });

    it('re-opens the saved draft and rebuilds the identical character', async () => {
        const {tree, saved} = await renderScreen({initial: draft});
        await press(tree, 'author-save');

        // The round trip that makes an authored character editable at all.
        const reopened = parseSource(JSON.parse(JSON.stringify(saved[0].source)))!;

        expect(reopened).toEqual(draft);
        expect(emit(reopened)).toEqual(emit(draft));
        expect(saved[0].document).toEqual(build(draft));
    });

    it('keeps the id when editing, rather than making a second character', async () => {
        const {tree, saved, savedIds} = await renderScreen({initial: draft, characterId: 'authored-testable'});

        await press(tree, 'author-save');

        expect(saved[0].id).toBe('authored-testable');
        expect(savedIds).toEqual(['authored-testable']);
    });

    it('suffixes the id rather than overwriting a character with the same name', async () => {
        const {tree, saved} = await renderScreen({initial: draft}, ['authored-testable']);

        await press(tree, 'author-save');

        expect(saved[0].id).toBe('authored-testable-2');
    });

    it('locks the edition once saved, because re-pricing under the other rulebook is a new character', async () => {
        const {tree} = await renderScreen({initial: draft, characterId: 'authored-testable'});

        expect(textOf(tree, 'author-edition-locked')).toBe('6th Edition');
        expect(tree.root.findAllByProps({testID: 'segment-5E'})).toHaveLength(0);
    });
});

describe('AuthorCharacterScreen — refusing to save what the engine cannot price', () => {
    it('blocks a complication missing its required adders, and says which', async () => {
        const {tree, saved} = await renderScreen({
            initial: {edition: '6E', name: 'Broken', player: '', characteristics: {}, complications: [{xmlid: 'PSYCHOLOGICALLIMITATION', input: 'Code', adders: []}]},
        });

        expect(textOf(tree, 'author-problem-error-0')).toContain('Situation');
        expect(tree.root.findAllByProps({testID: 'author-save'}).every((node) => node.props.disabled !== false)).toBe(true);

        await press(tree, 'author-save');
        expect(saved).toHaveLength(0);
    });

    it('blocks a complication this edition does not define — the silent-zero trap', async () => {
        const {tree, saved} = await renderScreen({
            initial: {edition: '6E', name: 'Broken', player: '', characteristics: {}, complications: [{xmlid: 'NOT_REAL', input: '', adders: []}]},
        });

        expect(textOf(tree, 'author-problem-error-0')).toContain('has no complication');
        // And it does not try to price it while broken, which is what the meter says instead.
        expect(textOf(tree, 'author-spend')).toContain('unavailable');

        await press(tree, 'author-save');
        expect(saved).toHaveLength(0);
    });

    it('warns without blocking when a character has no name', async () => {
        const {tree, saved} = await renderScreen({initial: {edition: '6E', name: '', player: '', characteristics: {str: 20}, complications: []}});

        expect(tree.root.findAllByProps({testID: 'author-problem-warning-0'}).length).toBeGreaterThan(0);

        await press(tree, 'author-save');
        expect(saved).toHaveLength(1);
        expect(saved[0].name).toBe('Unnamed');
    });
});
