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
import {parseSource, build, declaredFor, emit, emptyDraft, type AuthoredCharacter} from 'core/authoring';
import type {Repositories} from 'infra/persistence/repositories';
import {AuthoringDraftProvider, type TraitAddress} from 'app/providers/AuthoringDraftProvider';
import {AuthoringProvider} from 'app/providers/AuthoringProvider';
import {RepositoriesProvider} from 'app/providers/RepositoriesProvider';
import {ThemeProvider} from 'app/theme';
import {AuthorCharacterScreen} from '../AuthorCharacterScreen';

type Obj = Record<string, any>;

const renderScreen = async (
    props: Partial<React.ComponentProps<typeof AuthorCharacterScreen>> = {},
    existing: string[] = [],
): Promise<{tree: ReactTestRenderer; saved: SaveCharacter[]; savedIds: string[]; edits: Array<{address: TraitAddress; category: string}>}> => {
    const saved: SaveCharacter[] = [];
    const savedIds: string[] = [];
    const edits: Array<{address: TraitAddress; category: string}> = [];
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
                        <AuthoringDraftProvider>
                            <AuthorCharacterScreen
                                onSaved={(id) => savedIds.push(id)}
                                onCancel={() => {}}
                                onEditTrait={(address, category) => edits.push({address, category})}
                                {...props}
                            />
                        </AuthoringDraftProvider>
                    </AuthoringProvider>
                </RepositoriesProvider>
            </ThemeProvider>,
        );
    });
    await act(async () => {});

    return {tree, saved, savedIds, edits};
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

/**
 * All the text rendered under a testID, however deeply.
 *
 * Walks the rendered instances rather than reading `props.children`, because a row's children are
 * `<Text>` elements rather than strings — flattening the props alone yields "[object Object]".
 */
