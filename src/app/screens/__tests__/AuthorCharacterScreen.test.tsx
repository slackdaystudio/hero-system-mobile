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
import {parseSource, build, emit, emptyDraft, type AuthoredCharacter} from 'core/authoring';
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

        const reference = build({...emptyDraft('6E'), characteristics: {str: 30, con: 25}});
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

        const fifth = await renderScreen({initial: {...emptyDraft('5E'), name: 'Fifth'}});
        expect(textOf(fifth.tree, 'author-complications-total')).toContain('fund the build');
    });
});

describe('AuthorCharacterScreen — saving', () => {
    const draft: AuthoredCharacter = {
        ...emptyDraft('6E'),
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
            initial: {...emptyDraft('6E'), name: 'Broken', complications: [{xmlid: 'PSYCHOLOGICALLIMITATION', input: 'Code', adders: []}]},
        });

        expect(textOf(tree, 'author-problem-error-0')).toContain('Situation');
        expect(tree.root.findAllByProps({testID: 'author-save'}).every((node) => node.props.disabled !== false)).toBe(true);

        await press(tree, 'author-save');
        expect(saved).toHaveLength(0);
    });

    it('blocks a complication this edition does not define — the silent-zero trap', async () => {
        const {tree, saved} = await renderScreen({
            initial: {...emptyDraft('6E'), name: 'Broken', complications: [{xmlid: 'NOT_REAL', input: '', adders: []}]},
        });

        expect(textOf(tree, 'author-problem-error-0')).toContain('has no complication');
        // And it does not try to price it while broken, which is what the meter says instead.
        expect(textOf(tree, 'author-spend')).toContain('unavailable');

        await press(tree, 'author-save');
        expect(saved).toHaveLength(0);
    });

    it('warns without blocking when a character has no name', async () => {
        const {tree, saved} = await renderScreen({initial: {...emptyDraft('6E'), characteristics: {str: 20}}});

        expect(tree.root.findAllByProps({testID: 'author-problem-warning-0'}).length).toBeGreaterThan(0);

        await press(tree, 'author-save');
        expect(saved).toHaveLength(1);
        expect(saved[0].name).toBe('Unnamed');
    });
});

