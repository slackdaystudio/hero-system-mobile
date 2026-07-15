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
 * Correctness tests for H3 and H5 (docs/KNOWN_DEVIATIONS.md) — the two places `core`
 * deliberately diverges from legacy. Legacy is wrong for every case below, so it is *not*
 * the oracle: each expected value is derived from the character's own data and the rules,
 * and the golden master skips exactly these cases (see `queryGoldenMaster.test.ts`).
 *
 *   H3 — duplicated powers were dropped from characteristic/defense totals, because
 *        `toMap` collapses a repeated xmlid into an array and the array branch tested the
 *        *array's* own (undefined) affectsPrimary/affectsTotal. Two Force Fields totalled zero.
 *   H5 — powers inside a Variable Power Pool were counted. A VPP holds prefabricated
 *        powers the player swaps between; none is active until points are allocated to it.
 */
import {heroDesignerCharacter as hd, type ParsedCharacter} from 'core/hero';

type Obj = Record<string, any>;

const heroOf = (fixture: string, showSecondary: boolean): Obj => {
    const character = hd.getCharacter(JSON.parse(JSON.stringify(require(`./fixtures/${fixture}.json`))) as ParsedCharacter) as unknown as Obj;
    character.showSecondary = showSecondary;

    return character;
};

const movement = (character: Obj, name: string): Obj => (character.movement as Obj[]).find((mode) => mode.name === name)!;

describe('H3 — duplicated powers contribute to totals', () => {
    describe('mark-li-v5a-433: two standalone Armors ("Hide" 5/5 + "Scales" 5/5)', () => {
        // Both are affectsPrimary: false, so they only apply in the alternate-ID form.
        it('sums both Armors into PD/ED in the alternate-ID form', () => {
            const markLi = heroOf('mark-li-v5a-433', true);

            // PD base 8 + (Hide 5 + Scales 5) = 18; ED base 6 + 10 = 16.
            expect(hd.getCharacteristicTotal('PD', markLi)).toBe(18);
            expect(hd.getCharacteristicTotal('ED', markLi)).toBe(16);
            expect(hd.getAdditionalCharacteristicPoints('PD', markLi)).toBe(10);
            expect(hd.getAdditionalCharacteristicPoints('ED', markLi)).toBe(10);
        });

        it('counts both Armors as resistant defense', () => {
            const markLi = heroOf('mark-li-v5a-433', true);

            // Armor is resistant by definition, so all 10 points are: legacy reported 8/0 and 6/0.
            expect(hd.getTotalDefense(markLi, 'PD', true)).toBe('18/10');
            expect(hd.getTotalDefense(markLi, 'ED', true)).toBe('16/10');
        });

        it('leaves the base (secret-ID) form alone', () => {
            const markLi = heroOf('mark-li-v5a-433', false);

            expect(hd.getTotalDefense(markLi, 'PD', true)).toBe('8/0');
            expect(hd.getTotalDefense(markLi, 'ED', true)).toBe('6/0');
        });
    });

    describe('junkyard: two Force Fields, only one of which applies', () => {
        it('counts "Armor Plates" (8/8) but not "Force Bubble" (affectsTotal: false)', () => {
            const junkyard = heroOf('junkyard', true);

            // PD/ED base 12 + Armor Plates 8 = 20, resistant 8. Force Bubble's 6/6 must not appear.
            expect(hd.getCharacteristicTotal('PD', junkyard)).toBe(20);
            expect(hd.getCharacteristicTotal('ED', junkyard)).toBe(20);
            expect(hd.getTotalDefense(junkyard, 'PD', true)).toBe('20/8');
            expect(hd.getTotalDefense(junkyard, 'ED', true)).toBe('20/8');
        });
    });
});

describe('H5 — Variable Power Pool contents never count toward totals', () => {
    // "The Power Cosmic" holds 8 Force Field configurations (Undercover 10/10, Heavy 20/20,
    // Hardened 17/17, Impenetrable 17/17, Anti-Physical 32/10, Subtle 10/10, Anti-Energy
    // 10/26, Core Shielding 0/0). The player allocates pool points to one; none is active
    // by default, so none may contribute. Summing them would read 118/116.
    it('excludes pooled Force Fields from defenses', () => {
        const mush = heroOf('m-championsmush', true);

        expect(hd.getTotalDefense(mush, 'PD', true)).toBe('2/0');
        expect(hd.getCharacteristicTotal('PD', mush)).toBe(2);
    });

    it('excludes pooled movement powers', () => {
        // adamantine's pool holds "Leap Tall Buildings..." (LEAPING 20). Its Leaping is the
        // 20 it buys outright — not 40.
        const adamantine = heroOf('adamantinerebuild210109', true);

        expect(hd.getMovementTotal(movement(adamantine, 'Leaping'), adamantine)).toBe(20);
    });

    it('still counts an identical power held outside a pool', () => {
        // The guard keys on pool membership, not on the power: mark-li's Armors are
        // unparented and must survive (see H3 above), while the pooled ones above do not.
        const markLi = heroOf('mark-li-v5a-433', true);

        expect(hd.getTotalDefense(markLi, 'PD', true)).toBe('18/10');
    });
});
