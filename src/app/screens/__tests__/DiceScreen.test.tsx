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
import {DieRoller} from 'core/dice';
import {DEFAULT_STATISTICS, type Rng, type Statistics, type StatisticsRepository} from 'core/ports';
import type {Repositories} from 'infra/persistence/repositories';
import {DiceProvider} from 'app/providers/DiceProvider';
import {RepositoriesProvider} from 'app/providers/RepositoriesProvider';
import {ThemeProvider} from 'app/theme';
import {DiceScreen} from '../DiceScreen';

// A generator that returns the scripted faces in order (wrapping), ignoring the
// requested range — so rolls are fully deterministic.
const scriptedRng = (faces: number[]): Rng => {
    let index = 0;
    return {next: () => faces[index++ % faces.length]};
};

const fakeStatistics = () => {
    let stored: Statistics = DEFAULT_STATISTICS;
    const repo = {
        get: async () => stored,
        save: async (stats: Statistics) => {
            stored = stats;
        },
        reset: async () => {
            stored = DEFAULT_STATISTICS;
        },
    } as StatisticsRepository;
    return {repo, current: () => stored};
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

const render = (faces: number[], statistics: StatisticsRepository, initialMode?: 'skill' | 'hit' | 'normal' | 'killing' | 'effect'): ReactTestRenderer => {
    const repositories = {statistics} as unknown as Repositories;
    let tree!: ReactTestRenderer;
    act(() => {
        tree = TestRenderer.create(
            <ThemeProvider colorScheme="dark">
                <RepositoriesProvider repositories={repositories}>
                    <DiceProvider dieRoller={new DieRoller(scriptedRng(faces))}>
                        <DiceScreen initialMode={initialMode} />
                    </DiceProvider>
                </RepositoriesProvider>
            </ThemeProvider>,
        );
    });
    return tree;
};

const press = async (tree: ReactTestRenderer, testID: string): Promise<void> => {
    const target = tree.root.findAllByProps({testID}).find((node) => typeof node.props.onPress === 'function');
    await act(async () => {
        target?.props.onPress();
    });
    await act(async () => {}); // flush the async statistics record
};

describe('DiceScreen', () => {
    it('rolls a skill check and records the roll in statistics', async () => {
        const {repo, current} = fakeStatistics();
        const tree = render([3], repo); // every d6 comes up 3 -> 3d6 = 9

        await press(tree, 'roll');

        const text = collectText(tree.toJSON());
        expect(text).toContain('9'); // rolled total
        expect(text).toContain('Made by');
        expect(text).toContain('2'); // threshold 11 - 9
        expect(text).toContain('Dice rolled all-time: 3');

        expect(current().totals.skillChecks).toBe(1);
        expect(current().totals.diceRolled).toBe(3);
    });

    it('determines a hit from OCV vs DCV', async () => {
        const {repo} = fakeStatistics();
        const tree = render([3], repo); // roll 9; hitCv = 11 + 8 - 9 = 10 >= DCV 5 -> HIT

        await press(tree, 'segment-hit');
        await press(tree, 'roll');

        const text = collectText(tree.toJSON());
        expect(text).toContain('10'); // hits DCV up to
        expect(text).toContain('HIT');
        expect(text).not.toContain('MISS');
    });

    it('rolls an effect after switching mode and tallies it separately', async () => {
        const {repo, current} = fakeStatistics();
        const tree = render([2], repo); // 6d6 of 2s -> 12

        await press(tree, 'segment-effect');
        await press(tree, 'roll');

        expect(collectText(tree.toJSON())).toContain('12');
        expect(current().totals.effectRolls).toBe(1);
    });

    it('adds a half die to an effect roll when the partial-die control is set', async () => {
        const {repo} = fakeStatistics();
        const tree = render([2], repo); // every die (d6 and the d3 half) comes up 2

        await press(tree, 'segment-effect');
        await press(tree, 'segment-half'); // +½d6
        await press(tree, 'roll');

        // 6d6 of 2s (=12) plus the half die (a 2) = 14
        expect(collectText(tree.toJSON())).toContain('14');
    });

    it('starts in the mode supplied by a Home quick-launch', async () => {
        const {repo, current} = fakeStatistics();
        const tree = render([2], repo, 'effect'); // 6d6 of 2s -> 12

        await press(tree, 'roll'); // no mode switch needed — it opened in effect
        expect(collectText(tree.toJSON())).toContain('12');
        expect(current().totals.effectRolls).toBe(1);
    });

    it('only shows the partial-die control for damage/effect modes', async () => {
        const {repo} = fakeStatistics();
        const tree = render([3], repo);

        const hasPartial = () => tree.root.findAllByProps({testID: 'segment-half'}).length > 0;
        expect(hasPartial()).toBe(false); // skill mode: no partial die

        await press(tree, 'segment-killing');
        expect(hasPartial()).toBe(true);

        await press(tree, 'segment-hit');
        expect(hasPartial()).toBe(false);
    });

    it('enables Roll Again only after a first roll, and it re-rolls', async () => {
        const {repo, current} = fakeStatistics();
        const tree = render([4], repo);

        const rollAgain = () => tree.root.findAllByProps({testID: 'roll-again'}).find((node) => typeof node.props.disabled === 'boolean');
        expect(rollAgain()?.props.disabled).toBe(true);

        await press(tree, 'roll');
        expect(rollAgain()?.props.disabled).toBe(false);

        await press(tree, 'roll-again');
        expect(current().totals.skillChecks).toBe(2); // two skill checks recorded
    });
});
