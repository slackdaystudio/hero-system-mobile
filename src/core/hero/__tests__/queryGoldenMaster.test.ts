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
 * Golden master for the character model's *query* methods (defense/roll/
 * characteristic totals). Each character is built once via the legacy engine
 * (the oracle), then both engines' query methods are run against it and compared
 * — isolating this suite from the getCharacter golden master. Exercised over the
 * whole corpus and both `showSecondary` settings.
 */
import manifest from './fixtures/manifest.json';
import {heroDesignerCharacter as core} from 'core/hero';
import {flatten} from 'core/util';

// See goldenMaster.test.ts: react-native/toast are stubbed via moduleNameMapper;
// the App/Statistics reach-ins are stubbed here.
jest.mock('../../../../../hero-system-mobile/App', () => ({getRandomNumber: () => 1}));
jest.mock('../../../../../hero-system-mobile/src/lib/Statistics', () => ({statistics: {add: () => Promise.resolve()}}));

const legacy = require('../../../../../hero-system-mobile/src/lib/HeroDesignerCharacter') as {
    heroDesignerCharacter: {
        getCharacter(parsed: unknown): any;
        getCharacteristicTotal(shortName: string, character: unknown): number;
        getRollTotal(characteristic: unknown, character: unknown): string | null;
        getAdditionalCharacteristicPoints(shortName: string, character: unknown): number;
        getTotalDefense(character: unknown, type: string, withResistant?: boolean): string;
        getTotalUnusualDefense(character: unknown, powerXmlId: string): string;
        isFifth(character: unknown): boolean;
        hasSecondaryCharacteristics(powers: unknown): boolean;
        getCharacteristicFullName(abbreviation: string): string;
        isPowerFrameworkItem(item: unknown, character: unknown, type: string): boolean;
    };
};

const legacyModel = legacy.heroDesignerCharacter;
const fixtures = manifest.map((entry) => entry.fixture).sort();
const clone = (name: string): unknown => JSON.parse(JSON.stringify(require(`./fixtures/${name}.json`)));

/**
 * H3 (docs/KNOWN_DEVIATIONS.md) — intentional divergence: `core` is deliberately *more
 * correct* than legacy here, so "== legacy" no longer holds for these characteristics.
 * Legacy dropped every duplicated resistant defense; core sums them, per the rules:
 *   - `junkyard`     — "Armor Plates" (8/8) now counts (its second Force Field, "Force
 *                      Bubble", is still excluded by `affectsTotal: false`).
 *   - `mark-li-v5a-433` — "Hide" (5/5) + "Scales" (5/5), two standalone Armors, now sum.
 * Only the alternate-ID form is affected (both are `affectsPrimary: false`), so the
 * `showSecondary: false` column still matches legacy exactly and stays compared.
 * The corrected values are pinned in `duplicatePowers.test.ts`.
 */
const H3_DIVERGENCE: Record<string, Set<string>> = {
    junkyard: new Set(['PD', 'ED']),
    'mark-li-v5a-433': new Set(['PD', 'ED']),
};

const divergesHere = (fixture: string, key: string, showSecondary: boolean): boolean =>
    showSecondary && (H3_DIVERGENCE[fixture]?.has(key.toUpperCase()) ?? false);

/**
 * H6 + H7 (docs/KNOWN_DEVIATIONS.md) — intentional divergence on the unusual-defense totals,
 * in both `showSecondary` columns. Keyed by fixture → the queried xmlid.
 *   - `defensor` POWERDEFENSE — H6: its two Power Defense powers (10 and 5) collapsed into an
 *     array and contributed nothing; legacy's 10 was its *mental* defense leaking in via H7
 *     plus the compound power. Now 25.
 *   - `defensor` FLASHDEFENSE — H7: legacy reported 5 from that same mdlevels leak. Now 0.
 *   - `adamantinerebuild210109` FLASHDEFENSE — H7: legacy reported 1 purely from Resistant
 *     Protection's `mdlevels`; it has no Flash power and there is no `flashlevels` field.
 *   - `m-championsmush` MENTALDEFENSE — H6: four Mental Defences (12+10+10+10) in plain
 *     `list` folders (not frameworks, so they do stack) all dropped. Now 42.
 * Corrected values are pinned in `unusualDefenses.test.ts`.
 */
const UNUSUAL_DEFENSE_DIVERGENCE: Record<string, Set<string>> = {
    defensor: new Set(['POWERDEFENSE', 'FLASHDEFENSE']),
    adamantinerebuild210109: new Set(['FLASHDEFENSE']),
    'm-championsmush': new Set(['MENTALDEFENSE']),
};

describe('golden master: core/hero query methods reproduce legacy', () => {
    it('covers the whole corpus', () => {
        expect(fixtures.length).toBe(37);
    });

    describe.each(fixtures)('%s', (name) => {
        const character = legacyModel.getCharacter(clone(name));

        it.each([true, false])('characteristic totals + rolls (showSecondary=%s)', (showSecondary) => {
            character.showSecondary = showSecondary;

            for (const characteristic of character.characteristics) {
                const shortName = characteristic.shortName;

                if (!divergesHere(name, shortName, showSecondary)) {
                    expect(core.getCharacteristicTotal(shortName, character)).toBe(legacyModel.getCharacteristicTotal(shortName, character));
                    expect(core.getAdditionalCharacteristicPoints(shortName, character)).toBe(legacyModel.getAdditionalCharacteristicPoints(shortName, character));
                }

                expect(core.getRollTotal(characteristic, character)).toBe(legacyModel.getRollTotal(characteristic, character));
            }
        });

        it.each([true, false])('defenses (showSecondary=%s)', (showSecondary) => {
            character.showSecondary = showSecondary;

            for (const type of ['PD', 'ED']) {
                if (divergesHere(name, type, showSecondary)) {
                    continue; // H3 — see H3_DIVERGENCE; corrected values pinned in duplicatePowers.test.ts
                }

                expect(core.getTotalDefense(character, type, true)).toBe(legacyModel.getTotalDefense(character, type, true));
                expect(core.getTotalDefense(character, type, false)).toBe(legacyModel.getTotalDefense(character, type, false));
            }

            for (const unusual of ['MENTALDEFENSE', 'POWERDEFENSE', 'FLASHDEFENSE']) {
                if (UNUSUAL_DEFENSE_DIVERGENCE[name]?.has(unusual)) {
                    continue; // H6/H7 — corrected values pinned in unusualDefenses.test.ts
                }

                expect(core.getTotalUnusualDefense(character, unusual)).toBe(legacyModel.getTotalUnusualDefense(character, unusual));
            }
        });

        it('predicates match legacy', () => {
            expect(core.isFifth(character)).toBe(legacyModel.isFifth(character));
            expect(core.hasSecondaryCharacteristics(character.powers)).toBe(legacyModel.hasSecondaryCharacteristics(character.powers));

            for (const abbreviation of ['STR', 'PD', 'OCV', 'dex', 'notacharacteristic']) {
                expect(core.getCharacteristicFullName(abbreviation)).toBe(legacyModel.getCharacteristicFullName(abbreviation));
            }

            // Every trait (framework children included) checked against both framework types.
            for (const power of flatten(character.powers, 'powers')) {
                for (const type of ['multipower', 'elementalControl']) {
                    expect(core.isPowerFrameworkItem(power, character, type)).toBe(legacyModel.isPowerFrameworkItem(power, character, type));
                }
            }
        });
    });
});
