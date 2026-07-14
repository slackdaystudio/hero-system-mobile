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
 * Movement totals + non-combat multipliers, ported from the legacy sheet's
 * `getMovementTotal`/`getTotalNcm` (which lived in a React component, so it has
 * no legacy lib to golden-master against). These lock the port against concrete
 * values computed over real corpus characters — covering base movement, 6E power
 * additions, 5E leaping's STR bonus, and IMPROVEDNONCOMBAT multipliers.
 */
import {heroDesignerCharacter as hd} from 'core/hero';
import type {Obj} from 'core/traits';

const load = (fixture: string): Obj => {
    const character = hd.getCharacter(JSON.parse(JSON.stringify(require(`./fixtures/${fixture}.json`))) as never) as unknown as Obj;
    character.showSecondary = false;
    return character;
};

const mode = (character: Obj, shortName: string): Obj => (character.movement as Obj[]).find((m) => m.shortName === shortName)!;

describe('movement totals', () => {
    it('returns base movement when no powers modify it (6E)', () => {
        const defensor = load('defensor');
        expect(hd.isFifth(defensor)).toBe(false);

        expect(hd.getMovementTotal(mode(defensor, 'Running'), defensor)).toBe(12);
        expect(hd.getMovementTotal(mode(defensor, 'Swimming'), defensor)).toBe(4);
        expect(hd.getTotalNcm(mode(defensor, 'Running'), defensor)).toBe(2);
    });

    it('adds a 6E movement-boosting power to the base', () => {
        const warlord = load('warlord-warbird-cv1');
        // Running base 12 + a +2 movement power = 14.
        expect(hd.getMovementTotal(mode(warlord, 'Running'), warlord)).toBe(14);
    });

    it('applies the 5E leaping STR bonus over the base', () => {
        const fred = load('no-figured-fred');
        expect(hd.isFifth(fred)).toBe(true);
        // Leaping base 2 + STR bonus, well above the raw value of 2.
        expect(hd.getMovementTotal(mode(fred, 'Leaping'), fred)).toBe(8);
    });

    it('raises NCM via IMPROVEDNONCOMBAT and totals boosted movement (5E)', () => {
        const spyder = load('spyder2022');
        expect(hd.getMovementTotal(mode(spyder, 'Running'), spyder)).toBe(41);
        expect(hd.getMovementTotal(mode(spyder, 'Swimming'), spyder)).toBe(67);
        expect(hd.getTotalNcm(mode(spyder, 'Swimming'), spyder)).toBe(4);
    });

    it('formats a fractional total with a trailing ½', () => {
        const bridget = load('bridget');
        expect(hd.getMovementTotal(mode(bridget, 'Leaping'), bridget)).toBe(2.5);
        expect(hd.getMovementTotal(mode(bridget, 'Leaping'), bridget, true)).toBe('2½');
    });
});
