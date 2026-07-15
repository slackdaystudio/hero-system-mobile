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
 * Correctness test for H10 (docs/KNOWN_DEVIATIONS.md) — legacy's `Clinging.cost()` ended
 * `return cost + 1`, putting the power's floor at 11. 5E prices Clinging at **10 base, +1 per
 * +3 STR**. Nothing in the rules adds a point.
 *
 * Legacy is wrong, so it is not the oracle. Three independent sources agree against it:
 *   - the template's `basecost: 10` **and its `mincost: 10`**, which the stray +1 made unreachable
 *   - the rules text the template quotes (5E page 94)
 *   - the legacy random-character archetype prose, which prices `Clinging 20 STR` at 10
 */
import {heroDesignerCharacter, type ParsedCharacter} from 'core/hero';
import {characterTraitDecorator} from 'core/traits';
import {flatten} from 'core/util';

type Obj = Record<string, any>;

jest.mock('../../../../../hero-system-mobile/App', () => ({getRandomNumber: () => 1}));
jest.mock('../../../../../hero-system-mobile/src/lib/Statistics', () => ({statistics: {add: () => Promise.resolve()}}));

const heroOf = (fixture: string): Obj =>
    heroDesignerCharacter.getCharacter(JSON.parse(JSON.stringify(require(`../../hero/__tests__/fixtures/${fixture}.json`))) as ParsedCharacter) as unknown as Obj;

const clingingIn = (fixture: string): {trait: Obj; character: Obj} => {
    const character = heroOf(fixture);
    const walk = (items: Obj[]): Obj[] => items.flatMap((item) => [item, ...(Array.isArray(item.powers) ? walk(item.powers as Obj[]) : [])]);
    const trait = walk(flatten(character.powers as Obj[], 'powers') as Obj[]).find((power) => power.xmlid === 'CLINGING')!;

    return {trait, character};
};

const costOf = (fixture: string): number => {
    const {trait, character} = clingingIn(fixture);

    return characterTraitDecorator.decorate(trait, 'powers', () => character).cost();
};

describe('H10 — Clinging costs its basecost, with no stray point', () => {
    it("costs mark-li's Gecko pads at its template's own mincost", () => {
        const {trait} = clingingIn('mark-li-v5a-433');

        expect(trait.levels).toBe(0);
        expect(trait.basecost).toBe(10);
        expect(trait.template.mincost).toBe(10);

        // Legacy said 11 — one point above the minimum the template declares reachable.
        expect(costOf('mark-li-v5a-433')).toBe(10);
    });

    it("costs spyder2022's Clinging one point less than legacy did", () => {
        expect(costOf('spyder2022')).toBe(13);
    });

    it('still charges for STR bought above the base, at 1 per +3', () => {
        // The fix removes only the trailing +1; the multiplier term is untouched.
        const {trait, character} = clingingIn('mark-li-v5a-433');
        const withStr = {...trait, levels: 9};

        // basecost 10 + getMultiplierCost(9, lvlval 3, lvlcost 1): 9 is 3^2, so two steps → 12.
        expect(characterTraitDecorator.decorate(withStr, 'powers', () => character).cost()).toBe(12);
    });
});
