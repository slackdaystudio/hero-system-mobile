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
 * The roll dialog.
 *
 * Three things here are worth more than the rest: **nothing is written until the player picks one**,
 * **the pills reach the domain** (for the whole life of the app every roll was silently 5E), and
 * **the card the player tapped is the character they get** — with five on screen, an off-by-one
 * would hand someone the wrong hero and look entirely plausible doing it.
 *
 * The 3s hold is driven with fake timers, so these tests take no wall-clock time.
 */
import React from 'react';
import TestRenderer, {act, type ReactTestRenderer} from 'react-test-renderer';
import type {Rng, SaveCharacter, Settings, SettingsRepository} from 'core/ports';
import {DEFAULT_SETTINGS} from 'core/ports';
import {heroDesignerCharacter} from 'core/hero';
import {HAND_SIZE} from 'core/random';
import type {Repositories} from 'infra/persistence/repositories';
import {GenerateProvider, type GenerateResult} from 'app/providers/GenerateProvider';
import {RepositoriesProvider} from 'app/providers/RepositoriesProvider';
import {SettingsProvider} from 'app/providers/SettingsProvider';
import {ThemeProvider} from 'app/theme';
import {GenerateDialog, ROLL_DURATION_MS} from '../GenerateDialog';

const seededRng = (seed: number): Rng => {
    let state = (seed * 2654435761) % 4294967296;

    return {
        next: (min: number, max: number): number => {
            state = (state * 1664525 + 1013904223) % 4294967296;

            return min + (Math.floor(state / 65536) % (max - min + 1));
        },
    };
};

interface Harness {
    tree: ReactTestRenderer;
    saved: SaveCharacter[];
    generated: () => GenerateResult[];
    closed: () => number;
}

