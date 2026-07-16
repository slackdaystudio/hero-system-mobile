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
 * Two things here are worth more than the rest: **nothing is written until the player says View**,
 * and **the pills reach the domain** — a 6E pill has to produce a 400-point 6E character, because
 * for the whole life of the app every roll was silently 5E.
 *
 * The 3s hold is driven with fake timers, so these tests take no wall-clock time.
 */
import React from 'react';
import TestRenderer, {act, type ReactTestRenderer} from 'react-test-renderer';
import type {Rng, SaveCharacter, Settings, SettingsRepository} from 'core/ports';
import {DEFAULT_SETTINGS} from 'core/ports';
import {heroDesignerCharacter} from 'core/hero';
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

/** Button labels, which are how the footer says which state it is in. */
const buttonLabel = (tree: ReactTestRenderer, testID: string): string | undefined =>
    tree.root.findAllByProps({testID}).find((node) => typeof node.props.label === 'string')?.props.label;

/** Roll, and run out the mandatory hold. */
const rollAndReveal = async (tree: ReactTestRenderer): Promise<void> => {
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

        it('names the level it will roll, so the pill is not the only clue', async () => {
            const {tree} = await render({useFifthEdition: true});

            expect(label(tree, 'generate-level')).toBe('5E Low Powered Superheroic · 250 points');
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

        it('cancels without rolling anything', async () => {
            const {tree, saved, closed} = await render();

            await press(tree, 'generate-cancel');

            expect(closed()).toBe(1);
            expect(saved).toEqual([]);
        });
    });

    describe('the mandatory hold', () => {
        it('shows the bar and withholds the reveal until the 3s is up', async () => {
            const {tree} = await render();

            await press(tree, 'generate-confirm');

            expect(exists(tree, 'generate-progress')).toBe(true);
            expect(exists(tree, 'generate-reveal')).toBe(false);

            // One millisecond short: still rolling.
            await act(async () => {
                jest.advanceTimersByTime(ROLL_DURATION_MS - 1);
            });
            expect(exists(tree, 'generate-reveal')).toBe(false);

            await act(async () => {
                jest.advanceTimersByTime(1);
            });
            expect(exists(tree, 'generate-reveal')).toBe(true);
            expect(exists(tree, 'generate-progress')).toBe(false);
        });

        /** Nothing to accept yet, so there is no second button to press. */
        it('offers only Cancel while rolling', async () => {
            const {tree} = await render();

            await press(tree, 'generate-confirm');

            expect(exists(tree, 'generate-confirm')).toBe(false);
            expect(buttonLabel(tree, 'generate-cancel')).toBe('Cancel');
        });

        /**
         * The hold is drama, not work — the character exists before the bar moves. Someone who
         * turned animations off is not asking for a slower reveal, so they get the reveal.
         */
        it('skips the hold entirely when animations are off', async () => {
            const {tree} = await render({showAnimations: false});

            await press(tree, 'generate-confirm');

            expect(exists(tree, 'generate-reveal')).toBe(true);
            expect(exists(tree, 'generate-progress')).toBe(false);
        });

        it('does not reveal into a closed dialog', async () => {
            const {tree} = await render();

            await press(tree, 'generate-confirm');
            await press(tree, 'generate-cancel');

            // The timeout outlives the close; firing it must not resurrect the reveal.
            await act(async () => {
                jest.advanceTimersByTime(ROLL_DURATION_MS);
            });

            expect(exists(tree, 'generate-reveal')).toBe(false);
        });
    });

    describe('the reveal', () => {
        it('reads the roll back as a sentence', async () => {
            const {tree} = await render();

            await rollAndReveal(tree);

            expect(label(tree, 'generate-reveal')).toMatch(/^You are an? .+\.$/);
            expect(label(tree, 'generate-reveal')).not.toContain('/');
            expect(label(tree, 'generate-reveal')).not.toContain('Other');
        });

        it('says what it spent', async () => {
            const {tree} = await render({useFifthEdition: false});

            await rollAndReveal(tree);

            expect(label(tree, 'generate-points')).toContain('400 of 400 points');
        });

        it('swaps the footer to Roll Again / View', async () => {
            const {tree} = await render();

            await rollAndReveal(tree);

            expect(buttonLabel(tree, 'generate-cancel')).toBe('Roll Again');
            expect(buttonLabel(tree, 'generate-confirm')).toBe('View');
        });
    });

    /**
     * The reason `roll` and `keep` are separate actions. Rolling used to save before the player had
     * read a word of the result, and "Roll Again" would have turned one stray character into a pile.
     */
    describe('nothing is saved until View', () => {
        it('saves nothing on a reveal the player has not accepted', async () => {
            const {tree, saved} = await render();

            await rollAndReveal(tree);

            expect(exists(tree, 'generate-reveal')).toBe(true);
            expect(saved).toEqual([]);
        });

        it('saves nothing when the player rolls again, however many times', async () => {
            const {tree, saved} = await render();

            await rollAndReveal(tree);

            // "Roll Again" is the cancel slot re-labelled — the confirm slot is View by now, and
            // pressing that is precisely the one thing that *should* save.
            for (let attempt = 0; attempt < 4; attempt++) {
                expect(buttonLabel(tree, 'generate-cancel')).toBe('Roll Again');

                await press(tree, 'generate-cancel');
                await act(async () => {
                    jest.advanceTimersByTime(ROLL_DURATION_MS);
                });

                expect(saved).toEqual([]);
            }

            expect(exists(tree, 'generate-reveal')).toBe(true);
            expect(saved).toEqual([]);
        });

        it('saves nothing when the dialog is dismissed at the reveal', async () => {
            const {tree, saved, closed} = await render();

            await rollAndReveal(tree);
            await press(tree, 'generate-backdrop');

            expect(closed()).toBe(1);
            expect(saved).toEqual([]);
        });

        it('saves exactly the revealed character on View, and reports it', async () => {
            const {tree, saved, generated} = await render();

            await rollAndReveal(tree);
            const revealed = label(tree, 'generate-reveal');

            await press(tree, 'generate-confirm');

            expect(saved).toHaveLength(1);
            expect(generated()).toHaveLength(1);
            expect(generated()[0].id).toBe(saved[0].id);
            // The sentence names what was saved: same archetype, same profession, same effect.
            expect(revealed).toContain((saved[0].recipe as {archetype: string}).archetype);
        });

        it('keeps the one the player accepted, not the one before it', async () => {
            const {tree, saved} = await render();

            await rollAndReveal(tree);
            await press(tree, 'generate-cancel'); // Roll Again
            await act(async () => {
                jest.advanceTimersByTime(ROLL_DURATION_MS);
            });

            const second = label(tree, 'generate-reveal');
            await press(tree, 'generate-confirm');

            expect(saved).toHaveLength(1);
            expect(second).toContain((saved[0].recipe as {archetype: string}).archetype);
        });
    });

    /**
     * **The pills have to reach the domain.**
     *
     * `generateRandomCharacter(rng, level = LOW_POWERED_5E)` defaults, and every call the app made
     * was bare — so every character it ever rolled was 5E Low Powered while the whole 6E dataset sat
     * authored and unreachable. A pill that only changes a label would reproduce that exactly.
     */
    describe('the pills reach the domain', () => {
        const pickEdition = async (tree: ReactTestRenderer, levelId: string): Promise<void> => press(tree, `segment-${levelId}`);

        it('rolls a real 400-point 6E character on the 6E pill', async () => {
            const {tree, saved} = await render({useFifthEdition: true}); // opens on 5E

            await pickEdition(tree, '6e-standard');
            await rollAndReveal(tree);
            await press(tree, 'generate-confirm');

            expect(saved[0].edition).toBe('6E');
            expect(heroDesignerCharacter.isFifth(saved[0].document as unknown as Record<string, any>)).toBe(false);
            expect((saved[0].recipe as {level: string}).level).toBe('6e-standard');
        });

        it('rolls a real 250-point 5E character on the 5E pill', async () => {
            const {tree, saved} = await render({useFifthEdition: false}); // opens on 6E

            await pickEdition(tree, '5e-low');
            await rollAndReveal(tree);
            await press(tree, 'generate-confirm');

            expect(saved[0].edition).toBe('5E');
            expect(heroDesignerCharacter.isFifth(saved[0].document as unknown as Record<string, any>)).toBe(true);
            expect((saved[0].recipe as {level: string}).level).toBe('5e-low');
        });

        it('throws away a reveal when the edition changes under it', async () => {
            const {tree} = await render({useFifthEdition: true});

            await rollAndReveal(tree);
            expect(exists(tree, 'generate-reveal')).toBe(true);

            // A different edition is a different character; keeping the old reveal on screen would
            // let the player tap View and get one from the edition they just moved away from.
            await pickEdition(tree, '6e-standard');

            expect(exists(tree, 'generate-reveal')).toBe(false);
            expect(label(tree, 'generate-level')).toContain('400');
        });
    });
});
