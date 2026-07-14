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
 * Golden-master oracle harness for the character model.
 *
 * Loads the real legacy `HeroDesignerCharacter` engine in pure node by stubbing
 * its four non-pure dependencies (`react-native`, the toast module, and the
 * `App`/`Statistics` reach-ins that `Common`→`DieRoller` drags in), then runs
 * `getCharacter` over every parsed fixture. This both proves the oracle works
 * and guards the corpus: every fixture must be engine-parseable. Sub-phase 2d
 * turns this into the legacy-vs-core comparison once `core/hero.getCharacter`
 * exists.
 */
import manifest from './fixtures/manifest.json';

// Virtual mocks: the core project's transform ignores node_modules, so requiring
// the real (Flow/ESM) react-native would throw; virtual bypasses loading these
// modules entirely and uses the factory. The App/Statistics reach-ins are stubbed
// the same way so the legacy engine loads with no native dependencies.
jest.mock('react-native', () => ({Dimensions: {get: () => ({width: 0, height: 0})}, Platform: {OS: 'ios', select: (o: {ios?: unknown}) => o.ios}}), {virtual: true});
jest.mock('react-native-toast-message', () => ({show: () => {}}), {virtual: true});
jest.mock('../../../../../hero-system-mobile/App', () => ({getRandomNumber: () => 1}), {virtual: true});
jest.mock('../../../../../hero-system-mobile/src/lib/Statistics', () => ({statistics: {add: () => Promise.resolve()}}), {virtual: true});

const legacy = require('../../../../../hero-system-mobile/src/lib/HeroDesignerCharacter') as {
    heroDesignerCharacter: {getCharacter(parsed: unknown): Record<string, unknown>};
};

const fixtures = manifest.map((entry) => entry.fixture).sort();

// getCharacter mutates its input, so hand each run a fresh clone.
const loadFixture = (name: string): unknown => JSON.parse(JSON.stringify(require(`./fixtures/${name}.json`)));

describe('oracle: legacy getCharacter over the fixture corpus', () => {
    it('has the expected number of fixtures', () => {
        expect(fixtures.length).toBe(37);
    });

    it.each(fixtures)('normalizes %s without error', (name) => {
        const character = legacy.heroDesignerCharacter.getCharacter(loadFixture(name));

        expect(Array.isArray(character.characteristics)).toBe(true);
        expect((character.characteristics as unknown[]).length).toBeGreaterThan(0);
        for (const key of ['movement', 'skills', 'perks', 'talents', 'martialArts', 'powers', 'equipment', 'disadvantages']) {
            expect(Array.isArray(character[key])).toBe(true);
        }
    });
});
