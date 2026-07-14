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
import {combatMaximums, type CombatState} from 'core/combat';
import {heroDesignerCharacter, type ParsedCharacter} from 'core/hero';
import type {CombatStateRepository} from 'core/ports';
import type {Obj} from 'core/traits';
import type {Repositories} from 'infra/persistence/repositories';
import {RepositoriesProvider} from 'app/providers/RepositoriesProvider';
import {ThemeProvider} from 'app/theme';
import sample from '../../composition/sampleCharacter.json';
import {buildCombatSheet} from '../characterSheet';
import {CombatTracker} from '../CombatTracker';

const hero = (): Obj => heroDesignerCharacter.getCharacter(sample as unknown as ParsedCharacter) as unknown as Obj;

const collectText = (node: unknown): string[] => {
    if (node === null || node === undefined) {
        return [];
    }
    if (typeof node === 'string' || typeof node === 'number') {
        return [String(node)];
    }
    if (Array.isArray(node)) {
        return node.flatMap(collectText);
    }
    return collectText((node as {children?: unknown}).children);
};

const fakeRepo = () => {
    let saved: CombatState | null = null;
    const repo: CombatStateRepository = {
        get: async () => saved,
        save: async (_id, state) => {
            saved = state;
        },
        clear: async () => {
            saved = null;
        },
    };
    return {repo, current: () => saved};
};

const render = async (character: Obj, repo: CombatStateRepository): Promise<ReactTestRenderer> => {
    const repositories = {combatState: repo} as unknown as Repositories;
    let tree!: ReactTestRenderer;
    await act(async () => {
        tree = TestRenderer.create(
            <ThemeProvider colorScheme="dark">
                <RepositoriesProvider repositories={repositories}>
                    <CombatTracker character={character} characterId="c1" combat={buildCombatSheet(character)} onRoll={() => undefined} />
                </RepositoriesProvider>
            </ThemeProvider>,
        );
    });
    await act(async () => {}); // flush the async state load
    return tree;
};

const press = async (tree: ReactTestRenderer, testID: string, event: 'onPress' | 'onLongPress' = 'onPress'): Promise<void> => {
    const target = tree.root.findAllByProps({testID}).find((node) => typeof node.props[event] === 'function');
    await act(async () => {
        target?.props[event]();
    });
    await act(async () => {}); // flush the async save
};

const type = async (tree: ReactTestRenderer, testID: string, text: string): Promise<void> => {
    const target = tree.root.findAllByProps({testID}).find((node) => typeof node.props.onChangeText === 'function');
    await act(async () => {
        target?.props.onChangeText(text);
    });
    await act(async () => {});
};

describe('CombatTracker', () => {
    it('seeds and persists a fresh combat state on first mount', async () => {
        const {repo, current} = fakeRepo();
        await render(hero(), repo);

        const state = current();
        expect(state).not.toBeNull();
        expect(Object.keys(state!.phases).length).toBeGreaterThan(0);
        expect(state!.ocv).toBeGreaterThan(0);
    });

    it('applies typed damage and a Recovery, capped at the maximum', async () => {
        const character = hero();
        const max = combatMaximums(character);
        const {repo, current} = fakeRepo();
        const tree = await render(character, repo);

        await type(tree, 'vital-stun', '5');
        expect(current()!.stun).toBe(5);

        await press(tree, 'recovery');
        expect(current()!.stun).toBe(Math.min(max.stun, 5 + max.recovery));
    });

    it('resets a vital to its maximum', async () => {
        const character = hero();
        const max = combatMaximums(character);
        const {repo, current} = fakeRepo();
        const tree = await render(character, repo);

        await type(tree, 'vital-body', '1');
        expect(current()!.body).toBe(1);

        await press(tree, 'reset-body');
        expect(current()!.body).toBe(max.body);
    });

    it('nudges a combat value with the steppers', async () => {
        const {repo, current} = fakeRepo();
        const tree = await render(hero(), repo);
        const base = current()!.ocv;

        await press(tree, 'cv-inc-ocv');
        expect(current()!.ocv).toBe(base + 1);

        await press(tree, 'cv-dec-ocv');
        expect(current()!.ocv).toBe(base);
    });

    it('marks a phase used on tap and aborted on long-press, then clears on New Turn', async () => {
        const {repo, current} = fakeRepo();
        const tree = await render(hero(), repo);
        const phase = Object.keys(current()!.phases)[0];

        await press(tree, `phase-${phase}`);
        expect(current()!.phases[phase]).toEqual({used: true, aborted: false});

        await press(tree, `phase-${phase}`, 'onLongPress');
        expect(current()!.phases[phase]).toEqual({used: false, aborted: true});

        await press(tree, 'new-turn');
        expect(Object.values(current()!.phases).every((p) => !p.used && !p.aborted)).toBe(true);
    });

    it('adds, edits, and removes a status effect through the dialog', async () => {
        const {repo, current} = fakeRepo();
        const tree = await render(hero(), repo);

        await press(tree, 'add-status'); // opens the dialog seeded as Aid
        await type(tree, 'status-activePoints', '20');
        await type(tree, 'status-targetTrait', 'STR');
        await press(tree, 'status-apply');

        expect(current()!.statuses).toEqual([{name: 'Aid', label: '', activePoints: 20, targetTrait: 'STR'}]);
        expect(collectText(tree.toJSON())).toContain('Aid: +20 AP to STR');

        await press(tree, 'edit-status-0'); // reopen on the existing status
        await press(tree, 'segment-Flash'); // switch its type
        await type(tree, 'status-segments', '5');
        await press(tree, 'status-apply');
        expect(current()!.statuses).toEqual([{name: 'Flash', label: '', segments: 5}]);

        await press(tree, 'remove-status-0');
        expect(current()!.statuses).toEqual([]);
    });

    it('clears all statuses', async () => {
        const {repo, current} = fakeRepo();
        const tree = await render(hero(), repo);

        for (let i = 0; i < 2; i++) {
            await press(tree, 'add-status');
            await press(tree, 'status-apply');
        }
        expect(current()!.statuses.length).toBe(2);

        await press(tree, 'clear-statuses');
        expect(current()!.statuses).toEqual([]);
    });

    it('restores a persisted state instead of reseeding', async () => {
        const character = hero();
        const stored: CombatState = {stun: 7, body: 3, endurance: 9, ocv: 99, dcv: 1, omcv: 0, dmcv: 0, phases: {}, statuses: []};
        const repo: CombatStateRepository = {
            get: async () => stored,
            save: async () => undefined,
            clear: async () => undefined,
        };

        const tree = await render(character, repo);
        // The persisted OCV of 99 is shown, not a reseeded value.
        expect(collectText(tree.toJSON())).toContain('99');
    });
});
