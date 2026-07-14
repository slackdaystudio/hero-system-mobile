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
import {DEFAULT_STATISTICS, type Statistics, type StatisticsRepository} from 'core/ports';
import type {Repositories} from 'infra/persistence/repositories';
import {RepositoriesProvider} from 'app/providers/RepositoriesProvider';
import {ThemeProvider} from 'app/theme';
import {StatisticsScreen} from '../StatisticsScreen';

const populated = (): Statistics => ({
    ...DEFAULT_STATISTICS,
    sum: 100,
    largestSum: 15,
    largestDieRoll: 8,
    totals: {
        ...DEFAULT_STATISTICS.totals,
        diceRolled: 30,
        skillChecks: 4,
        hitRolls: 3,
        effectRolls: 2,
        normalDamage: {rolls: 5, stun: 40, body: 12},
        killingDamage: {rolls: 1, stun: 10, body: 3},
        knockback: 7,
        hitLocations: {...DEFAULT_STATISTICS.totals.hitLocations, chest: 3, head: 1},
    },
    distributions: {one: 4, two: 5, three: 6, four: 5, five: 4, six: 6},
});

const fakeStatistics = (initial: Statistics) => {
    let stored = initial;
    let resetCalls = 0;
    const repo = {
        get: async () => stored,
        save: async (stats: Statistics) => {
            stored = stats;
        },
        reset: async () => {
            stored = DEFAULT_STATISTICS;
            resetCalls++;
        },
    } as StatisticsRepository;
    return {repo, resetCalls: () => resetCalls};
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

const render = async (repo: StatisticsRepository): Promise<ReactTestRenderer> => {
    const repositories = {statistics: repo} as unknown as Repositories;
    let tree!: ReactTestRenderer;
    await act(async () => {
        tree = TestRenderer.create(
            <ThemeProvider colorScheme="dark">
                <RepositoriesProvider repositories={repositories}>
                    <StatisticsScreen />
                </RepositoriesProvider>
            </ThemeProvider>,
        );
    });
    await act(async () => {}); // flush the get()
    return tree;
};

describe('StatisticsScreen', () => {
    it('renders the aggregate: overview, distribution percentages, roll counts, hit locations', async () => {
        const tree = await render(fakeStatistics(populated()).repo);
        const text = collectText(tree.toJSON());

        expect(text).toContain('30'); // dice rolled
        expect(text).toContain('6 · 20.0%'); // a face with 6 of 30 rolls
        expect(text).toContain('4'); // skill checks
        expect(text).toContain('40 / 12'); // normal STUN / BODY
        expect(text).toContain('7m'); // knockback
        expect(text).toContain('Chest'); // hit location label
    });

    it('shows an empty state when nothing has been rolled', async () => {
        const tree = await render(fakeStatistics(DEFAULT_STATISTICS).repo);

        expect(collectText(tree.toJSON())).toContain('No rolls yet');
    });

    it('resets the statistics and reloads to the empty state', async () => {
        const {repo, resetCalls} = fakeStatistics(populated());
        const tree = await render(repo);

        const reset = tree.root.findAllByProps({testID: 'reset'}).find((node) => typeof node.props.onPress === 'function');
        await act(async () => {
            reset?.props.onPress();
        });
        await act(async () => {});

        expect(resetCalls()).toBe(1);
        expect(collectText(tree.toJSON())).toContain('No rolls yet');
    });
});