const textOf = (tree: ReactTestRenderer, testID: string): string => {
    const collect = (node: unknown): string => {
        if (typeof node === 'string' || typeof node === 'number') {
            return String(node);
        }

        const children = (node as {children?: unknown[]} | null)?.children;

        return Array.isArray(children) ? children.map(collect).join('') : '';
    };

    const [node] = tree.root.findAllByProps({testID});

    return node === undefined ? '' : collect(node);
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

    it('calls what is spent past the allowance experience, not an overspend', async () => {
        const {tree} = await renderScreen();

        // 6E STR is 1/point over a base of 10, so STR 500 is 490 — 90 past a 400-point allowance.
        await type(tree, 'author-char-str', '500');

        expect(textOf(tree, 'author-remaining')).toBe('90 experience');
        // And it saves: a character who costs more than their starting points has earned the
        // difference, which is a fact about them rather than a fault.
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
        expect(saved[0].document).toEqual({...build(draft), basicConfiguration: declaredFor(draft.budget)});
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
        expect(saved[0].document).toEqual({...build(full), basicConfiguration: declaredFor(full.budget)});
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

    it('shows a power as one row with its cost, not a form', async () => {
        const {tree} = await renderScreen({initial: grenade});

        // The form is a screen of its own now — this list is a list.
        expect(textOf(tree, 'author-row-powers-0')).toContain('Grenade');
        expect(textOf(tree, 'author-row-powers-0')).toContain('37');
        expect(tree.root.findAllByProps({testID: 'author-add-modifier-powers-0'})).toHaveLength(0);
    });

    it('opens the trait form when a row is tapped', async () => {
        const {tree, edits} = await renderScreen({initial: grenade});

        await press(tree, 'author-row-powers-0');

        expect(edits).toEqual([{address: {kind: 'trait', key: 'powers', index: 0}, category: 'powers'}]);
    });

    it('blocks a save on a Resistant Protection with no defences', async () => {
        const {tree, saved} = await renderScreen({
            initial: {...emptyDraft('6E'), name: 'Bare', powers: [{xmlid: 'FORCEFIELD', name: 'Skin', input: '', adders: [], levels: 0, modifiers: []}]},
        });

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
        expect(saved[0].document).toEqual({...build(full), basicConfiguration: declaredFor(full.budget)});
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

    it('lists each slot as a row, and opens the trait form for it', async () => {
        const {tree, edits} = await renderScreen({initial: gadgets});

        expect(textOf(tree, 'author-row-framework-0-slot-0')).toContain('Stun Gun');
        // 60 active / 10 for a fixed slot.
        expect(textOf(tree, 'author-row-framework-0-slot-0')).toContain('6');

        await press(tree, 'author-row-framework-0-slot-1');
        expect(edits).toEqual([{address: {kind: 'slot', framework: 0, index: 1}, category: 'powers'}]);
    });

    it('marks a variable slot on its row, and charges it double', async () => {
        const mixed: AuthoredCharacter = {
            ...gadgets,
            frameworks: [{...gadgets.frameworks[0], slots: [gadgets.frameworks[0].slots[0], {...gadgets.frameworks[0].slots[1], variable: true}]}],
        };
        const {tree} = await renderScreen({initial: mixed});

        // A fixed slot is the default and says nothing; the variable one is called out, because
        // two rows of the same power at different costs is otherwise unreadable.
        expect(textOf(tree, 'author-row-framework-0-slot-0')).not.toContain('variable');
        expect(textOf(tree, 'author-row-framework-0-slot-1')).toContain('variable');

        // 60 reserve + 60/10 fixed + 50/5 variable = 76, against 71 with both fixed.
        expect(textOf(tree, 'author-spend')).toBe('76 spent of 400');
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
        expect(saved[0].document).toEqual({...build(full), basicConfiguration: declaredFor(full.budget)});
    });
});

describe('AuthorCharacterScreen — the campaign allowance', () => {
    /** A field's current value, which lives on the input rather than as rendered text. */
    const valueOf = (tree: ReactTestRenderer, testID: string): string =>
        tree.root.findAllByProps({testID}).find((node) => typeof node.props.onChangeText === 'function')?.props.value ?? '';

    const pick = async (tree: ReactTestRenderer, testID: string, option: string): Promise<void> => {
        await act(async () => {
            tree.root
                .findAllByProps({testID})
                .find((node) => typeof node.props.onPress === 'function')
                ?.props.onPress();
        });
        await act(async () => {
            tree.root
                .findAllByProps({testID: `${testID}-option-${option}`})
                .find((node) => typeof node.props.onPress === 'function')
                ?.props.onPress();
        });
        await act(async () => {});
    };

    it('starts a 6E character at Standard, and totals against it', async () => {
        const {tree} = await renderScreen({initial: {...emptyDraft('6E'), characteristics: {str: 20}}});

        expect(textOf(tree, 'author-spend')).toBe('10 spent of 400');
        expect(valueOf(tree, 'author-budget-base')).toBe('400');
        expect(valueOf(tree, 'author-budget-limit')).toBe('75');
    });

    it('changes the total when a different level is picked', async () => {
        const {tree} = await renderScreen({initial: {...emptyDraft('6E'), characteristics: {str: 20}}});

        await pick(tree, 'author-power-level', '6E Low-Powered');

        // 6E Low-Powered is a 300-point character. Nothing about the build changed, only what it
        // is allowed to cost.
        expect(textOf(tree, 'author-spend')).toBe('10 spent of 300');
    });

    it('accepts an allowance the rulebooks have no name for', async () => {
        const {tree} = await renderScreen({initial: emptyDraft('6E')});

        await type(tree, 'author-budget-base', '525');

        expect(textOf(tree, 'author-spend')).toBe('0 spent of 525');
    });

    it('labels the two editions in the units each is quoted in', async () => {
        const sixth = await renderScreen({initial: emptyDraft('6E')});
        const fifth = await renderScreen({initial: emptyDraft('5E')});

        // 6E quotes the whole allowance; 5E quotes a base that disadvantages then add to.
        const label = (tree: ReactTestRenderer): string =>
            tree.root.findAllByProps({testID: 'author-budget-base'}).find((node) => node.props.label !== undefined)?.props.label ?? '';

        expect(label(sixth.tree)).toBe('Total points');
        expect(label(fifth.tree)).toBe('Base points');
    });

    it('lets 5E disadvantages raise the total, and 6E complications not', async () => {
        const psych = [
            {
                xmlid: 'PSYCHOLOGICALLIMITATION',
                input: 'Code Of The Hero',
                adders: [
                    {xmlid: 'SITUATION', option: 'COMMON'},
                    {xmlid: 'INTENSITY', option: 'STRONG'},
                ],
            },
        ];
        const sixth = await renderScreen({initial: {...emptyDraft('6E'), complications: psych}});
        const fifth = await renderScreen({initial: {...emptyDraft('5E'), complications: psych}});

        // 6E: still 400. 5E: 200 base + the 15 the complication is worth.
        expect(textOf(sixth.tree, 'author-spend')).toBe('0 spent of 400');
        expect(textOf(fifth.tree, 'author-spend')).toBe('0 spent of 215');
    });

    it('declares the experience, so the nameplate reads "base + earned"', async () => {
        const {tree, saved} = await renderScreen({initial: {...emptyDraft('6E'), name: 'Veteran', characteristics: {str: 500}}});

        await press(tree, 'author-save');

        // `formatPoints` on the sheet turns exactly this into "400 + 90 pts".
        expect((saved[0].document as Obj).basicConfiguration).toEqual({basePoints: 400, disadPoints: 75, experience: 90});
    });

    it('declares no experience for a character inside its allowance', async () => {
        const {tree, saved} = await renderScreen({initial: {...emptyDraft('6E'), name: 'Fresh', characteristics: {str: 20}}});

        await press(tree, 'author-save');

        expect((saved[0].document as Obj).basicConfiguration).toEqual({basePoints: 400, disadPoints: 75, experience: 0});
    });

    it('saves the allowance so the character declares what it was built on', async () => {
        const {tree, saved} = await renderScreen({initial: {...emptyDraft('6E'), name: 'Declared', characteristics: {str: 20}}});

        await type(tree, 'author-budget-base', '350');
        await press(tree, 'author-save');

        // Without this the sheet's nameplate shows neither points nor campaign tier.
        expect((saved[0].document as Obj).basicConfiguration).toEqual({basePoints: 350, disadPoints: 75, experience: 0});
        expect((saved[0].source as Obj).budget).toEqual({base: 350, complicationLimit: 75});
    });

    it('re-opens at the allowance it was saved with', async () => {
        const custom: AuthoredCharacter = {...emptyDraft('6E'), name: 'Custom', budget: {base: 525, complicationLimit: 90}};
        const {tree, saved} = await renderScreen({initial: custom});

        await press(tree, 'author-save');

        expect(parseSource(JSON.parse(JSON.stringify(saved[0].source)))).toEqual(custom);
        expect(textOf(tree, 'author-spend')).toBe('0 spent of 525');
    });
});
