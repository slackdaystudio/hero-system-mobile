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
 * The 6E powersets, held to two separate standards.
 *
 * **It spends its budget** — the points the archetype's characteristics leave of the 400. That is
 * arithmetic, and the engine settles it.
 *
 * **It is balanced** — within ±10% of the Rule of X. That is the one that matters, and the one the
 * 5E work never had: two archetypes can both spend exactly 400 and be nowhere near each other. This
 * is Phil's own model (`core/random/ruleOfX`, ported from his spreadsheet) doing the judging.
 *
 * Neither is asserted from the data. The engine prices every power, and the Rule of X reads the
 * finished character — so a powerset cannot pass here by declaring anything about itself.
 */
import {heroDesignerCharacter} from 'core/hero';
import {getTemplate} from 'core/templates';
import {characterTraitDecorator, type Obj} from 'core/traits';
import {ARCHETYPES_6E, characteristicsBudget} from '../allocate';
import {buildCharacteristics} from '../characteristics';
import {STANDARD_6E} from '../powerLevel';
import {attachPowerset, POWERSETS_6E, type Powerset} from '../powerset';
import {deviation, isBalanced} from '../ruleOfX';
import {ruleOfXStats} from '../ruleOfXStats';

/** What the 6E skillsets will cost. Real 400-point characters spend 30–69; the corpus median is 59. */
const SKILLS_BUDGET = 50;

const authored = Object.entries(POWERSETS_6E).filter(([name]) => !name.startsWith('_'));

const cases = authored.flatMap(([name, sets]) => sets.map((set) => [name, set.label, set] as const));

const build = (name: string, set: Powerset): Obj => {
    const archetype = ARCHETYPES_6E.find((candidate) => candidate.name === name)!;

    return heroDesignerCharacter.getCharacter(attachPowerset(buildCharacteristics(archetype.characteristics, STANDARD_6E.template, name), set)) as unknown as Obj;
};

const budgetFor = (name: string): number => {
    const archetype = ARCHETYPES_6E.find((candidate) => candidate.name === name)!;

    return STANDARD_6E.total - characteristicsBudget(archetype, STANDARD_6E) - SKILLS_BUDGET;
};

/**
 * What the powerset costs — powers **and** martial maneuvers.
 *
 * Maneuvers are not powers: a `.hdc` keeps them in their own bucket. But their cost comes out of the
 * powers balance, which is the 5E precedent too (the legacy prose folds them into `powersCost` —
 * Martial Artist's 115 is powers 100 + maneuvers 15). Counting only `powers` reads the Martial
 * Artist 41 points under.
 */
const powersSpent = (character: Obj): number =>
    (['powers', 'martialArts'] as const).reduce(
        (total, key) =>
            total +
            ((character[key] ?? []) as Obj[]).reduce((sum, trait) => {
                try {
                    return sum + characterTraitDecorator.decorate(trait, key, () => character).realCost();
                } catch {
                    return sum;
                }
            }, 0),
        0,
    );

