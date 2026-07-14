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
 * Golden master for the character model: the ported `core/hero.getCharacter`
 * must reproduce the legacy `HeroDesignerCharacter.getCharacter` byte-for-byte
 * over every real character in the corpus. The legacy engine is loaded in pure
 * node with its non-pure dependencies stubbed (see notes on the virtual mocks).
 * `getCharacter` mutates its input, so each side gets a fresh clone.
 */
import manifest from './fixtures/manifest.json';
import {heroDesignerCharacter as core} from 'core/hero';

// react-native + the toast module are stubbed project-wide via moduleNameMapper
// (see jest.config.js). The App/Statistics reach-ins that Common→DieRoller drags
// in are stubbed here so the legacy engine loads with no native dependencies.
jest.mock('../../../../../hero-system-mobile/App', () => ({getRandomNumber: () => 1}));
jest.mock('../../../../../hero-system-mobile/src/lib/Statistics', () => ({statistics: {add: () => Promise.resolve()}}));

const legacy = require('../../../../../hero-system-mobile/src/lib/HeroDesignerCharacter') as {
    heroDesignerCharacter: {getCharacter(parsed: unknown): unknown};
};

const fixtures = manifest.map((entry) => entry.fixture).sort();
const clone = (name: string): unknown => JSON.parse(JSON.stringify(require(`./fixtures/${name}.json`)));

describe('golden master: core/hero getCharacter reproduces legacy', () => {
    it('covers the whole corpus', () => {
        expect(fixtures.length).toBe(37);
    });

    it.each(fixtures)('%s matches legacy', (name) => {
        const legacyCharacter = legacy.heroDesignerCharacter.getCharacter(clone(name));
        const coreCharacter = core.getCharacter(clone(name) as never);

        expect(coreCharacter).toEqual(legacyCharacter);
    });
});
