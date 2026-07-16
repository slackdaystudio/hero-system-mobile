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
 * The 6E complication packages.
 *
 * Complications are taken at the level's **fixed limit** — in theory a character may take fewer, in
 * practice essentially nobody does — so a package must total exactly it. 6E Standard's limit is 75;
 * the 5E packages are sized to 100, which is 5E *Low Powered's* limit.
 *
 * Nothing declares a cost. Every complication is priced from its adders by the engine, so a package
 * cannot pass by asserting anything about itself.
 */
import {heroDesignerCharacter} from 'core/hero';
import {getTemplate} from 'core/templates';
import {characterTraitDecorator, type Obj} from 'core/traits';
import {ARCHETYPES_6E} from '../allocate';
import {buildCharacteristics} from '../characteristics';
import {attachComplications, COMPLICATION_SETS_5E, type ComplicationSet} from '../complications';
import {LOW_POWERED_5E, STANDARD_6E} from '../powerLevel';
import packageData from '../../data/random/complicationPackages.6e.json';

const COMPLICATION_SETS_6E = (packageData as unknown as {packages: ComplicationSet[]}).packages;

const cases = COMPLICATION_SETS_6E.map((set) => [set.label, set] as const);

const build = (set: ComplicationSet): Obj => {
    const archetype = ARCHETYPES_6E.find((candidate) => candidate.name === 'Patriot')!;

    return heroDesignerCharacter.getCharacter(attachComplications(buildCharacteristics(archetype.characteristics, STANDARD_6E.template, 'T'), set)) as unknown as Obj;
};

const rows = (character: Obj): Array<{label: string; cost: number}> =>
    (character.disadvantages as Obj[]).map((disadvantage) => ({
        label: String(disadvantage.input ?? disadvantage.alias),
        cost: characterTraitDecorator.decorate(disadvantage, 'disadvantages', () => character).cost(),
    }));

const total = (character: Obj): number => rows(character).reduce((sum, row) => sum + row.cost, 0);

describe('6E complication packages', () => {
    it('lifted the same four labels 5E has', () => {
        expect(COMPLICATION_SETS_6E.map((set) => set.label)).toEqual(COMPLICATION_SETS_5E.map((set) => set.label));
    });

    it.each(cases)('%s totals exactly the 6E limit', (_label, set) => {
        expect(total(build(set))).toBe(STANDARD_6E.limit);
        expect(STANDARD_6E.limit).toBe(75);
    });

    /**
     * The 5E packages are sized to 100 — 5E **Low Powered's** limit, not a 6E number. Reusing one
     * would leave a 6E character 25 points over its complications and 25 points richer than it has
     * any right to be.
     */
    it('is a different size from 5E, because the limits are', () => {
        expect(LOW_POWERED_5E.limit).toBe(100);
        expect(STANDARD_6E.limit).toBe(75);
    });

    /**
     * **6E abolished Normal Characteristic Maxima.** There are no characteristic maxima in 6E, so
     * there is nothing to take a complication for — yet three of the four 5E packages carry NCM at a
     * flat 20, a fifth of the whole limit.
     *
     * It is also the one entry in the 5E data with a hardcoded `basecost` and no template, which is
     * exactly how it would have got away with coming along: the edition guards catch a trait the
     * template lacks, and NCM never had one in either edition.
     */
    it('carries no Normal Characteristic Maxima', () => {
        for (const [label, set] of cases) {
            const ncm = (build(set).disadvantages as Obj[]).filter((disadvantage) => String(disadvantage.xmlid).toUpperCase() === 'NCM');

            expect({label, ncm: ncm.length}).toEqual({label, ncm: 0});
        }

        // ...and the 5E packages do, which is what 20 of their 100 was.
        const fifth = COMPLICATION_SETS_5E.flatMap((set) => Object.values(set.disadvantages).flat() as Obj[]);
        expect(fifth.some((disadvantage) => String(disadvantage.xmlid).toUpperCase() === 'NCM')).toBe(true);
    });

    it.each(cases)('%s uses only complications this edition actually has', (_label, set) => {
        const template = getTemplate(STANDARD_6E.template) as unknown as {disadvantages?: {disad?: Obj[]}};
        const known = new Set((template.disadvantages?.disad ?? []).map((entry) => String(entry.xmlid).toUpperCase()));

        const unknown = (build(set).disadvantages as Obj[]).map((entry) => String(entry.xmlid).toUpperCase()).filter((id) => !known.has(id));

        expect(unknown).toEqual([]);
    });

    it.each(cases)('%s takes nothing for free', (_label, set) => {
        expect(rows(build(set)).filter((row) => row.cost === 0)).toEqual([]);
    });

    it('carries the description in `input`, so the sheet can name it', () => {
        for (const [label, set] of cases) {
            const unnamed = (build(set).disadvantages as Obj[]).filter((disadvantage) => typeof disadvantage.input !== 'string');

            expect({label, unnamed: unnamed.length}).toEqual({label, unnamed: 0});
        }
    });

    it('prices each complication the way the rules do', () => {
        const byLabel = new Map(rows(build(COMPLICATION_SETS_6E[0])).map((row) => [row.label, row.cost]));

        expect(byLabel.get('Loved One')).toBe(10); // Appears 8- (5) + Normal usefulness (5)
        expect(byLabel.get('Arch Enemy')).toBe(10); // 8- (0) + As Powerful (10)
        expect(byLabel.get('Evil Organization')).toBe(15); // 8- (0) + More Powerful (15)
        expect(byLabel.get('Code Of The Hero')).toBe(20); // Very Common (15) + Strong (5)
        expect(byLabel.get('Secret Identity')).toBe(10); // Occasionally (5) + Major (5)
    });

    it('states no cost anywhere in the data — every price is derived', () => {
        expect(JSON.stringify(COMPLICATION_SETS_6E)).not.toContain('"cost"');
    });
});
