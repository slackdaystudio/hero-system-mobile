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
 * Golden master for the trait-decorator stack: the ported `core/traits` factory
 * must reproduce the legacy factory's cost/activeCost/realCost/roll for every
 * trait it decorates. Grows one trait category at a time as its decorators land
 * (tier 1: disadvantages; tier 2: + perks, talents; tier 3: + skills, powers,
 * martial arts).
 */
import manifest from '../../hero/__tests__/fixtures/manifest.json';
import {characterTraitDecorator as core} from 'core/traits';
import {flatten} from 'core/util';

// react-native/toast via moduleNameMapper; App/Statistics stubbed here.
jest.mock('../../../../../hero-system-mobile/App', () => ({getRandomNumber: () => 1}));
jest.mock('../../../../../hero-system-mobile/src/lib/Statistics', () => ({statistics: {add: () => Promise.resolve()}}));

const legacyModel = (require('../../../../../hero-system-mobile/src/lib/HeroDesignerCharacter') as {heroDesignerCharacter: {getCharacter(parsed: unknown): any}}).heroDesignerCharacter;
const legacyDecorator = (require('../../../../../hero-system-mobile/src/decorators/CharacterTraitDecorator') as {
    characterTraitDecorator: {decorate(item: unknown, listKey: string, getCharacter: () => unknown): any};
}).characterTraitDecorator;

// roll() can throw (a faithfully-ported legacy crash); treat "both threw the same"
// as a match by comparing value-or-error rather than calling toEqual on a throw.
const safeRoll = (decorated: {roll(): unknown}): unknown => {
    try {
        return {value: decorated.roll()};
    } catch (error) {
        return {threw: (error as Error).message};
    }
};

const fixtures = manifest.map((entry) => entry.fixture).sort();
const clone = (name: string): any => JSON.parse(JSON.stringify(require(`../../hero/__tests__/fixtures/${name}.json`)));

// Ported trait categories. `key` is the character array; `subKey` is the child
// key list containers store their members under (for flatten).
const CATEGORIES: Array<{key: string; subKey: string}> = [
    {key: 'disadvantages', subKey: 'disadvantages'},
    {key: 'perks', subKey: 'perks'},
    {key: 'talents', subKey: 'talents'},
    {key: 'skills', subKey: 'skills'},
    {key: 'powers', subKey: 'powers'},
    {key: 'martialArts', subKey: 'maneuver'},
];

// Power xmlids not yet fully reproduced, skipped so the golden master verifies the
// ported powers and stays green; this set shrinks to empty as tier 3 completes.
//   - group 1: cost/roll decorators still pass-through stubs (next batch);
//   - group 2: an edge in specific contexts (VPP/framework slots, compound-power
//     children) under investigation — skipped by xmlid for now, which is broader
//     than the actual failing instances.
const POWER_SKIP = new Set<string>();

/**
 * U2 (docs/KNOWN_DEVIATIONS.md) — intentional divergence: `core` is deliberately *more
 * correct* than legacy here, so "== legacy" no longer holds for these traits. Legacy's
 * `getMultiplications` had no guard on `total`, so `Math.log(0)` made a Clinging power
 * bought at 0 levels cost `-Infinity`; core costs it 11. Keyed by fixture → trait name.
 * The corrected value is pinned in `multiplierCost.test.ts`.
 */
const U2_DIVERGENCE: Record<string, Set<string>> = {
    'mark-li-v5a-433': new Set(['Gecko pads']),
};

describe('golden master: core/traits factory reproduces legacy', () => {
    it('covers the whole corpus', () => {
        expect(fixtures.length).toBe(37);
    });

    describe.each(fixtures)('%s', (name) => {
        const character = legacyModel.getCharacter(clone(name));
        const getCharacter = () => character;

        it.each(CATEGORIES)('$key decorated identically', ({key, subKey}) => {
            for (const trait of flatten(character[key], subKey)) {
                if (key === 'powers' && POWER_SKIP.has((trait.xmlid as string).toUpperCase())) {
                    continue;
                }

                if (U2_DIVERGENCE[name]?.has(String(trait.name))) {
                    continue; // U2 — see U2_DIVERGENCE; corrected value pinned in multiplierCost.test.ts
                }

                const legacy = legacyDecorator.decorate(trait, key, getCharacter);
                const ported = core.decorate(trait, key, getCharacter);

                expect(ported.cost()).toBe(legacy.cost());
                expect(ported.activeCost()).toBe(legacy.activeCost());
                expect(ported.realCost()).toBe(legacy.realCost());
                // roll() faithfully reproduces a legacy crash on a maneuver whose
                // `effect` references a template that didn't resolve (see
                // KNOWN_DEVIATIONS H4): both throw identically, which counts as a match.
                expect(safeRoll(ported)).toEqual(safeRoll(legacy));
            }
        });
    });
});