describe('6E powersets', () => {
    it('is authored against archetypes that exist', () => {
        expect(authored.every(([name]) => ARCHETYPES_6E.some((archetype) => archetype.name === name))).toBe(true);
    });

    it.each(cases)('%s / %s spends its powers budget exactly', (name, _label, set) => {
        expect(powersSpent(build(name, set))).toBe(budgetFor(name));
    });

    /**
     * The check the 5E generator never had. Spending 400 is not balance — Phil's model is what says
     * whether the finished character is in line with the campaign, and his guidance is ±10%.
     */
    it.each(cases)('%s / %s lands inside the Rule of X', (name, _label, set) => {
        const stats = ruleOfXStats(build(name, set));

        expect({label: _label, deviation: Math.round(deviation(stats))}).toEqual({label: _label, deviation: expect.any(Number)});
        expect(isBalanced(stats)).toBe(true);
    });

    /**
     * A power the edition doesn't have resolves to no template and prices at **zero** — silently.
     * Lack Of Weakness is the one that caught this: a 5E power, deleted in 6E, that sat in the
     * Brick's set costing nothing and reading as authored. Nothing else here would notice; the
     * budget test only fails if the total drifts, and the Rule of X can't see a power that isn't a
     * combat stat.
     */
    it.each(cases)('%s / %s uses only powers this edition actually has', (name, _label, set) => {
        const character = build(name, set);
        const template = getTemplate(STANDARD_6E.template) as unknown as {powers?: Record<string, unknown>; characteristics?: Record<string, unknown>};

        // Movement bought as a power (Leaping, Flight) resolves against the *characteristic*
        // template, not the power one — which is exactly why Leaping prices correctly at 1 point
        // per 2m while Lack Of Weakness, in neither, priced at nothing.
        const known = new Set([...Object.keys(template.powers ?? {}), ...Object.keys(template.characteristics ?? {})].map((key) => key.toUpperCase()));

        // GENERIC_OBJECT is the framework container itself and has no template of its own.
        const unknown = (character.powers as Obj[]).map((power) => String(power.xmlid).toUpperCase()).filter((id) => id !== 'GENERIC_OBJECT' && !known.has(id));

        expect(unknown).toEqual([]);
    });

    it.each(cases)('%s / %s buys nothing for free', (name, _label, set) => {
        // The other half of the same trap: a power that costs 0 is either a data error or a power
        // that isn't there. Framework containers are priced by their reserve, so they're real.
        const character = build(name, set);
        const free = (character.powers as Obj[])
            .filter((power) => {
                try {
                    return characterTraitDecorator.decorate(power, 'powers', () => character).realCost() === 0;
                } catch {
                    return true;
                }
            })
            .map((power) => String(power.xmlid));

        expect(free).toEqual([]);
    });

    /**
     * A standing rule, and Phil's reason is design rather than mechanics: multipowers are better for
     * new players, and a VPP is a character killer — "there's not much to want for when you have
     * one". A generated character is somebody's first character more often than not.
     *
     * It's also mechanically necessary (VPP contents are inert until allocated — H5 — so they'd be
     * invisible to the Rule of X), but that's the lesser reason: it would still be the right call if
     * the mechanics changed.
     */
    it('gives nobody a VPP', () => {
        expect(JSON.stringify(POWERSETS_6E)).not.toContain('"vpp"');
        expect(JSON.stringify(POWERSETS_6E).toUpperCase()).not.toContain('VARIABLEPOWERPOOL');
    });

    it('states no cost anywhere in the data — every price is the engine’s', () => {
        expect(JSON.stringify(POWERSETS_6E)).not.toContain('"cost"');
        expect(JSON.stringify(POWERSETS_6E)).not.toContain('"powersCost"');
    });

    describe('Energy Projector / Energy Blaster', () => {
        /**
         * Built against starborne, the corpus's own 400-point blaster, and it lands on the
         * campaign's own numbers: a 12d6 Blast is exactly the baseline's DC 12 and oAP 60, and the
         * Resistant Protection carries the defences to the baseline's DEF 26.
         */
        it('hits the campaign baseline where a blaster should', () => {
            const stats = ruleOfXStats(build('Energy Projector', POWERSETS_6E['Energy Projector'][0]));

            expect({dc: stats.dc, oap: stats.oap}).toEqual({dc: 12, oap: 60}); // baseline: 12 / 60
            expect(stats.def).toBe(26); // baseline: 26
            expect(stats.velocity).toBe(40); // baseline: 40 — Flight is 1 point per metre in 6E
        });

        it('carries the defences on a power, not on its characteristics', () => {
            // The spread buys PD/ED 8 each and Resistant Protection adds the other 18. A 6E hero
            // who bought DEF 26 outright would have nothing left for anything else.
            const archetype = ARCHETYPES_6E.find((candidate) => candidate.name === 'Energy Projector')!;
            const character = build('Energy Projector', POWERSETS_6E['Energy Projector'][0]);

            expect(archetype.characteristics.pd).toBe(8);
            // getCharacteristicTotal is the engine's *total* — powers included, which is its job.
            expect(heroDesignerCharacter.getCharacteristicTotal('pd', {...character, showSecondary: true})).toBe(26);
            expect(ruleOfXStats(character).def).toBe(26);
        });
    });
});
