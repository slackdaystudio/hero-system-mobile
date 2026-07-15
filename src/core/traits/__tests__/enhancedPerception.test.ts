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
 * Correctness test for H9 (docs/KNOWN_DEVIATIONS.md) — Enhanced Perception is priced by **what
 * it enhances**: `allcost: 3` for all sense groups, `groupcost: 2` for one group, `sensecost: 1`
 * for a single sense. Legacy read the last two but never `allcost`, so an `ALL` option fell
 * through to the *sense* branch and a +1 to every sense cost the same as a +1 to one.
 *
 * Legacy is wrong here, so it is not the oracle. Two independent sources agree against it: the
 * template's own `allcost: 3`, and the legacy random-character archetype prose, which prices
 * `ES: PER +1` at 3.
 */
import {heroDesignerCharacter, type ParsedCharacter} from 'core/hero';
import {characterTraitDecorator} from 'core/traits';
import {flatten} from 'core/util';

type Obj = Record<string, any>;

jest.mock('../../../../../hero-system-mobile/App', () => ({getRandomNumber: () => 1}));
jest.mock('../../../../../hero-system-mobile/src/lib/Statistics', () => ({statistics: {add: () => Promise.resolve()}}));

const heroOf = (fixture: string): Obj =>
    heroDesignerCharacter.getCharacter(JSON.parse(JSON.stringify(require(`../../hero/__tests__/fixtures/${fixture}.json`))) as ParsedCharacter) as unknown as Obj;

const perception = (fixture: string): {trait: Obj; cost: number} => {
    const character = heroOf(fixture);
    const trait = (flatten(character.powers as Obj[], 'powers') as Obj[]).find((power) => power.xmlid === 'ENHANCEDPERCEPTION')!;

    return {trait, cost: characterTraitDecorator.decorate(trait, 'powers', () => character).cost()};
};

describe('H9 — Enhanced Perception is priced by what it enhances', () => {
    it("costs adamantine's all-senses +9 at 27, not 9", () => {
        const {trait, cost} = perception('adamantinerebuild210109');

        expect(trait.optionid).toBe('ALL');
        expect(trait.levels).toBe(9);
        expect(trait.template.allcost).toBe(3);

        // 9 levels × 3 (all sense groups). Legacy priced it 9 — as if it enhanced one sense.
        expect(cost).toBe(27);
    });

    it("costs jane-fawn's all-senses +2 at 6", () => {
        const {trait, cost} = perception('jane-fawn');

        expect(trait.optionid).toBe('ALL');
        expect(cost).toBe(trait.levels * 3);
        expect(cost).toBe(6);
    });

    it('still prices a single sense group by groupcost, as legacy did', () => {
        // The fix must not disturb the branch legacy got right. Several fixtures buy a group.
        const character = heroOf('the-witch-kitchen-sink');
        const groups = (flatten(character.powers as Obj[], 'powers') as Obj[]).filter(
            (power) => power.xmlid === 'ENHANCEDPERCEPTION' && String(power.optionid).endsWith('GROUP'),
        );

        for (const trait of groups) {
            expect(characterTraitDecorator.decorate(trait, 'powers', () => character).cost()).toBe(trait.levels * 2);
        }
    });

    it('leaves the roll alone — only the cost was wrong', () => {
        const {trait} = perception('adamantinerebuild210109');
        const character = heroOf('adamantinerebuild210109');

        expect(characterTraitDecorator.decorate(trait, 'powers', () => character).roll()).toMatchObject({roll: expect.stringMatching(/^\d+-$/)});
    });
});
