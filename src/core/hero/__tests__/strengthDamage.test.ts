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
 * `getStrengthDamage` — the Normal Damage a character's bare STR does.
 *
 * **Closing a port gap.** The legacy app showed this under STR on the sheet
 * (`Characteristics.js` `getStrengthDamage()`); the rebuild never did, which left a Brick unable to
 * roll his own punch. The rule is lifted, but legacy is **not the oracle** here — it computed this
 * in a sheet component, not the engine, so it was never golden-mastered and nothing depends on its
 * output. The oracle below is the HERO STR table itself.
 */
import {heroDesignerCharacter} from '../heroDesignerCharacter';
import type {Obj} from 'core/traits';
import jackDiamond from './fixtures/jack-diamond.json';

/**
 * A built character carrying nothing but a STR.
 *
 * Shaped from what `getCharacter()` actually emits, not from what a `.hdc` looks like — the two are
 * different, and `definition` is load-bearing despite reading like prose: `isFifth()` decides the
 * edition by asking whether `characteristics[0].definition` starts with "(Hero System Fifth
 * Edition". Omit it and every read throws.
 */
const withStrength = (value: number): Obj =>
    ({
        characteristics: [{type: 1, name: 'Strength', shortName: 'STR', value, cost: 0, base: 10, definition: 'Strength', roll: true, ncm: null}],
        powers: [],
        showSecondary: true,
    } as unknown as Obj);

const damageAt = (strength: number): string => heroDesignerCharacter.getStrengthDamage(withStrength(strength));

describe('getStrengthDamage', () => {
    it('reads the STR the sheet shows', () => {
        // Sanity: if this drifts, every expectation below is measuring the wrong thing.
        expect(heroDesignerCharacter.getCharacteristicTotal('STR', withStrength(60))).toBe(60);
    });

    /** A real character out of the corpus, not a fixture I shaped to agree with me. */
    it('punches for 12d6 on a real Brick', () => {
        const jack = heroDesignerCharacter.getCharacter(jackDiamond as never) as unknown as Obj;

        // jack-diamond is the 400-point Brick the 6E archetype was benchmarked against.
        expect(heroDesignerCharacter.getCharacteristicTotal('STR', jack)).toBe(61);
        expect(heroDesignerCharacter.getStrengthDamage(jack)).toBe('12d6');
    });

    /**
     * **The HERO STR table, which is the oracle.** 5 STR is 1d6; 3 or 4 STR beyond that is a half
     * die; 1 or 2 beyond is nothing. Every published entry, verbatim.
     */
    it.each([
        [0, '0d6'],
        [5, '1d6'],
        [8, '1½d6'],
        [10, '2d6'],
        [13, '2½d6'],
        [15, '3d6'],
        [18, '3½d6'],
        [20, '4d6'],
        [23, '4½d6'],
        [25, '5d6'],
        [30, '6d6'],
        [40, '8d6'],
        [50, '10d6'],
        [60, '12d6'],
        [70, '14d6'],
        [100, '20d6'],
    ])('STR %i punches for %s', (strength, expected) => {
        expect(damageAt(strength)).toBe(expected);
    });

    /** Phil's Brick, and the reason this exists at all. */
    it('gives a 60 STR Brick his 12d6', () => {
        expect(damageAt(60)).toBe('12d6');
    });

    describe('the half-die threshold', () => {
        /**
         * The `>= 0.6` rule, walked one point at a time across a single die. `STR / 5` leaves .6 or
         * .8 exactly when the remainder is 3 or 4 — which is the whole content of the rule, and the
         * easiest thing to get wrong by rounding instead of truncating.
         */
        it.each([
            [10, '2d6'],
            [11, '2d6'],
            [12, '2d6'],
            [13, '2½d6'],
            [14, '2½d6'],
            [15, '3d6'],
        ])('STR %i is %s', (strength, expected) => {
            expect(damageAt(strength)).toBe(expected);
        });

        it('rounds down, never up — 14 STR is not 3d6', () => {
            expect(damageAt(14)).not.toBe('3d6');
            expect(damageAt(19)).not.toBe('4d6');
        });

        it('never emits a bare half or a fraction', () => {
            for (let strength = 0; strength <= 120; strength++) {
                expect(damageAt(strength)).toMatch(/^\d+(½)?d6$/);
            }
        });
    });

    /**
     * Legacy's guard was `fractionalPart > 0.0`, so a negative STR fell past every branch and the
     * raw float was interpolated: STR -3 printed **"-0.6d6"**. Deliberately not preserved — see the
     * clamp in `getStrengthDamage`.
     */
    it('does not punch for negative dice', () => {
        expect(damageAt(-3)).toBe('0d6');
        expect(damageAt(-10)).toBe('0d6');
        expect(damageAt(0)).toBe('0d6');
    });

    /**
     * It has to punch with the STR the engine totals, not the one written on the characteristic —
     * a power that grants STR moves the punch, which is exactly what a Brick's Density Increase does.
     */
    it('follows the engine’s total, not the raw characteristic', () => {
        const jack = heroDesignerCharacter.getCharacter(jackDiamond as never) as unknown as Obj;
        const total = heroDesignerCharacter.getCharacteristicTotal('STR', jack);

        expect(heroDesignerCharacter.getStrengthDamage(jack)).toBe(`${Math.trunc(total / 5)}d6`);

        // ...and moving the total moves the punch.
        const stronger = {...jack, characteristics: (jack.characteristics as Obj[]).map((c) => (String(c.shortName) === 'STR' ? {...c, value: 75} : c))};

        expect(heroDesignerCharacter.getStrengthDamage(stronger)).toBe('15d6');
    });
});
