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
import {heroDesignerCharacter, type ParsedCharacter} from 'core/hero';
import {DEFAULT_STATISTICS, type Character, type CharacterRepository, type Rng, type Statistics, type StatisticsRepository} from 'core/ports';
import type {Repositories} from 'infra/persistence/repositories';
import {DiceProvider} from 'app/providers/DiceProvider';
import {RepositoriesProvider} from 'app/providers/RepositoriesProvider';
import {ThemeProvider} from 'app/theme';
import sample from '../../composition/sampleCharacter.json';
import {CharacterDetailScreen, type CharacterDetailScreenProps} from '../CharacterDetailScreen';

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

const scriptedRoller = (faces: number[]): DieRoller => {
    let index = 0;
    return new DieRoller({next: () => faces[index++ % faces.length]} as Rng);
};

const character = (over: Partial<Character> = {}): Character => ({
    id: 'c1',
    name: 'Defensor',
    player: 'Phil',
    edition: '6E',
    slot: 0,
    isActive: true,
    portraitUri: null,
    filename: 'defensor.hsmc',
    updatedAt: '2026-01-01T00:00:00.000Z',
    document: {
        characteristics: [{name: 'STR', value: 20}],
        powers: [{name: 'Force Field', xmlid: 'FORCEFIELD'}],
    },
    ...over,
});

const fakeCharacters = (result: Character | null): CharacterRepository =>
    ({
        get: async () => result,
    } as unknown as CharacterRepository);

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

const renderScreen = async (
    repo: CharacterRepository,
    props: Partial<CharacterDetailScreenProps> = {},
    options: {statistics?: StatisticsRepository; roller?: DieRoller} = {},
): Promise<ReactTestRenderer> => {
    const statistics = options.statistics ?? fakeStatistics().repo;
    const repositories = {characters: repo, statistics} as unknown as Repositories;
    const roller = options.roller ?? scriptedRoller([3]);

    let tree!: ReactTestRenderer;
    await act(async () => {
        tree = TestRenderer.create(
            <ThemeProvider colorScheme="dark">
                <RepositoriesProvider repositories={repositories}>
                    <DiceProvider dieRoller={roller}>
                        <CharacterDetailScreen characterId="c1" {...props} />
                    </DiceProvider>
                </RepositoriesProvider>
            </ThemeProvider>,
        );
    });
    await act(async () => {});

    return tree;
};

describe('CharacterDetailScreen', () => {
    it('falls back to basic info for a thin/legacy document', async () => {
        const tree = await renderScreen(fakeCharacters(character()));

        const text = collectText(tree.toJSON());
        expect(text).toContain('Defensor');
        expect(text).toContain('6E · Phil');
        expect(text).toContain('Active');
        expect(text).toContain('defensor.hsmc'); // File row (basic-body only)
        expect(text).toContain('Slot 1'); // slot 0 shown 1-indexed
        expect(text).toContain('STR');
        expect(text).toContain('20');
        expect(text).toContain('Force Field');
    });

    it('renders the full engine sheet for a processed HeroDesigner document', async () => {
        const document = heroDesignerCharacter.getCharacter(sample as unknown as ParsedCharacter) as unknown as Character['document'];
        const tree = await renderScreen(fakeCharacters(character({document})));

        const text = collectText(tree.toJSON());
        expect(text).toContain('Strength'); // real characteristic name from the engine
        expect(text.some((value) => /^\d+-$/.test(value))).toBe(true); // a roll like "13-"
        expect(text).not.toContain('File'); // full sheet, not the basic-body fallback
    });

    it('opens the dice roller pre-filled when a characteristic roll is tapped (onPress)', async () => {
        const onRollRequest = jest.fn();
        const document = heroDesignerCharacter.getCharacter(sample as unknown as ParsedCharacter) as unknown as Character['document'];
        const tree = await renderScreen(fakeCharacters(character({document})), {onRollRequest});

        const roll = tree.root.findAllByProps({testID: 'roll-char-Strength'}).find((node) => typeof node.props.onPress === 'function');
        await act(async () => {
            roll?.props.onPress();
        });

        expect(onRollRequest).toHaveBeenCalledTimes(1);
        expect(onRollRequest.mock.calls[0][0]).toMatchObject({mode: 'skill', label: 'Strength'});
    });

    it('rolls immediately and shows the result on long-press, recording stats', async () => {
        const {repo: statistics, current} = fakeStatistics();
        const document = heroDesignerCharacter.getCharacter(sample as unknown as ParsedCharacter) as unknown as Character['document'];
        const tree = await renderScreen(fakeCharacters(character({document})), {}, {statistics, roller: scriptedRoller([3])});

        const roll = tree.root.findAllByProps({testID: 'roll-char-Strength'}).find((node) => typeof node.props.onLongPress === 'function');
        await act(async () => {
            roll?.props.onLongPress();
        });
        await act(async () => {}); // flush the stats write

        const text = collectText(tree.toJSON());
        expect(text).toContain('Skill Check'); // result popup title
        expect(text).toContain('Rolled 9'); // 3d6 of 3s
        expect(current().totals.skillChecks).toBe(1);
    });

    it('calls onReady with the loaded character (for the header title)', async () => {
        const onReady = jest.fn();
        await renderScreen(fakeCharacters(character({name: 'Grond'})), {onReady});

        expect(onReady).toHaveBeenCalledTimes(1);
        expect(onReady.mock.calls[0][0].name).toBe('Grond');
    });

    it('shows a not-found state when the character is missing', async () => {
        const tree = await renderScreen(fakeCharacters(null));

        expect(collectText(tree.toJSON())).toContain('Character not found');
    });

    it('renders the portrait when present', async () => {
        const tree = await renderScreen(fakeCharacters(character({portraitUri: 'file:///images/p1.png'})));

        expect(tree.root.findByProps({testID: 'portrait'}).props.source.uri).toBe('file:///images/p1.png');
    });
});
