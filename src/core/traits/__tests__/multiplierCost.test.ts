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
 * Correctness test for U2 (docs/KNOWN_DEVIATIONS.md) — `getMultiplications` used to return
 * `-Infinity` for a zero total, because `Math.log(0)` is `-Infinity` and there was no guard.
 * `clinging.ts` passes `levels` with no `> 0` check, so a Clinging power bought at 0 levels
 * poisoned its own cost and rendered the literal string "-Infinity" on the character sheet.
 *
 * Legacy is wrong here too (its `Clinging.js` is byte-identical), so it is not the oracle:
 * the expected value below comes from the character's data and the template. The decorator
 * golden master skips exactly this trait — see `U2_DIVERGENCE` in
 * `decorator.goldenMaster.test.ts`.
 */
import {heroDesignerCharacter, type ParsedCharacter} from 'core/hero';
import {characterTraitDecorator} from 'core/traits';
import {flatten} from 'core/util';

type Obj = Record<string, any>;

jest.mock('../../../../../hero-system-mobile/App', () => ({getRandomNumber: () => 1}));
jest.mock('../../../../../hero-system-mobile/src/lib/Statistics', () => ({statistics: {add: () => Promise.resolve()}}));

const heroOf = (fixture: string): Obj =>
    heroDesignerCharacter.getCharacter(JSON.parse(JSON.stringify(require(`../../hero/__tests__/fixtures/${fixture}.json`))) as ParsedCharacter) as unknown as Obj;

describe('U2 — a zero-level multiplier buys nothing', () => {
    it('costs mark-li\'s "Gecko pads" (CLINGING, levels 0) at 10, not -Infinity', () => {
        const markLi = heroOf('mark-li-v5a-433');
        const geckoPads = (flatten(markLi.powers, 'powers') as Obj[]).find((power) => power.name === 'Gecko pads')!;

        expect(geckoPads).toBeDefined();
        expect(geckoPads.xmlid).toBe('CLINGING');
        expect(geckoPads.levels).toBe(0);

        // The 5E/6E `clinging` template is basecost 10 / lvlval 3 / lvlcost 1, and
        // Clinging.cost() is `basecost + getMultiplierCost(levels, lvlval, lvlcost)`.
        // At 0 levels the multiplier term contributes nothing: 10 + 0 = 10, the template's own
        // `mincost`. (This read 11 until H10 removed a stray +1 — see KNOWN_DEVIATIONS.)
        const decorated = characterTraitDecorator.decorate(geckoPads, 'powers', () => markLi);

        expect(decorated.cost()).toBe(10);
        expect(Number.isFinite(decorated.activeCost())).toBe(true);
        expect(Number.isFinite(decorated.realCost())).toBe(true);
    });

    it('leaves every other trait in the corpus finite', () => {
        // The -Infinity was found by sweeping for non-finite costs; keep that sweep as a guard.
        for (const fixture of ['mark-li-v5a-433', 'aoe', 'junkyard', 'defensor']) {
            const character = heroOf(fixture);

            for (const key of ['skills', 'perks', 'talents', 'powers', 'equipment', 'disadvantages']) {
                for (const trait of flatten((character[key] ?? []) as Obj[], key === 'martialArts' ? 'maneuver' : key) as Obj[]) {
                    const decorated = characterTraitDecorator.decorate(trait, key, () => character);

                    expect(Number.isFinite(decorated.cost())).toBe(true);
                    expect(Number.isFinite(decorated.realCost())).toBe(true);
                }
            }
        }
    });
});
