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
 * Correctness test for H11 (docs/KNOWN_DEVIATIONS.md) — legacy's `HandToHandAttack.roll()` derived
 * `partialDie` from `levels + STR / 5`, used it in both adder branches, and then dropped it in the
 * `else`. An HA landing on `.6` or `.8` rendered `Nd6` where the rules say `N½d6`.
 *
 * **Legacy is wrong, so it is not the oracle.** The rule is the HERO damage table: 5 STR is 1d6 and
 * 3–4 STR beyond that is a half-die. Two sources in this engine already agree against the code and
 * disagree with nothing:
 *   - `Maneuver.getNormalDamage()` faces the identical sum (`dc + STR / 5`) and **keeps** the half
 *   - `heroDesignerCharacter.getStrengthDamage()` does the same for a bare punch
 *
 * **Latent, so the fixtures cannot be the oracle either.** The corpus has exactly one decodable HA
 * — `aoe`'s, at STR 57 — and it both sits at a remainder of `.4` (under the threshold) *and* carries
 * a `PLUSONEHALFDIE` adder, so it never reaches the broken branch at all. The trait below is
 * therefore a real one out of the corpus with its adder stripped and STR nudged: real template, real
 * decorator, only the inputs moved.
 */
import {heroDesignerCharacter, type ParsedCharacter} from 'core/hero';
import {characterTraitDecorator} from 'core/traits';
import {flatten} from 'core/util';

type Obj = Record<string, any>;

jest.mock('../../../../../hero-system-mobile/App', () => ({getRandomNumber: () => 1}));
jest.mock('../../../../../hero-system-mobile/src/lib/Statistics', () => ({statistics: {add: () => Promise.resolve()}}));

const heroOf = (fixture: string): Obj =>
    heroDesignerCharacter.getCharacter(JSON.parse(JSON.stringify(require(`../../hero/__tests__/fixtures/${fixture}.json`))) as ParsedCharacter) as unknown as Obj;

const walk = (items: Obj[]): Obj[] => items.flatMap((item) => [item, ...(Array.isArray(item.powers) ? walk(item.powers as Obj[]) : [])]);

/** `aoe`'s Hand-To-Hand Attack — the corpus's only decodable one, template and all. */
const realAttack = (): {attack: Obj; character: Obj} => {
    const character = heroOf('aoe');
    const attack = walk(flatten(character.powers as Obj[], 'powers') as Obj[]).find((power) => String(power.xmlid).toUpperCase() === 'HANDTOHANDATTACK')!;

    return {attack, character};
};

const withStrength = (character: Obj, strength: number): Obj => ({
    ...character,
    characteristics: (character.characteristics as Obj[]).map((entry) => (String(entry.shortName).toUpperCase() === 'STR' ? {...entry, value: strength} : entry)),
});

/** Roll `aoe`'s HA with the STR, `levels` and adders dialled to whatever the case needs. */
const rollOf = (strength: number, levels: number, adder: Obj[] = []): string => {
    const {attack, character} = realAttack();
    const hero = withStrength(character, strength);

    return characterTraitDecorator.decorate({...attack, levels, adder}, 'powers', () => hero).roll()!.roll;
};

describe('HandToHandAttack.roll — H11', () => {
    it('reads the STR it was given', () => {
        // Sanity: if this drifts, every expectation below is measuring the wrong thing.
        expect(heroDesignerCharacter.getCharacteristicTotal('STR', withStrength(realAttack().character, 60))).toBe(60);
    });

    /**
     * **The fix.** `levels + STR / 5` leaves `.6` or `.8` exactly when the remainder is 3 or 4 STR,
     * which the rules price at a half-die. Legacy printed the truncated dice and dropped it.
     */
    describe('keeps the half-die it computes', () => {
        it.each([
            // strength, levels, expected — no adders, so all of these take the fixed `else` branch.
            [63, 0, '12½d6'], // 12.6 — legacy: "12d6"
            [64, 0, '12½d6'], // 12.8 — legacy: "12d6"
            [13, 2, '4½d6'], //  4.6 — legacy: "4d6"
            [14, 2, '4½d6'], //  4.8 — legacy: "4d6"
            [8, 0, '1½d6'], //   1.6 — legacy: "1d6"
            [58, 1, '12½d6'], // 12.6 — legacy: "12d6"
        ])('STR %i + %i levels is %s', (strength, levels, expected) => {
            expect(rollOf(strength, levels)).toBe(expected);
        });
    });

    /** The other side of the threshold, which legacy already got right and must stay right. */
    describe('adds nothing below the threshold', () => {
        it.each([
            [60, 0, '12d6'], // 12.0 — exact
            [61, 0, '12d6'], // 12.2
            [62, 0, '12d6'], // 12.4
            [65, 0, '13d6'], // 13.0 — exact
            [10, 2, '4d6'], //   4.0 — exact
            [11, 2, '4d6'], //   4.2
            [12, 2, '4d6'], //   4.4
        ])('STR %i + %i levels is %s', (strength, levels, expected) => {
            expect(rollOf(strength, levels)).toBe(expected);
        });
    });

    /**
     * Three places in this engine turn `STR / 5` into damage dice. Before H11 they disagreed; the
     * point of the fix is that they now don't. An HA with no levels *is* a bare punch.
     */
    it('agrees with the bare punch, which is the same rule', () => {
        for (let strength = 0; strength <= 80; strength++) {
            const {character} = realAttack();
            const hero = withStrength(character, strength);

            expect({strength, hth: rollOf(strength, 0)}).toEqual({strength, hth: heroDesignerCharacter.getStrengthDamage(hero)});
        }
    });

    it('never emits a fraction or a bare half', () => {
        for (let strength = 0; strength <= 80; strength++) {
            expect(rollOf(strength, 1)).toMatch(/^\d+(½)?d6$/);
        }
    });

    /**
     * **The adder branches are untouched**, and deliberately so.
     *
     * `partialDie ? `${dice + 1}d6`` reads as "N½d6 plus another half is (N+1)d6", which is the
     * rules' `Nd6 → Nd6+1 → N½d6 → (N+1)d6` progression — but whether `+½d6` advances one step or
     * two is a rules question I have no independent source for, and no fixture exercises it. Pinned
     * as-is so a future change has to be deliberate rather than incidental.
     */
    describe('the adder branches, pinned as they are', () => {
        const halfDie = [{xmlid: 'PLUSONEHALFDIE'}];
        const pip = [{xmlid: 'PLUSONEPIP'}];

        it('leaves the corpus character exactly where it was', () => {
            const {attack, character} = realAttack();

            // aoe: STR 57, 1 level, PLUSONEHALFDIE -> 12.4, under the threshold. Unchanged by H11.
            expect(heroDesignerCharacter.getCharacteristicTotal('STR', character)).toBe(57);
            expect(characterTraitDecorator.decorate(attack, 'powers', () => character).roll()!.roll).toBe('12½d6');
        });

        it.each([
            // label, strength, levels, expected, adder — expected before adder so the title reads.
            ['+½d6', 60, 0, '12½d6', halfDie],
            ['+1 pip', 60, 0, '12d6+1', pip],
            ['+½d6', 63, 0, '13d6', halfDie], // on a half-die already: rolls up
            ['+1 pip', 63, 0, '13d6', pip], // on a half-die already: rolls up
        ])('%s on STR %i + %i levels is %s', (_label, strength, levels, expected, adder) => {
            expect(rollOf(strength, levels, adder)).toBe(expected);
        });
    });
});
