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
 * Editing a generated character.
 *
 * The gate is the point: an imported `.hdc` is the player's file and must stay read-only, whatever
 * its id looks like. The rest checks that a re-roll nags before replacing anything.
 */
import React from 'react';
import {Alert} from 'react-native';
import TestRenderer, {act, type ReactTestRenderer} from 'react-test-renderer';
import type {Character, CharacterRepository, Rng, SaveCharacter} from 'core/ports';
import {changeProfession, nameSkill, rollRecipe, type CharacterRecipe} from 'core/random';
import type {Repositories} from 'infra/persistence/repositories';
import {GenerateProvider} from 'app/providers/GenerateProvider';
import {RepositoriesProvider} from 'app/providers/RepositoriesProvider';
import {ThemeProvider} from 'app/theme';
import {CharacterEditor, editableRecipe} from '../CharacterEditor';

const seededRng = (seed: number): Rng => {
    let state = (seed * 2654435761) % 4294967296;

    return {
        next: (min: number, max: number): number => {
            state = (state * 1664525 + 1013904223) % 4294967296;

            return min + (Math.floor(state / 65536) % (max - min + 1));
        },
    };
};

const RECIPE = rollRecipe(seededRng(3));

const character = (over: Partial<Character> = {}): Character => ({
    id: 'generated-brick-1',
    name: RECIPE.name,
    player: null,
    edition: '5E',
    isActive: false,
    portraitUri: null,
    filename: 'generated-brick-1',
    updatedAt: '2026-01-01T00:00:00.000Z',
    document: {},
    origin: 'generated',
    recipe: RECIPE,
    ...over,
});

type AlertButton = {text?: string; style?: string; onPress?: () => void};

const alertSpy = () => jest.spyOn(Alert, 'alert').mockImplementation(() => undefined);

const renderEditor = async (
    over: Partial<Character> = {},
    recipe: CharacterRecipe = RECIPE,
): Promise<{tree: ReactTestRenderer; saved: SaveCharacter[]; revised: () => number}> => {
    const saved: SaveCharacter[] = [];
    let revised = 0;
    const characters = {
        save: async (input: SaveCharacter) => {
            saved.push(input);
        },
        list: async () => [],
    } as unknown as CharacterRepository;

    let tree!: ReactTestRenderer;
    await act(async () => {
        tree = TestRenderer.create(
            <ThemeProvider colorScheme="dark">
                <RepositoriesProvider repositories={{characters} as unknown as Repositories}>
                    <GenerateProvider rng={seededRng(1)}>
                        <CharacterEditor character={character(over)} recipe={recipe} onRevised={() => (revised += 1)} />
                    </GenerateProvider>
                </RepositoriesProvider>
            </ThemeProvider>,
        );
    });
    await act(async () => {});

    return {tree, saved, revised: () => revised};
};

const pick = async (tree: ReactTestRenderer, testID: string, option: string): Promise<void> => {
    await act(async () => {
        tree.root.findAllByProps({testID}).find((node) => typeof node.props.onPress === 'function')?.props.onPress();
    });
    await act(async () => {
        tree.root
            .findAllByProps({testID: `${testID}-option-${option}`})
            .find((node) => typeof node.props.onPress === 'function')
            ?.props.onPress();
    });
    await act(async () => {});
};

const pressAlert = async (spy: jest.SpyInstance, text: string): Promise<void> => {
    const buttons = spy.mock.calls[spy.mock.calls.length - 1][2] as AlertButton[];

    await act(async () => {
        buttons.find((button) => button.text === text)?.onPress?.();
    });
    await act(async () => {});
};

