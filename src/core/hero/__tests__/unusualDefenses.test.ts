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
 * Correctness tests for H6 and H7 (docs/KNOWN_DEVIATIONS.md) — the unusual-defense totals
 * (Mental / Power / Flash). Legacy is wrong for every case here, so it is not the oracle:
 * the expected values were confirmed against the HERO rules with Phil, and the golden master
 * skips exactly these queries (see `UNUSUAL_DEFENSE_DIVERGENCE` there).
 *
 *   H6 — a repeated xmlid is collapsed into an array by `toMap`, and
 *        `getUnusualDefensePoints` had no array branch, so `.levels` read `undefined` and
 *        *every* one of the duplicates contributed 0.
 *   H7 — Resistant Protection (FORCEFIELD) fed its **mental** defense into every
 *        unusual-defense total regardless of which was asked for.
 *
 * The rule these encode: Resistant Protection contributes to each unusual defense through
 * the field matching that defense (`mdlevels` → Mental, `powdlevels` → Power). There is no
 * `flashlevels` field in the HERO Designer data, so it contributes nothing to Flash.
 */
import {heroDesignerCharacter as hd, type ParsedCharacter} from 'core/hero';

type Obj = Record<string, any>;

const heroOf = (fixture: string, showSecondary = true): Obj => {
    const character = hd.getCharacter(JSON.parse(JSON.stringify(require(`./fixtures/${fixture}.json`))) as ParsedCharacter) as unknown as Obj;
    character.showSecondary = showSecondary;

    return character;
};

describe('H6 — duplicated unusual-defense powers contribute', () => {
    describe('defensor', () => {
        // He buys Power Defense twice, as two standalone powers of 10 and 5, and legacy gave
        // him none of it: `toMap` collapsed them and `.levels` read undefined off the array.
        it('sums both Power Defense powers, plus each Resistant Protection\'s powdlevels', () => {
            // 10 + 5 (the two powers) + 5 (Resistant Protection, levels 20 split 5/5/5/5)
            // + 5 (the compound power's Resistant Protection, levels 10 split 5 pd / 5 powd).
            expect(hd.getTotalUnusualDefense(heroOf('defensor'), 'POWERDEFENSE')).toBe('25/15');
        });

        it('leaves Mental Defense at 15', () => {
            // 5 (standalone) + 5 (Resistant Protection mdlevels) + 5 (inside the compound).
            // Unchanged by the fix: Mental Defense is the one query the old mdlevels line got
            // right, and this power is not duplicated.
            expect(hd.getTotalUnusualDefense(heroOf('defensor'), 'MENTALDEFENSE')).toBe('15/10');
        });
    });

    it('sums m-championsmush\'s four Mental Defences held in plain list folders', () => {
        // 12 ("Defense Baseline") + 10 + 10 + 10 ("Psychic Shroud"). Both containers are
        // `originalType: 'list'` — organisational folders, not frameworks — so these stack.
        // Legacy dropped all four and reported 0.
        expect(hd.getTotalUnusualDefense(heroOf('m-championsmush'), 'MENTALDEFENSE')).toBe('42/0');
    });
});

describe('H8 — the unusual defenses obey the standard visibility rule', () => {
    // Legacy checked nothing here, so a secondary-only defence contributed in the base form
    // too — unlike every other total, and unlike `getDefense` on the compound-power path.
    // The rule: (affectsPrimary && affectsTotal) || (!affectsPrimary && affectsTotal && showSecondary).
    it('drops defensor\'s defences in the base form — every one of them is secondary-only', () => {
        const baseForm = heroOf('defensor', false);

        expect(hd.getTotalUnusualDefense(baseForm, 'POWERDEFENSE')).toBe('0/0');
        expect(hd.getTotalUnusualDefense(baseForm, 'MENTALDEFENSE')).toBe('0/0');
        expect(hd.getTotalUnusualDefense(baseForm, 'FLASHDEFENSE')).toBe('0/0');
    });

    it('keeps them in the alternate-ID form', () => {
        const altForm = heroOf('defensor');

        expect(hd.getTotalUnusualDefense(altForm, 'POWERDEFENSE')).toBe('25/15');
        expect(hd.getTotalUnusualDefense(altForm, 'MENTALDEFENSE')).toBe('15/10');
    });

    it('keeps a primary-affecting Resistant Protection in the base form', () => {
        // The rule must discriminate, not blanket-zero: adamantine's Resistant Protection is
        // affectsPrimary, so its 1 point of mental/power defence survives into the base form
        // while its secondary-only powers drop away.
        const baseForm = heroOf('adamantinerebuild210109', false);

        expect(hd.getTotalUnusualDefense(baseForm, 'MENTALDEFENSE')).toBe('1/1');
        expect(hd.getTotalUnusualDefense(baseForm, 'POWERDEFENSE')).toBe('1/1');

        // ...and the full totals still appear in the alternate-ID form.
        expect(hd.getTotalUnusualDefense(heroOf('adamantinerebuild210109'), 'MENTALDEFENSE')).toBe('10/1');
    });
});

describe('H7 — Resistant Protection feeds the defense it actually provides', () => {
    it('gives defensor no Flash Defense, having neither a Flash power nor flashlevels', () => {
        // Legacy reported 5/5 here — Resistant Protection's mdlevels, invented out of nothing.
        expect(hd.getTotalUnusualDefense(heroOf('defensor'), 'FLASHDEFENSE')).toBe('0/0');
    });

    it('gives adamantine no Flash Defense either', () => {
        // Legacy reported 1/1 from its Resistant Protection's mdlevels: it has no Flash power.
        expect(hd.getTotalUnusualDefense(heroOf('adamantinerebuild210109'), 'FLASHDEFENSE')).toBe('0/0');
    });

    it('still lets a real Flash Defense power through', () => {
        // The guard must not zero a defense a character actually bought.
        expect(hd.getTotalUnusualDefense(heroOf('twilight'), 'FLASHDEFENSE')).toBe('10/0');
        expect(hd.getTotalUnusualDefense(heroOf('starborne'), 'FLASHDEFENSE')).toBe('3/0');
    });

    it('keeps mental and power defense reading their own fields', () => {
        // venomenhancedxenovore has one of each, so the two must not cross-contaminate.
        const venom = heroOf('venomenhancedxenovore');

        expect(hd.getTotalUnusualDefense(venom, 'MENTALDEFENSE')).toBe('5/0');
        expect(hd.getTotalUnusualDefense(venom, 'POWERDEFENSE')).toBe('10/0');
    });
});
