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
 * H12 (docs/KNOWN_DEVIATIONS.md) — a Skill Enhancer reduces each related Skill's cost by 1, to a
 * minimum of 1, but only for Skills the character pays for. Legacy applied the min-1 floor
 * unconditionally, so a *free* Skill under an enhancer (a native/everyman language, cost 0) was
 * charged 1. The corrected value here is derived from the HERO rules (a free Skill stays free) and
 * agrees with HERO Designer, which prices a native tongue at 0 with or without Linguist — legacy is
 * wrong at these three corpus characters, so it is not the oracle.
 */
import {heroDesignerCharacter as core, TRAIT_CHILD_KEYS} from 'core/hero';
import {withDescendants} from 'core/util';
import {characterTraitDecorator} from '../index';
import {CharacterTrait} from '../characterTrait';
import ModifierCalculator from '../modifierCalculator';

const clone = (name: string): any => JSON.parse(JSON.stringify(require(`../../hero/__tests__/fixtures/${name}.json`)));

/** The visible label a Language carries can live in `name`, `input`, or `alias` across the corpus. */
const findLanguage = (character: any, label: string): any =>
    // Under the enhancer, not beside it: a Skill Enhancer nests the skills it discounts (H2).
    withDescendants(character.skills as any[], TRAIT_CHILD_KEYS.skills).find((s: any) => s.xmlid === 'LANGUAGES' && [s.name, s.input, s.alias].includes(label));

/** A skill of the given base cost sitting under (or not under) a named parent, priced through ModifierCalculator. */
const pricedUnder = (basecost: number, parentXmlid: string | null): number => {
    const character = {skills: []};
    const inner = new CharacterTrait({xmlid: 'LANGUAGES', basecost, modifier: undefined}, 'skills', () => character);
    inner.parentTrait = parentXmlid === null ? undefined : {xmlid: parentXmlid};

    return new ModifierCalculator(inner).realCost();
};

describe('H12: skill enhancer clamp does not charge a free skill', () => {
    describe('the -1 / min-1 boundary (rules-derived)', () => {
        it('leaves a free (0-cost) skill at 0', () => {
            expect(pricedUnder(0, 'LINGUIST')).toBe(0);
        });

        it('floors a 1-cost skill at 1 (the reduction cannot drop below the minimum)', () => {
            expect(pricedUnder(1, 'LINGUIST')).toBe(1);
        });

        it('floors a 2-cost skill at 1', () => {
            expect(pricedUnder(2, 'LINGUIST')).toBe(1);
        });

        it('reduces a higher-cost skill by exactly 1', () => {
            expect(pricedUnder(5, 'LINGUIST')).toBe(4);
        });

        it('does not touch a free skill with no enhancer parent', () => {
            expect(pricedUnder(0, null)).toBe(0);
        });

        it('does not touch a paid skill with no enhancer parent', () => {
            expect(pricedUnder(5, null)).toBe(5);
        });
    });

    describe('corrected corpus values (were 1 under legacy, rules say 0)', () => {
        it.each([
            ['greyman', 'Mandaarian'],
            ['m-championsmush', 'Native'],
            ['twilight', 'English'],
        ])('%s: native language "%s" under Linguist is free', (name, language) => {
            const character: any = core.getCharacter(clone(name) as never);
            const skill = findLanguage(character, language);
            expect(skill).toBeDefined();

            const decorated = characterTraitDecorator.decorate(skill, 'skills', () => character);
            expect(decorated.activeCost()).toBe(0); // the language is free before the enhancer
            expect(decorated.realCost()).toBe(0); // ...and stays free after it (legacy charged 1)
        });
    });

    describe('control: a paid skill under an enhancer still gets its discount', () => {
        it('greyman: English (base 3) under Linguist costs 2', () => {
            const character: any = core.getCharacter(clone('greyman') as never);
            const english = findLanguage(character, 'English');
            const decorated = characterTraitDecorator.decorate(english, 'skills', () => character);
            expect(decorated.activeCost()).toBe(3);
            expect(decorated.realCost()).toBe(2);
        });
    });
});
