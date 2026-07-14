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
 * Golden master for the combat model: `core/combat.combatDetails.init` must
 * reproduce the legacy `CombatDetails` for every corpus character (primary and
 * secondary combat values + the per-SPEED phase chart), and `sync` must preserve
 * used/aborted phase state. `init` mutates `showSecondary`, so each side gets a
 * fresh clone.
 */
import manifest from '../../hero/__tests__/fixtures/manifest.json';
import {combatDetails as core} from 'core/combat';

// react-native/toast via moduleNameMapper; App/Statistics stubbed here.
jest.mock('../../../../../hero-system-mobile/App', () => ({getRandomNumber: () => 1}));
jest.mock('../../../../../hero-system-mobile/src/lib/Statistics', () => ({statistics: {add: () => Promise.resolve()}}));

const legacyModel = (require('../../../../../hero-system-mobile/src/lib/HeroDesignerCharacter') as {heroDesignerCharacter: {getCharacter(parsed: unknown): any}}).heroDesignerCharacter;
const legacyCombat = (require('../../../../../hero-system-mobile/src/lib/CombatDetails') as {
    combatDetails: {init(character: unknown): any; sync(character: unknown, oldCharacter: unknown): void};
}).combatDetails;

const fixtures = manifest.map((entry) => entry.fixture).sort();
const clone = <T>(value: T): T => JSON.parse(JSON.stringify(value));
const loadCharacter = (name: string): any => legacyModel.getCharacter(clone(require(`../../hero/__tests__/fixtures/${name}.json`)));

describe('golden master: core/combat combatDetails reproduces legacy', () => {
    it('covers the whole corpus', () => {
        expect(fixtures.length).toBe(37);
    });

    it.each(fixtures)('init(%s) matches legacy', (name) => {
        const character = loadCharacter(name);

        expect(core.init(clone(character))).toEqual(legacyCombat.init(clone(character)));
    });

    it('sync preserves used/aborted phase state', () => {
        const character = loadCharacter('defensor');

        // A prior combat state with a used + aborted phase.
        const oldCharacter = clone(character);
        legacyCombat.init(oldCharacter); // populate showSecondary as a side effect
        oldCharacter.combatDetails = core.init(clone(character));
        const firstPhase = Object.keys(oldCharacter.combatDetails.primary.phases)[0];
        oldCharacter.combatDetails.primary.phases[firstPhase] = {used: true, aborted: true};

        const coreChar = clone(character);
        const legacyChar = clone(character);
        core.sync(coreChar, clone(oldCharacter));
        legacyCombat.sync(legacyChar, clone(oldCharacter));

        expect(coreChar.combatDetails).toEqual(legacyChar.combatDetails);
        expect(coreChar.combatDetails.primary.phases[firstPhase].used).toBe(true);
    });
});
