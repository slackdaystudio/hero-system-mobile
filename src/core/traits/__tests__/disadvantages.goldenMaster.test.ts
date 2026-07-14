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
 * Golden master for the decorator cost engine (sub-phase 3, tier 1), scoped to
 * the trait category it fully covers: **disadvantages** (base → Complication →
 * ModifierCalculator, no sub-factory). Each character is built via the legacy
 * engine, then every disadvantage is decorated by both the legacy and the ported
 * factory and their cost/activeCost/realCost/roll compared. Later tiers extend
 * this to skills/perks/talents/powers.
 */
import manifest from '../../hero/__tests__/fixtures/manifest.json';
import {characterTraitDecorator as core} from 'core/traits';
import {flatten} from 'core/util';

// react-native/toast via moduleNameMapper; App/Statistics stubbed here (see the
// hero golden master for the rationale).
jest.mock('../../../../../hero-system-mobile/App', () => ({getRandomNumber: () => 1}));
jest.mock('../../../../../hero-system-mobile/src/lib/Statistics', () => ({statistics: {add: () => Promise.resolve()}}));

const legacyModel = (require('../../../../../hero-system-mobile/src/lib/HeroDesignerCharacter') as {heroDesignerCharacter: {getCharacter(parsed: unknown): any}}).heroDesignerCharacter;
const legacyDecorator = (require('../../../../../hero-system-mobile/src/decorators/CharacterTraitDecorator') as {
    characterTraitDecorator: {decorate(item: unknown, listKey: string, getCharacter: () => unknown): any};
}).characterTraitDecorator;

const fixtures = manifest.map((entry) => entry.fixture).sort();
const clone = (name: string): any => JSON.parse(JSON.stringify(require(`../../hero/__tests__/fixtures/${name}.json`)));

describe('golden master: core/traits decorator (disadvantages) reproduces legacy', () => {
    it('covers the whole corpus', () => {
        expect(fixtures.length).toBe(37);
    });

    describe.each(fixtures)('%s', (name) => {
        const character = legacyModel.getCharacter(clone(name));
        const getCharacter = () => character;
        const disadvantages = flatten(character.disadvantages, 'disadvantages');

        it(`decorates ${disadvantages.length} disadvantage(s) identically`, () => {
            for (const disadvantage of disadvantages) {
                const legacy = legacyDecorator.decorate(disadvantage, 'disadvantages', getCharacter);
                const ported = core.decorate(disadvantage, 'disadvantages', getCharacter);

                expect(ported.cost()).toBe(legacy.cost());
                expect(ported.activeCost()).toBe(legacy.activeCost());
                expect(ported.realCost()).toBe(legacy.realCost());
                expect(ported.roll()).toEqual(legacy.roll());
            }
        });
    });
});
