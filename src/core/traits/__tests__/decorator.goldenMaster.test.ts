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

/**
 * H4 (docs/KNOWN_DEVIATIONS.md) — intentional divergence: legacy's `Maneuver.roll()` throws
 * on a maneuver whose `template` property exists with an `undefined` value, and core now
 * falls through to the delegated roll instead. Keyed by fixture → trait xmlid (these
 * maneuvers have no `name`). `tazimmaad`'s JAB is the only trait in the whole corpus whose
 * legacy `roll()` throws, which is why comparing rolls directly below is safe now — the
 * previous `safeRoll` helper existed solely to let "both engines threw identically" count as
 * a match. The corrected behaviour is pinned in `maneuverTemplate.test.ts`.
 */
const H4_ROLL_DIVERGENCE: Record<string, Set<string>> = {
    tazimmaad: new Set(['JAB']),
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

/**
 * H9 (docs/KNOWN_DEVIATIONS.md) — intentional divergence: legacy priced Enhanced Perception at a
 * flat 1 per level, never reading the template's `allcost`, so a +1 to *every* sense group cost
 * the same as a +1 to one sense. Keyed by fixture → trait xmlid (these have no `name`).
 *   - `adamantinerebuild210109` — `levels: 9`, `optionid: ALL`: 9 → **27** (9 × allcost 3)
 *   - `jane-fawn` — `levels: 2`, `optionid: ALL`: 2 → **6**
 * Only the cost diverges; `roll()` is untouched and stays compared. Corrected values are pinned
 * in `enhancedPerception.test.ts`.
 */
const H9_COST_DIVERGENCE: Record<string, Set<string>> = {
    adamantinerebuild210109: new Set(['ENHANCEDPERCEPTION']),
    'jane-fawn': new Set(['ENHANCEDPERCEPTION']),
};

/**
 * H10 (docs/KNOWN_DEVIATIONS.md) — intentional divergence: legacy's `Clinging.cost()` ended
 * `return cost + 1`, putting the power's floor at 11. 5E prices it at 10 base +1 per +3 STR, and
 * the template says so itself — `basecost: 10`, and a `mincost: 10` the stray +1 made
 * unreachable. Every Clinging in the corpus is therefore one point cheaper:
 *   - `spyder2022`'s Clinging 14 → **13**
 *   - `aoe` carries its Clinging inside a **compound power** ("Effect Test"), so the change shows
 *     on the parent: 44 → **43**. `flatten` never descends into compound children, so the
 *     compound is the only trait the golden master ever compares for them — hence the xmlid here
 *     is `COMPOUNDPOWER`, not `CLINGING`.
 * `mark-li-v5a-433`'s Gecko pads is already skipped by `U2_DIVERGENCE` above (11 → 10 there).
 * Corrected values pinned in `clinging.test.ts`.
 */
const H10_COST_DIVERGENCE: Record<string, Set<string>> = {
    aoe: new Set(['COMPOUNDPOWER']),
    spyder2022: new Set(['CLINGING']),
};

/**
 * H12 (docs/KNOWN_DEVIATIONS.md) — intentional divergence: legacy's Skill Enhancer discount applied
 * its "minimum 1 point" floor unconditionally, so a *free* Skill under an enhancer (a native/everyman
 * language, cost 0) was charged 1 point. The rules reduce a *paid* Skill's cost by 1 to a floor of 1;
 * a free Skill has nothing to reduce and stays 0 (HERO Designer agrees). Only `realCost()` diverges —
 * `cost()`/`activeCost()` are 0 in both engines and stay compared. Keyed by fixture → `input` (the
 * languages' visible label; `name` is null for two of the three). Corrected values pinned in
 * `skillEnhancer.test.ts`.
 *   - `greyman` — Mandaarian (native) under Linguist: 1 → **0**
 *   - `m-championsmush` — Romany (native, displayed "Native") under Linguist: 1 → **0**
 *   - `twilight` — English (native) under Linguist: 1 → **0**
 */
const H12_REALCOST_DIVERGENCE: Record<string, Set<string>> = {
    greyman: new Set(['Mandaarian']),
    'm-championsmush': new Set(['Romany']),
    twilight: new Set(['English']),
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

                const xmlid = String(trait.xmlid).toUpperCase();

                if (!((H9_COST_DIVERGENCE[name]?.has(xmlid) ?? false) || (H10_COST_DIVERGENCE[name]?.has(xmlid) ?? false))) {
                    expect(ported.cost()).toBe(legacy.cost());
                    expect(ported.activeCost()).toBe(legacy.activeCost());

                    // H12 — only realCost diverges: legacy's enhancer clamp charged a free skill 1;
                    // core keeps it 0. cost()/activeCost() (both 0) stay compared above.
                    if (!(H12_REALCOST_DIVERGENCE[name]?.has(String(trait.input)) ?? false)) {
                        expect(ported.realCost()).toBe(legacy.realCost());
                    }
                }

                // Only roll() diverges for H4 — the costs still match legacy exactly.
                if (!H4_ROLL_DIVERGENCE[name]?.has(String(trait.xmlid).toUpperCase())) {
                    expect(ported.roll()).toEqual(legacy.roll());
                }
            }
        });
    });
});
