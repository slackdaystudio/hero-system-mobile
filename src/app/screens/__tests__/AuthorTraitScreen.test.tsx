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
 * The form for one trait, on its own screen.
 *
 * These are the tests that used to drive the inline forms on the authoring screen. What is worth
 * checking is that the form reaches the shared draft — it edits by *address*, not by a prop
 * handed down — and that it draws whatever the catalogue says a trait declares.
 */
import React from 'react';
import TestRenderer, {act, type ReactTestRenderer} from 'react-test-renderer';
import {emptyDraft, type AuthoredCharacter, type AuthoringEdition} from 'core/authoring';
import {AuthoringDraftProvider, useAuthoringDraft, type TraitAddress} from 'app/providers/AuthoringDraftProvider';
import {ThemeProvider} from 'app/theme';
import {AuthorTraitScreen, type AuthorTraitScreenProps} from '../AuthorTraitScreen';

/** Renders the screen over a real draft, and hands back a way to read the draft after edits. */
const renderTrait = async (
    initial: AuthoredCharacter,
    address: TraitAddress,
    category: AuthorTraitScreenProps['category'] = 'powers',
): Promise<{tree: ReactTestRenderer; draft: () => AuthoredCharacter; done: () => number}> => {
    let current = initial;
    let doneCount = 0;

    const Probe = (): null => {
        current = useAuthoringDraft().draft;
        return null;
    };

    let tree!: ReactTestRenderer;
    await act(async () => {
        tree = TestRenderer.create(
            <ThemeProvider colorScheme="dark">
                <AuthoringDraftProvider initial={initial}>
                    <Probe />
                    <AuthorTraitScreen address={address} category={category} onDone={() => (doneCount += 1)} />
                </AuthoringDraftProvider>
            </ThemeProvider>,
        );
    });
    await act(async () => {});

    return {tree, draft: () => current, done: () => doneCount};
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

const withPower = (): AuthoredCharacter => ({
    ...emptyDraft('6E'),
    powers: [{xmlid: 'ENERGYBLAST', name: 'Bolt', input: 'ED', adders: [], levels: 5, modifiers: []}],
});

describe('AuthorTraitScreen — editing reaches the shared draft', () => {
    it('writes a name change back to the draft', async () => {
        const {tree, draft} = await renderTrait(withPower(), {kind: 'trait', key: 'powers', index: 0});

        await type(tree, 'author-name-powers-0', 'Fire Bolt');

        // The screen has no draft prop and no callback — it addresses the provider directly.
        expect(draft().powers[0].name).toBe('Fire Bolt');
    });

    it('writes a levels change back to the draft', async () => {
        const {tree, draft} = await renderTrait(withPower(), {kind: 'trait', key: 'powers', index: 0});

        await type(tree, 'author-levels-powers-0', '12');

        expect(draft().powers[0].levels).toBe(12);
    });

    it('removes the trait and leaves, so the list is not left showing a gap', async () => {
        const {tree, draft, done} = await renderTrait(withPower(), {kind: 'trait', key: 'powers', index: 0});

        await press(tree, 'author-remove-powers-0');

        expect(draft().powers).toEqual([]);
        expect(done()).toBe(1);
    });

    it('edits a framework slot through its two-part address', async () => {
        const initial: AuthoredCharacter = {
            ...emptyDraft('6E'),
            frameworks: [
                {
                    kind: 'multipower',
                    name: 'Belt',
                    reserve: 60,
                    modifiers: [],
                    slots: [
                        {xmlid: 'ENERGYBLAST', name: 'Stun Gun', input: 'ED', adders: [], levels: 12, modifiers: []},
                        {xmlid: 'ENERGYBLAST', name: 'Net', input: 'ED', adders: [], levels: 10, modifiers: []},
                    ],
                },
            ],
        };
        const {tree, draft} = await renderTrait(initial, {kind: 'slot', framework: 0, index: 1});

        await type(tree, 'author-name-framework-0-slot-1', 'Bola');

        expect(draft().frameworks[0].slots.map((slot) => slot.name)).toEqual(['Stun Gun', 'Bola']);
    });
});

describe('AuthorTraitScreen — it draws what the catalogue declares', () => {
    it('offers modifiers on a power', async () => {
        const {tree} = await renderTrait(withPower(), {kind: 'trait', key: 'powers', index: 0});

        expect(tree.root.findAllByProps({testID: 'author-add-modifier-powers-0'}).length).toBeGreaterThan(0);
    });

    it('offers no modifiers on a skill, because a skill cannot take one', async () => {
        const initial: AuthoredCharacter = {...emptyDraft('6E'), skills: [{xmlid: 'ACROBATICS', input: '', adders: [], characteristic: 'DEX', levels: 0}]};
        const {tree} = await renderTrait(initial, {kind: 'trait', key: 'skills', index: 0}, 'skills');

        expect(tree.root.findAllByProps({testID: 'author-add-modifier-skills-0'})).toHaveLength(0);
    });

    it('draws the four defence fields for a Resistant Protection, and writes them back', async () => {
        const initial: AuthoredCharacter = {
            ...emptyDraft('6E'),
            powers: [{xmlid: 'FORCEFIELD', name: 'Vest', input: '', adders: [], levels: 0, modifiers: [], defense: {pd: 0, ed: 0, mental: 0, power: 0}}],
        };
        const {tree, draft} = await renderTrait(initial, {kind: 'trait', key: 'powers', index: 0});

        for (const field of ['pd', 'ed', 'mental', 'power']) {
            expect(tree.root.findAllByProps({testID: `author-defense-powers-0-${field}`}).length).toBeGreaterThan(0);
        }

        await type(tree, 'author-defense-powers-0-pd', '17');
        expect(draft().powers[0].defense).toEqual({pd: 17, ed: 0, mental: 0, power: 0});
    });
});

describe('AuthorTraitScreen — a framework pool', () => {
    const withFramework = (): AuthoredCharacter => ({
        ...emptyDraft('6E'),
        frameworks: [{kind: 'multipower', name: 'Belt', reserve: 60, modifiers: [], slots: []}],
    });

    it("edits the pool's advantages and limitations, which are not a trait", async () => {
        const {tree} = await renderTrait(withFramework(), {kind: 'pool', framework: 0});

        // A pool has no catalogue entry, no levels and nothing to pick — only modifiers apply.
        expect(tree.root.findAllByProps({testID: 'author-add-modifier-framework-0'}).length).toBeGreaterThan(0);
        expect(tree.root.findAllByProps({testID: 'author-name-framework-0'})).toHaveLength(0);
    });
});

describe('AuthorTraitScreen — a Multipower slot picks its kind', () => {
    const bolt = {xmlid: 'ENERGYBLAST', name: 'Bolt', input: 'ED', adders: [], levels: 12, modifiers: []};

    const withSlot = (kind: AuthoredCharacter['frameworks'][number]['kind'], edition: AuthoringEdition = '6E'): AuthoredCharacter => ({
        ...emptyDraft(edition),
        frameworks: [{kind, name: 'Belt', reserve: 60, modifiers: [], slots: [bolt]}],
    });

    const segment = async (tree: ReactTestRenderer, value: string): Promise<void> => {
        await act(async () => {
            tree.root
                .findAllByProps({testID: `segment-${value}`})
                .find((node) => typeof node.props.onPress === 'function')
                ?.props.onPress();
        });
        await act(async () => {});
    };

    it('writes the choice back to the draft', async () => {
        const {tree, draft} = await renderTrait(withSlot('multipower'), {kind: 'slot', framework: 0, index: 0});

        await segment(tree, 'variable');
        expect(draft().frameworks[0].slots[0].variable).toBe(true);

        await segment(tree, 'fixed');
        expect(draft().frameworks[0].slots[0].variable).toBe(false);
    });

    it('keeps the choice when the trait form edits something else', async () => {
        // `variable` lives on the slot, and the trait form is typed to the trait — so an edit made
        // through it must not drop the fields it cannot see.
        const {tree, draft} = await renderTrait(withSlot('multipower'), {kind: 'slot', framework: 0, index: 0});

        await segment(tree, 'variable');
        await type(tree, 'author-name-framework-0-slot-0', 'Grapple Line');

        expect(draft().frameworks[0].slots[0]).toMatchObject({name: 'Grapple Line', variable: true});
    });

    it('names the two kinds the way the edition names them', async () => {
        const labels = (tree: ReactTestRenderer): unknown[] =>
            tree.root.findAllByProps({testID: 'author-slot-kind-0'})[0].props.children[1].props.segments.map((entry: {label: string}) => entry.label);

        const sixth = await renderTrait(withSlot('multipower'), {kind: 'slot', framework: 0, index: 0});
        expect(labels(sixth.tree)).toEqual(['Fixed slot', 'Variable slot']);

        // 6E renamed them; a 5E player is picking between an ultra and a multi slot.
        const fifth = await renderTrait(withSlot('multipower', '5E'), {kind: 'slot', framework: 0, index: 0});
        expect(labels(fifth.tree)).toEqual(['Ultra slot', 'Multi slot']);
    });

    it('does not offer the choice where there is none', async () => {
        // An Elemental Control slot pays what it exceeds the pool by and a VPP's are prefabs, so
        // neither has the distinction. A control that changed no number is what H13 already was.
        for (const kind of ['elementalControl', 'vpp'] as const) {
            const {tree} = await renderTrait(withSlot(kind), {kind: 'slot', framework: 0, index: 0});

            expect(tree.root.findAllByProps({testID: 'author-slot-kind-0'})).toHaveLength(0);
        }
    });
});

describe('AuthorTraitScreen — a stale address', () => {
    it('says so and offers a way out rather than throwing', async () => {
        // Addresses are indices, so one can outlive the trait it pointed at.
        const {tree, done} = await renderTrait(withPower(), {kind: 'trait', key: 'powers', index: 7});

        expect(tree.root.findAllByProps({testID: 'author-trait-missing'}).length).toBeGreaterThan(0);

        await press(tree, 'author-trait-done');
        expect(done()).toBe(1);
    });

    it('says the same for a framework that has gone', async () => {
        const {tree} = await renderTrait(withPower(), {kind: 'pool', framework: 3});

        expect(tree.root.findAllByProps({testID: 'author-trait-missing'}).length).toBeGreaterThan(0);
    });
});
