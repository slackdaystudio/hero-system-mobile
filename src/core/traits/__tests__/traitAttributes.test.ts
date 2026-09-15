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
 * A power that does something must say what it does.
 *
 * From the field, against 2.9.0: "Ranged Attack shows a pressable die code on the card —
 * teleportation shows nothing", and Stretching printed no distance either. The cause was not
 * those two powers: **32 decorators had no `attributes()` at all**, because only `cost()` and
 * `roll()` were ever ported and only those two were ever compared. `attributes()` is the
 * writeup the card front prints, so a decorator without one renders a card with a name and
 * nothing else.
 *
 * `decorator.goldenMaster.test.ts` now compares `attributes()` against legacy across all 37
 * fixtures, which is the real safety net. This file is the narrower guard it cannot be: it
 * asserts the values *are there and are right*, with no legacy engine in the room — if the
 * oracle and the port ever went blank together, the golden master would still be green.
 */
import {heroDesignerCharacter, type ParsedCharacter} from 'core/hero';
import {characterTraitDecorator} from 'core/traits';
import {withDescendants} from 'core/util';

type Obj = Record<string, any>;

const heroOf = (fixture: string): Obj =>
    heroDesignerCharacter.getCharacter(
        JSON.parse(JSON.stringify(require(`../../hero/__tests__/fixtures/${fixture}.json`))) as ParsedCharacter,
    ) as unknown as Obj;

/** Every attribute the sheet would print for the first `xmlid` power in `fixture`. */
const attributesOf = (fixture: string, xmlid: string): Record<string, unknown> => {
    const character = heroOf(fixture);
    const trait = withDescendants(character.powers as Obj[], ['powers']).find((power) => String((power as Obj).xmlid).toUpperCase() === xmlid) as Obj;

    expect(trait).toBeDefined();

    const attributes = characterTraitDecorator.decorate(trait, 'powers', () => character).attributes();

    return Object.fromEntries(attributes.map((attribute) => [attribute.label, attribute.value]));
};

describe('movement powers print their distance', () => {
    it("gives Teleportation a combat and non-combat move, the bug's own example", () => {
        const teleport = attributesOf('adamantinerebuild210109', 'TELEPORTATION');

        // 5E, so inches; 20" non-combat is the default x2 with no Improved Noncombat adder.
        expect(teleport['Combat Move']).toBe('5"');
        expect(teleport['Non-Combat Move']).toBe('10"');
        expect(teleport['Max Combat']).toBe('12.0 km/h');
        expect(teleport['Max Non-Combat']).toBe('24.0 km/h');
    });

    it('adds the character s existing Leaping to the levels bought, and applies x64 Noncombat', () => {
        const leaping = attributesOf('adamantinerebuild210109', 'LEAPING');

        // The only mode that stacks on base movement. 5 levels of Improved Noncombat => 2^6.
        expect(leaping['Combat Move']).toBe('30"');
        expect(leaping['Non-Combat Move']).toBe('1920"');
    });

    it('measures a 6E mover in metres, not inches', () => {
        const flight = attributesOf('gravity-girl', 'FLIGHT');

        expect(String(flight['Combat Move'])).toMatch(/^\d+m$/);
        expect(String(flight['Non-Combat Move'])).toMatch(/^\d+m$/);
    });
});

describe('Stretching prints its reach', () => {
    it('gives a distance and a non-combat distance', () => {
        const stretching = attributesOf('mark-li-v5a-433', 'STRETCHING');

        expect(stretching.Distance).toBeDefined();
        expect(stretching['Non-Combat Distance']).toBeDefined();
        expect(String(stretching.Distance)).toMatch(/^\d+m$/);
    });
});

describe('the rest of the writeup half', () => {
    it('gives an attack the Dice line that sits beside its rollable damage', () => {
        // The card shows both: `roll()` folds in STR, `attributes()` prints what the power adds.
        expect(attributesOf('aoe', 'HKA').Dice).toBe('+1d6+1');
        expect(attributesOf('aoe', 'HANDTOHANDATTACK').Dice).toBe('+1½d6');
    });

    it('gives a Barrier its defenses, body and dimensions', () => {
        const barrier = attributesOf('fifth', 'FORCEWALL');

        expect(barrier['Physical Defense']).toBe(12);
        expect(barrier['Energy Defense']).toBe(12);
        expect(barrier.Body).toBe(0);
        expect(barrier.Dimensions).toBe('4" x 4"');
    });

    it('gives an Endurance Reserve its reserve and its recovery', () => {
        const reserve = attributesOf('fifth', 'ENDURANCERESERVE');

        expect(reserve.Reserve).toBe(100);
        expect(reserve.Recovery).toBe(10);
    });

    it('gives Density Increase every figured change it makes', () => {
        const density = attributesOf('di', 'DENSITYINCREASE');

        expect(Object.keys(density)).toEqual(expect.arrayContaining(['+40 STR', '25600 kg mass', '+8 PD/ED', '-16 KB']));
    });

    it('gives Entangle its defenses', () => {
        expect(attributesOf('adamantinerebuild210109', 'ENTANGLE')['PD/ED']).toBe('4/4');
    });

    it('gives a 5E Mental Defense the EGO/5 that 6E abolished', () => {
        // Bought points plus EGO/5 — the rule UnusualDefense exists for.
        expect(attributesOf('adamantinerebuild210109', 'MENTALDEFENSE').Points).toBe(9);
    });

    it('says whether a power reaches the character s totals', () => {
        expect(attributesOf('adamantinerebuild210109', 'FORCEFIELD')['Added to Primary']).toBe('');
    });
});

describe('H13 — a Multipower slot names its kind in its edition s own words', () => {
    /**
     * Legacy read `ultraSlot` off the wrapper, so every slot in the corpus labelled itself
     * "Fixed" whatever the trait said — the dead line that proved H13's terminology inverted.
     * Core reads the trait: 5E calls the fixed kind an **ultra** slot, 6E renamed it **fixed**.
     */
    it('labels a 5E ultra slot "Ultra", where legacy said "Fixed"', () => {
        expect(attributesOf('spyder2022', 'CLINGING')['Slot Type']).toBe('Ultra');
    });
});