const render = async (over: Partial<Settings> = {}): Promise<Harness> => {
    const saved: SaveCharacter[] = [];
    const generated: GenerateResult[] = [];
    let closed = 0;

    const repositories = {
        characters: {
            list: async () => saved.map((character) => ({id: character.id})),
            save: async (character: SaveCharacter) => {
                saved.push(character);
            },
        },
        settings: {get: async () => ({...DEFAULT_SETTINGS, ...over})} as unknown as SettingsRepository,
    } as unknown as Repositories;

    let tree!: ReactTestRenderer;
    await act(async () => {
        tree = TestRenderer.create(
            <ThemeProvider colorScheme="dark">
                <RepositoriesProvider repositories={repositories}>
                    <SettingsProvider initialSettings={{...DEFAULT_SETTINGS, ...over}}>
                        <GenerateProvider rng={seededRng(3)}>
                            <GenerateDialog visible onGenerated={(result) => generated.push(result)} onClose={() => (closed += 1)} />
                        </GenerateProvider>
                    </SettingsProvider>
                </RepositoriesProvider>
            </ThemeProvider>,
        );
    });
    await act(async () => {}); // flush the settings load

    return {tree, saved, generated: () => generated, closed: () => closed};
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

const label = (tree: ReactTestRenderer, testID: string): string | null => {
    const found = tree.root.findAllByProps({testID}).find((node) => node.props.children !== undefined);

    return found === undefined ? null : String(found.props.children);
};

const exists = (tree: ReactTestRenderer, testID: string): boolean => tree.root.findAllByProps({testID}).length > 0;

const buttonProps = (tree: ReactTestRenderer, testID: string): {label?: string; disabled?: boolean} =>
    tree.root.findAllByProps({testID}).find((node) => typeof node.props.label === 'string')?.props ?? {};

/** How many cards are on screen. */
const handSize = (tree: ReactTestRenderer): number =>
    Array.from({length: 12}, (_, index) => index).filter((index) => exists(tree, `candidate-${index}`)).length;

/** Deal, and run out the mandatory hold. */
const dealAndReveal = async (tree: ReactTestRenderer): Promise<void> => {
    await press(tree, 'generate-confirm');
    await act(async () => {
        jest.advanceTimersByTime(ROLL_DURATION_MS);
    });
    await act(async () => {});
};

describe('GenerateDialog', () => {
    beforeEach(() => jest.useFakeTimers());
    afterEach(() => jest.useRealTimers());

    describe('choosing', () => {
        it('opens on the edition the player already told us they use', async () => {
            const fifth = await render({useFifthEdition: true});
            expect(label(fifth.tree, 'generate-level')).toContain('250');

            const sixth = await render({useFifthEdition: false});
            expect(label(sixth.tree, 'generate-level')).toContain('400');
        });

        it('offers exactly the two levels that have data', async () => {
            const {tree} = await render();

            // 5e-standard and 6e-low exist in POWER_LEVELS with no archetypes or powersets authored;
            // offering them would be offering a crash.
            expect(exists(tree, 'segment-5e-low')).toBe(true);
            expect(exists(tree, 'segment-6e-standard')).toBe(true);
            expect(exists(tree, 'segment-5e-standard')).toBe(false);
            expect(exists(tree, 'segment-6e-low')).toBe(false);
        });

        it('cancels without dealing anything', async () => {
            const {tree, saved, closed} = await render();

            await press(tree, 'generate-cancel');

            expect(closed()).toBe(1);
            expect(saved).toEqual([]);
        });
    });

    describe('the mandatory hold', () => {
        it('shows the bar and withholds the hand until the 3s is up', async () => {
            const {tree} = await render();

            await press(tree, 'generate-confirm');

            expect(exists(tree, 'generate-progress')).toBe(true);
            expect(handSize(tree)).toBe(0);

            await act(async () => {
                jest.advanceTimersByTime(ROLL_DURATION_MS);
            });

            expect(handSize(tree)).toBe(HAND_SIZE);
            expect(exists(tree, 'generate-progress')).toBe(false);
        });

        /** Nothing to pick yet, so there is no second button to press. */
        it('offers only Cancel while dealing', async () => {
            const {tree} = await render();

            await press(tree, 'generate-confirm');

            expect(exists(tree, 'generate-confirm')).toBe(false);
            expect(buttonProps(tree, 'generate-cancel').label).toBe('Cancel');
        });

        /**
         * The hold is mostly drama — dealing is real work now, but the bar still runs out a floor
         * rather than reporting progress. Someone who turned animations off is not asking for a
         * slower reveal.
         */
        it('skips the hold entirely when animations are off', async () => {
            const {tree} = await render({showAnimations: false});

            await press(tree, 'generate-confirm');

            expect(handSize(tree)).toBe(HAND_SIZE);
            expect(exists(tree, 'generate-progress')).toBe(false);
        });

        it('does not deal into a closed dialog', async () => {
            const {tree} = await render();

            await press(tree, 'generate-confirm');
            await press(tree, 'generate-cancel');

            // The timeout outlives the close; firing it must not resurrect the hand.
            await act(async () => {
                jest.advanceTimersByTime(ROLL_DURATION_MS);
            });

            expect(handSize(tree)).toBe(0);
        });
    });

    describe('the hand', () => {
        it('deals five to choose between', async () => {
            const {tree} = await render();

            await dealAndReveal(tree);

            expect(handSize(tree)).toBe(HAND_SIZE);
        });

        /**
         * One powerset per archetype, so two cards sharing an archetype would share their powers —
         * a wasted slot. Dealt uniformly it would happen to about two hands in three.
         */
        it('never deals the same archetype twice', async () => {
            const {tree, saved} = await render();

            await dealAndReveal(tree);

            const names = Array.from({length: HAND_SIZE}, (_, index) => label(tree, `candidate-${index}-name`));

            expect(new Set(names).size).toBe(HAND_SIZE);
            expect(saved).toEqual([]);
        });

        it('names each card as a sentence, capitalised', async () => {
            const {tree} = await render();

            await dealAndReveal(tree);

            for (let index = 0; index < HAND_SIZE; index++) {
                const name = label(tree, `candidate-${index}-name`)!;

                expect(name).toMatch(/^An? .+$/);
                expect(name).not.toContain('/'); // Playboy/Socialite reads "Socialite"
                expect(name).not.toContain('Other'); // the unthemed roll prints no effect word
            }
        });

        it('shows what each card spends and what it does', async () => {
            const {tree} = await render({useFifthEdition: false});

            await dealAndReveal(tree);

            expect(label(tree, 'candidate-0-set')).toContain('400 of 400 points');
            // The stat line is the reason a hand is worth dealing — "a Fire Brick Soldier" alone
            // doesn't tell a new player what they'd be signing up for.
            expect(label(tree, 'candidate-0-stats')).toMatch(/^\d+d6 · SPD \d+ · OCV \d+ \/ DCV \d+ · DEF \d+$/);
        });

        it('swaps the footer to Roll Again / View', async () => {
            const {tree} = await render();

            await dealAndReveal(tree);

            expect(buttonProps(tree, 'generate-cancel').label).toBe('Roll Again');
            expect(buttonProps(tree, 'generate-confirm').label).toBe('View');
        });

        it('deals a fresh hand on Roll Again', async () => {
            const {tree, saved} = await render();

            await dealAndReveal(tree);
            const first = label(tree, 'candidate-0-name');

            await press(tree, 'generate-cancel');
            await act(async () => {
                jest.advanceTimersByTime(ROLL_DURATION_MS);
            });

            expect(label(tree, 'candidate-0-name')).not.toBe(first);
            expect(saved).toEqual([]);
        });
    });

    describe('picking one', () => {
        it('cannot View until a card is chosen', async () => {
            const {tree} = await render();

            await dealAndReveal(tree);
            expect(buttonProps(tree, 'generate-confirm').disabled).toBe(true);

            await press(tree, 'candidate-2');
            expect(buttonProps(tree, 'generate-confirm').disabled).toBe(false);
        });

        it('does nothing but select when a card is tapped', async () => {
            const {tree, saved, generated} = await render();

            await dealAndReveal(tree);
            await press(tree, 'candidate-2');

            // Tapping is choosing, not confirming — the whole point is to be able to change your mind.
            expect(saved).toEqual([]);
            expect(generated()).toEqual([]);
        });

        it('lets the player change their mind before committing', async () => {
            const {tree, saved} = await render();

            await dealAndReveal(tree);
            await press(tree, 'candidate-1');
            await press(tree, 'candidate-3');
            await press(tree, 'candidate-0');

            expect(saved).toEqual([]);
        });

        /**
         * The off-by-one that would look entirely plausible: five cards on screen, and the one that
         * gets saved has to be the one under the finger.
         */
        it.each([0, 1, 2, 3, 4])('saves the card at index %i — the one the player actually tapped', async (index) => {
            const {tree, saved, generated} = await render();

            await dealAndReveal(tree);
            const chosen = label(tree, `candidate-${index}-name`)!;

            await press(tree, `candidate-${index}`);
            await press(tree, 'generate-confirm');

            expect(saved).toHaveLength(1);
            expect(generated()).toHaveLength(1);
            expect(generated()[0].id).toBe(saved[0].id);
            // The card's sentence names the archetype of the character that got written.
            expect(chosen).toContain((saved[0].recipe as {archetype: string}).archetype);
        });

        it('saves nothing when the hand is dismissed', async () => {
            const {tree, saved, closed} = await render();

            await dealAndReveal(tree);
            await press(tree, 'candidate-2'); // even after choosing
            await press(tree, 'generate-backdrop');

            expect(closed()).toBe(1);
            expect(saved).toEqual([]);
        });

        it('saves nothing however many hands the player rolls through', async () => {
            const {tree, saved} = await render();

            await dealAndReveal(tree);

            for (let attempt = 0; attempt < 4; attempt++) {
                await press(tree, 'candidate-1'); // pick one up, put it back
                await press(tree, 'generate-cancel'); // Roll Again
                await act(async () => {
                    jest.advanceTimersByTime(ROLL_DURATION_MS);
                });

                expect(saved).toEqual([]);
            }

            // Five hands of five: twenty-five characters built, none written.
            expect(handSize(tree)).toBe(HAND_SIZE);
            expect(saved).toEqual([]);
        });

        it('forgets the selection when a fresh hand is dealt', async () => {
            const {tree} = await render();

            await dealAndReveal(tree);
            await press(tree, 'candidate-2');

            await press(tree, 'generate-cancel');
            await act(async () => {
                jest.advanceTimersByTime(ROLL_DURATION_MS);
            });

            // Otherwise View would keep card 2 of a hand the player has never looked at.
            expect(buttonProps(tree, 'generate-confirm').disabled).toBe(true);
        });
    });

    /**
     * **The pills have to reach the domain.**
     *
     * `dealHand(rng, level = LOW_POWERED_5E)` defaults, and every call the app made was bare — so
     * every character it ever rolled was 5E Low Powered while the whole 6E dataset sat authored and
     * unreachable. A pill that only changes a label would reproduce that exactly.
     */
    describe('the pills reach the domain', () => {
        const keepFirst = async (tree: ReactTestRenderer): Promise<void> => {
            await dealAndReveal(tree);
            await press(tree, 'candidate-0');
            await press(tree, 'generate-confirm');
        };

        it('deals real 400-point 6E characters on the 6E pill', async () => {
            const {tree, saved} = await render({useFifthEdition: true}); // opens on 5E

            await press(tree, 'segment-6e-standard');
            await keepFirst(tree);

            expect(saved[0].edition).toBe('6E');
            expect(heroDesignerCharacter.isFifth(saved[0].document as unknown as Record<string, any>)).toBe(false);
            expect((saved[0].recipe as {level: string}).level).toBe('6e-standard');
        });

        it('deals real 250-point 5E characters on the 5E pill', async () => {
            const {tree, saved} = await render({useFifthEdition: false}); // opens on 6E

            await press(tree, 'segment-5e-low');
            await keepFirst(tree);

            expect(saved[0].edition).toBe('5E');
            expect(heroDesignerCharacter.isFifth(saved[0].document as unknown as Record<string, any>)).toBe(true);
            expect((saved[0].recipe as {level: string}).level).toBe('5e-low');
        });

        it('throws away a hand when the edition changes under it', async () => {
            const {tree} = await render({useFifthEdition: true});

            await dealAndReveal(tree);
            expect(handSize(tree)).toBe(HAND_SIZE);

            // A different edition is a different set of characters; keeping the old hand on screen
            // would let the player take one from the edition they just moved away from.
            await press(tree, 'segment-6e-standard');

            expect(handSize(tree)).toBe(0);
            expect(label(tree, 'generate-level')).toContain('400');
        });
    });
});
