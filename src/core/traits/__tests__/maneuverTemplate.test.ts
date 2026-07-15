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
 * Correctness test for H4 (docs/KNOWN_DEVIATIONS.md) — `Maneuver.roll()` used to throw
 * `Cannot read properties of undefined (reading 'doesdamage')` on a maneuver carrying a
 * `template` property whose *value* is `undefined`. The guard tested the property's
 * presence, not its value.
 *
 * The maneuver templates are keyed by display name and there are 53 of them, so any
 * hand-named maneuver — `tazimmaad`'s JAB is the corpus' only one — resolves to `undefined`
 * and crashed the roll. Legacy throws identically, so it is not the oracle here: the
 * expected value below is the delegated roll, which is what a *resolved* template would
 * also yield for this maneuver (JAB is `useweapon: true`, and the damage branch requires
 * `!useweapon`). The decorator golden master skips exactly this trait's roll — see
 * `H4_ROLL_DIVERGENCE` there.
 */
import {heroDesignerCharacter, type ParsedCharacter} from 'core/hero';
import {characterTraitDecorator} from 'core/traits';
import {flatten} from 'core/util';

type Obj = Record<string, any>;

jest.mock('../../../../../hero-system-mobile/App', () => ({getRandomNumber: () => 1}));
jest.mock('../../../../../hero-system-mobile/src/lib/Statistics', () => ({statistics: {add: () => Promise.resolve()}}));

const heroOf = (fixture: string): Obj =>
    heroDesignerCharacter.getCharacter(JSON.parse(JSON.stringify(require(`../../hero/__tests__/fixtures/${fixture}.json`))) as ParsedCharacter) as unknown as Obj;

const maneuvers = (character: Obj): Obj[] => flatten(character.martialArts as Obj[], 'maneuver') as Obj[];

describe('H4 — a maneuver whose template did not resolve', () => {
    it("does not throw on tazimmaad's JAB, and delegates the roll", () => {
        const tazimmaad = heroOf('tazimmaad');
        const jab = maneuvers(tazimmaad).find((maneuver) => maneuver.xmlid === 'JAB')!;

        // The precondition the crash needed: the property is present, its value is not.
        expect(jab).toBeDefined();
        expect(Object.prototype.hasOwnProperty.call(jab, 'template')).toBe(true);
        expect(jab.template).toBeUndefined();
        expect(jab.effect).toBe('[NORMALDC] Strike');

        const decorated = characterTraitDecorator.decorate(jab, 'martialArts', () => tazimmaad);

        expect(() => decorated.roll()).not.toThrow();
        expect(decorated.roll()).toBeNull();
    });

    it('gives JAB the same roll its resolved-template siblings get', () => {
        // Every one of tazimmaad's damage-capable maneuvers is useweapon: true, so the
        // unarmed-damage branch declines them all and they delegate. JAB now agrees.
        const tazimmaad = heroOf('tazimmaad');
        const rolls = maneuvers(tazimmaad).map((maneuver) => characterTraitDecorator.decorate(maneuver, 'martialArts', () => tazimmaad).roll());

        expect(rolls.every((roll) => roll === null)).toBe(true);
    });

    it('still rolls damage for a maneuver whose template does resolve', () => {
        // The guard must not silence a working maneuver: aoe's Choke Hold is useweapon: false
        // with doesdamage: true, so it keeps its damage roll.
        const aoe = heroOf('aoe');
        const chokeHold = maneuvers(aoe).find((maneuver) => maneuver.xmlid === 'CHOKE_HOLD')!;

        expect(chokeHold.template).toBeDefined();

        const roll = characterTraitDecorator.decorate(chokeHold, 'martialArts', () => aoe).roll();

        expect(roll).not.toBeNull();
        expect(roll!.roll).toBeTruthy();
    });

    it('delegates rather than throwing for a hand-built unresolved maneuver', () => {
        // The corpus has exactly one of these, so pin the shape directly too: a Hand To Hand
        // maneuver that would otherwise take the damage branch (useweapon: false), but whose
        // template never resolved.
        const aoe = heroOf('aoe');
        const unresolved: Obj = {
            xmlid: 'HAYMAKER_OF_THEIRS',
            name: 'A maneuver nobody templated',
            type: 'maneuver',
            template: undefined,
            effect: '[NORMALDC] Strike',
            category: 'Hand To Hand',
            useweapon: false,
            ocv: 0,
            dcv: 0,
            phase: '1/2',
        };

        expect(Object.prototype.hasOwnProperty.call(unresolved, 'template')).toBe(true);

        const decorated = characterTraitDecorator.decorate(unresolved, 'martialArts', () => aoe);

        expect(() => decorated.roll()).not.toThrow();
        expect(decorated.roll()).toBeNull();
    });
});