describe('AuthorCharacterScreen — one renderer for four categories', () => {
    it('offers a section per category, each populated from its own catalogue', async () => {
        const {tree} = await renderScreen();

        for (const key of ['skills', 'perks', 'talents', 'complications']) {
            expect(tree.root.findAllByProps({testID: `author-add-${key}`}).length).toBeGreaterThan(0);
        }
    });

    it('says how many entries need a form of their own rather than quietly shortening the list', async () => {
        const {tree} = await renderScreen();
        const add = tree.root.findAllByProps({testID: 'author-add-skills'}).find((node) => node.props.hint !== undefined);

        // A shorter list reads as "the app lacks Weapon Familiarity"; this reads as "not yet".
        expect(add?.props.hint).toMatch(/\d+ more need a form of their own/);
    });

    it('prices a skill through the same engine the meter uses', async () => {
        const skill: AuthoredCharacter = {
            ...emptyDraft('6E'),
            name: 'Tumbler',
            characteristics: {dex: 18},
            skills: [{xmlid: 'ACROBATICS', input: '', adders: [], characteristic: 'DEX', levels: 2}],
        };
        const {tree} = await renderScreen({initial: skill});

        // DEX 18 is 16 points; Acrobatics +2 is 3 + 2*2 = 7.
        expect(textOf(tree, 'author-spend')).toBe('23 spent of 400');
    });

    it('blocks a skill with no characteristic chosen, which would price at 0', async () => {
        const {tree, saved} = await renderScreen({
            initial: {...emptyDraft('6E'), name: 'Broken', skills: [{xmlid: 'ACROBATICS', input: '', adders: [], levels: 0}]},
        });

        expect(textOf(tree, 'author-problem-error-0')).toContain('which characteristic');

        await press(tree, 'author-save');
        expect(saved).toHaveLength(0);
    });

    it('saves and re-opens a character with all four categories filled', async () => {
        const full: AuthoredCharacter = {
            ...emptyDraft('6E'),
            name: 'Complete',
            characteristics: {dex: 18},
            skills: [{xmlid: 'LANGUAGES', input: 'French', adders: [], option: 'FLUENT', levels: 0}],
            perks: [{xmlid: 'ANONYMITY', input: '', adders: [], levels: 0}],
            talents: [{xmlid: 'COMBAT_LUCK', input: '', adders: [], levels: 2}],
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
        const {tree, saved} = await renderScreen({initial: full});

        await press(tree, 'author-save');

        expect(saved).toHaveLength(1);
        expect(parseSource(JSON.parse(JSON.stringify(saved[0].source)))).toEqual(full);
        expect(saved[0].document).toEqual(build(full));
    });
});

describe('AuthorCharacterScreen — powers and their modifiers', () => {
    const grenade: AuthoredCharacter = {
        ...emptyDraft('6E'),
        name: 'Bomber',
        powers: [
            {
                xmlid: 'ENERGYBLAST',
                name: 'Grenade',
                input: 'ED',
                adders: [],
                levels: 10,
                modifiers: [
                    {xmlid: 'AOE', option: 'RADIUS', levels: 8, adders: []},
                    {xmlid: 'FOCUS', option: 'OAF', adders: []},
                ],
            },
        ],
    };

    it('shows the real cost, which is what the character actually pays', async () => {
        const {tree} = await renderScreen({initial: grenade});

        // (50 x 1.5) / 2 = 37. The meter reads real cost, not active — active is what the power
        // is worth, real is what it costs.
        expect(textOf(tree, 'author-spend')).toBe('37 spent of 400');
    });

    it('offers a modifier list on a power and not on a skill', async () => {
        const {tree} = await renderScreen({
            initial: {
                ...emptyDraft('6E'),
                powers: [{xmlid: 'ENERGYBLAST', name: 'Bolt', input: '', adders: [], levels: 5, modifiers: []}],
                skills: [{xmlid: 'ACROBATICS', input: '', adders: [], characteristic: 'DEX', levels: 0}],
            },
        });

        expect(tree.root.findAllByProps({testID: 'author-add-modifier-powers-0'}).length).toBeGreaterThan(0);
        expect(tree.root.findAllByProps({testID: 'author-add-modifier-skills-0'})).toHaveLength(0);
    });

    it('draws the defence fields for Resistant Protection, and blocks a save without them', async () => {
        const {tree, saved} = await renderScreen({
            initial: {...emptyDraft('6E'), name: 'Bare', powers: [{xmlid: 'FORCEFIELD', name: 'Skin', input: '', adders: [], levels: 0, modifiers: []}]},
        });

        for (const field of ['pd', 'ed', 'mental', 'power']) {
            expect(tree.root.findAllByProps({testID: `author-defense-powers-0-${field}`}).length).toBeGreaterThan(0);
        }

        expect(textOf(tree, 'author-problem-error-0')).toContain('grants no defence');
        await press(tree, 'author-save');
        expect(saved).toHaveLength(0);
    });

    it('saves and re-opens a power with modifiers and defences intact', async () => {
        const full: AuthoredCharacter = {
            ...grenade,
            powers: [
                ...grenade.powers,
                {xmlid: 'FORCEFIELD', name: 'Dense Body', input: '', adders: [], levels: 0, modifiers: [], defense: {pd: 17, ed: 17, mental: 0, power: 0}},
            ],
        };
        const {tree, saved} = await renderScreen({initial: full});

        await press(tree, 'author-save');

        expect(saved).toHaveLength(1);
        expect(parseSource(JSON.parse(JSON.stringify(saved[0].source)))).toEqual(full);
        expect(saved[0].document).toEqual(build(full));
    });
});

describe('AuthorCharacterScreen — frameworks', () => {
    const gadgets: AuthoredCharacter = {
        ...emptyDraft('6E'),
        name: 'Gadgeteer',
        frameworks: [
            {
                kind: 'multipower',
                name: 'Utility Belt',
                reserve: 60,
                modifiers: [],
                slots: [
                    {xmlid: 'ENERGYBLAST', name: 'Stun Gun', input: 'ED', adders: [], levels: 12, modifiers: []},
                    {xmlid: 'ENERGYBLAST', name: 'Net', input: 'ED', adders: [], levels: 10, modifiers: []},
                ],
            },
        ],
    };

    it('totals the reserve and every slot', async () => {
        const {tree} = await renderScreen({initial: gadgets});

        // 60 reserve + 60/10 + 50/10 = 71.
        expect(textOf(tree, 'author-spend')).toBe('71 spent of 400');
    });

    it('edits a slot with the same row a standalone power uses', async () => {
        const {tree} = await renderScreen({initial: gadgets});

        // Slots are powers: they get a name, and a modifier list of their own.
        expect(tree.root.findAllByProps({testID: 'author-name-framework-0-slot-0'}).length).toBeGreaterThan(0);
        expect(tree.root.findAllByProps({testID: 'author-add-modifier-framework-0-slot-0'}).length).toBeGreaterThan(0);
    });

    it('says slots are fixed slots rather than silently making them so', async () => {
        const {tree} = await renderScreen();
        const add = tree.root.findAllByProps({testID: 'author-add-framework'}).find((node) => node.props.hint !== undefined);

        // The variable kind's divisor is unreachable in the engine (H13), so it is not offered.
        expect(add?.props.hint).toBe('Slots are fixed slots');
    });

    it('blocks a framework with no reserve', async () => {
        const {tree, saved} = await renderScreen({
            initial: {...emptyDraft('6E'), name: 'Broken', frameworks: [{kind: 'multipower', name: 'Empty', reserve: 0, modifiers: [], slots: []}]},
        });

        expect(textOf(tree, 'author-problem-error-0')).toContain('reserve of at least 1');
        await press(tree, 'author-save');
        expect(saved).toHaveLength(0);
    });

    it('saves and re-opens a framework with its slots nested', async () => {
        const {tree, saved} = await renderScreen({initial: gadgets});

        await press(tree, 'author-save');

        expect(saved).toHaveLength(1);
        expect(parseSource(JSON.parse(JSON.stringify(saved[0].source)))).toEqual(gadgets);

        // And the document the sheet will read has the slots inside the container, not beside it.
        const powers = (saved[0].document as Obj).powers as Obj[];
        expect(powers).toHaveLength(1);
        expect((powers[0].powers as Obj[]).map((slot) => slot.name)).toEqual(['Stun Gun', 'Net']);
    });
});

describe('AuthorCharacterScreen — martial arts and equipment', () => {
    it('offers a section for each, drawing on the right catalogue', async () => {
        const {tree} = await renderScreen();

        expect(tree.root.findAllByProps({testID: 'author-add-martialArts'}).length).toBeGreaterThan(0);
        // Equipment draws on the powers catalogue — an item is a power in a different bucket.
        expect(tree.root.findAllByProps({testID: 'author-add-equipment'}).length).toBeGreaterThan(0);
    });

    it('counts a maneuver and an item toward the same total', async () => {
        const {tree} = await renderScreen({
            initial: {
                ...emptyDraft('6E'),
                name: 'Fighter',
                martialArts: [{xmlid: 'BASIC_STRIKE', input: '', adders: [], levels: 0}],
                equipment: [{xmlid: 'FORCEFIELD', name: 'Vest', input: '', adders: [], levels: 0, modifiers: [], defense: {pd: 4, ed: 4, mental: 0, power: 0}}],
            },
        });

        // Basic Strike 3 + Vest 12.
        expect(textOf(tree, 'author-spend')).toBe('15 spent of 400');
    });

    it("warns that a defensive item will not add to the character's totals", async () => {
        const {tree} = await renderScreen({
            initial: {
                ...emptyDraft('6E'),
                name: 'Armoured',
                equipment: [{xmlid: 'FORCEFIELD', name: 'Vest', input: '', adders: [], levels: 0, modifiers: [], defense: {pd: 4, ed: 4, mental: 0, power: 0}}],
            },
        });

        const warnings = tree.root.findAllByProps({testID: 'author-problem-warning-0'});
        expect(warnings.length).toBeGreaterThan(0);
    });

    it('saves and re-opens both', async () => {
        const full: AuthoredCharacter = {
            ...emptyDraft('6E'),
            name: 'Complete',
            martialArts: [{xmlid: 'BASIC_STRIKE', input: '', adders: [], levels: 0}],
            equipment: [{xmlid: 'FORCEFIELD', name: 'Vest', input: '', adders: [], levels: 0, modifiers: [], defense: {pd: 4, ed: 4, mental: 0, power: 0}}],
        };
        const {tree, saved} = await renderScreen({initial: full});

        await press(tree, 'author-save');

        expect(saved).toHaveLength(1);
        expect(parseSource(JSON.parse(JSON.stringify(saved[0].source)))).toEqual(full);
        expect(saved[0].document).toEqual(build(full));
    });
});