describe('editableRecipe — who may be edited', () => {
    it('lets a generated character be edited', () => {
        expect(editableRecipe(character())).toEqual(RECIPE);
    });

    it('never lets an imported character be edited, however its id reads', () => {
        // The whole reason `origin` exists: an import's id is its sanitised filename, so
        // `generated-brick-1.hdc` lands on an id the prefix would call generated. The column is
        // what actually decides, and a recipe on the row cannot override it.
        expect(editableRecipe(character({origin: 'imported'}))).toBeNull();
        expect(editableRecipe(character({origin: 'imported', id: 'generated-brick-1', recipe: RECIPE}))).toBeNull();
    });

    it('stops being editable when the recipe no longer resolves, rather than throwing', () => {
        // A recipe from an older build, naming an archetype that has since been dropped. The
        // character must still open — the sheet reads the document, not the recipe.
        expect(editableRecipe(character({recipe: {...RECIPE, archetype: 'Sorcerer Supreme'}}))).toBeNull();
        expect(editableRecipe(character({recipe: null}))).toBeNull();
        expect(editableRecipe(character({recipe: {nonsense: true}}))).toBeNull();
    });
});

describe('CharacterEditor', () => {
    afterEach(() => jest.restoreAllMocks());

    it('nags before re-rolling an archetype, and replaces nothing until confirmed', async () => {
        const spy = alertSpy();
        const {tree, saved} = await renderEditor();

        await pick(tree, 'edit-archetype', 'Speedster');

        expect(spy.mock.calls[0][0]).toBe(`Re-roll ${RECIPE.name} as Speedster?`);
        expect(spy.mock.calls[0][1]).toBe('Powers and characteristics will be replaced. Skills and complications stay.');
        expect(saved).toEqual([]); // picking alone changes nothing

        await pressAlert(spy, 'Cancel');
        expect(saved).toEqual([]);
    });

    it('re-rolls onto the new archetype once confirmed, keeping skills and complications', async () => {
        const spy = alertSpy();
        const {tree, saved, revised} = await renderEditor();

        await pick(tree, 'edit-archetype', 'Speedster');
        await pressAlert(spy, 'Re-roll');

        expect(saved).toHaveLength(1);
        const recipe = saved[0].recipe as unknown as CharacterRecipe;
        expect(recipe.archetype).toBe('Speedster');
        expect(recipe.profession).toBe(RECIPE.profession);
        expect(recipe.complications).toBe(RECIPE.complications);
        // Saved as a generated character still, so it stays editable after a re-roll.
        expect(saved[0].origin).toBe('generated');
        expect(revised()).toBe(1);
    });

    it('tells the truth about what a profession change replaces', async () => {
        const spy = alertSpy();
        const {tree, saved} = await renderEditor();

        await pick(tree, 'edit-profession', 'Soldier');

        // A profession swap touches skills only — the archetype nag's wording would be a lie here.
        expect(spy.mock.calls[0][1]).toBe('Skills will be replaced. Powers and characteristics stay.');

        await pressAlert(spy, 'Retrain');
        const recipe = saved[0].recipe as unknown as CharacterRecipe;
        expect(recipe.profession).toBe('Soldier');
        expect(recipe.powerset).toBe(RECIPE.powerset);
        expect(recipe.archetype).toBe(RECIPE.archetype);
    });

    it('keeps the player and portrait a rename does not describe', async () => {
        const {tree, saved} = await renderEditor({player: 'Phil'});

        await act(async () => {
            tree.root.findByProps({testID: 'edit-name'}).props.onChangeText('Ember');
        });
        await act(async () => {
            tree.root.findByProps({testID: 'edit-name'}).props.onBlur();
        });
        await act(async () => {});

        expect(saved[0].name).toBe('Ember');
        expect(saved[0].player).toBe('Phil');
        // Absent, not null: null would clear the portrait on every rename.
        expect('portrait' in saved[0]).toBe(false);
    });

    it('treats an empty name as a slip, not a rename', async () => {
        const {tree, saved} = await renderEditor();

        await act(async () => {
            tree.root.findByProps({testID: 'edit-name'}).props.onChangeText('   ');
        });
        await act(async () => {
            tree.root.findByProps({testID: 'edit-name'}).props.onBlur();
        });
        await act(async () => {});

        expect(saved).toEqual([]);
        expect(tree.root.findByProps({testID: 'edit-name'}).props.value).toBe(RECIPE.name);
    });

    it('surfaces a failed save instead of appearing to work', async () => {
        const spy = alertSpy();
        const characters = {
            save: async () => {
                throw new Error('disk is full of bricks');
            },
            list: async () => [],
        } as unknown as CharacterRepository;

        let tree!: ReactTestRenderer;
        await act(async () => {
            tree = TestRenderer.create(
                <ThemeProvider colorScheme="dark">
                    <RepositoriesProvider repositories={{characters} as unknown as Repositories}>
                        <GenerateProvider rng={seededRng(1)}>
                            <CharacterEditor character={character()} recipe={RECIPE} onRevised={() => undefined} />
                        </GenerateProvider>
                    </RepositoriesProvider>
                </ThemeProvider>,
            );
        });
        await act(async () => {});

        await pick(tree, 'edit-archetype', 'Speedster');
        await pressAlert(spy, 'Re-roll');

        expect(spy.mock.calls[spy.mock.calls.length - 1][0]).toBe('Could not save');
        expect(spy.mock.calls[spy.mock.calls.length - 1][1]).toBe('disk is full of bricks');
    });

    /**
     * The data leaves `Lang:` and `SS[INT]:` to the player on purpose — the legacy prose named no
     * language and no science, so there is nothing to generate.
     */
    describe('player-defined skills', () => {
        const SOLDIER = changeProfession(RECIPE, 'Soldier');
        const SCIENTIST = changeProfession(RECIPE, 'Scientist');

        /** The testID rides the wrapper, the TextField and the TextInput — take the one wired up. */
        const field = (tree: ReactTestRenderer, testID: string) =>
            tree.root.findAllByProps({testID}).find((node) => typeof node.props.onChangeText === 'function')!;

        const type = async (tree: ReactTestRenderer, testID: string, value: string): Promise<void> => {
            await act(async () => {
                field(tree, testID).props.onChangeText(value);
            });
            await act(async () => {
                field(tree, testID).props.onBlur();
            });
            await act(async () => {});
        };

        it('asks for the language a Soldier speaks, and saves the answer', async () => {
            const {tree, saved} = await renderEditor({}, SOLDIER);

            expect(field(tree, 'edit-skill-LANGUAGES#0').props.label).toBe('Language');

            await type(tree, 'edit-skill-LANGUAGES#0', 'French');

            expect((saved[0].recipe as unknown as CharacterRecipe).skills).toEqual({'LANGUAGES#0': 'French'});
        });

        it('numbers the Scientist\'s three sciences so they can be told apart', async () => {
            const {tree, saved} = await renderEditor({}, SCIENTIST);

            expect(field(tree, 'edit-skill-SCIENCE_SKILL#0').props.label).toBe('Science Skill 1');
            expect(field(tree, 'edit-skill-SCIENCE_SKILL#2').props.label).toBe('Science Skill 3');

            await type(tree, 'edit-skill-SCIENCE_SKILL#1', 'Xenobiology');

            expect((saved[0].recipe as unknown as CharacterRecipe).skills).toEqual({'SCIENCE_SKILL#1': 'Xenobiology'});
        });

        it('does not ask a profession that leaves nothing to the player', async () => {
            const {tree} = await renderEditor({}, changeProfession(RECIPE, 'Warrior'));

            expect(tree.root.findAllByProps({testID: 'edit-skill-LANGUAGES#0'})).toEqual([]);
        });

        it('shows an answer already given, and saves nothing when it is unchanged', async () => {
            const named = nameSkill(SOLDIER, 'LANGUAGES#0', 'French');
            const {tree, saved} = await renderEditor({}, named);

            expect(field(tree, 'edit-skill-LANGUAGES#0').props.value).toBe('French');

            await type(tree, 'edit-skill-LANGUAGES#0', 'French');
            expect(saved).toEqual([]); // a blur that changed nothing must not rebuild the character
        });

        it('clears an answer back to Player Defined', async () => {
            const {tree, saved} = await renderEditor({}, nameSkill(SOLDIER, 'LANGUAGES#0', 'French'));

            await type(tree, 'edit-skill-LANGUAGES#0', '');

            expect((saved[0].recipe as unknown as CharacterRecipe).skills).toEqual({});
        });
    });
});
