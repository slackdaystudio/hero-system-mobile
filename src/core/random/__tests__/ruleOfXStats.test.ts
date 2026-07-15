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
 * Reading the Rule of X off a real character.
 *
 * `ruleOfX` is checked against Excel; this can't be — the spreadsheet's inputs are prose for a human
 * ("the largest defensive power"), so the only honest oracle is real characters. The corpus has five
 * 400-point 6E ones, identifiable because they spend ~400 and take exactly 75 in complications, and
 * they were built by hand for play. If the extraction is sane they should score near 100.
 */
import fs from 'fs';
import path from 'path';
import {heroDesignerCharacter} from 'core/hero';
import type {Obj} from 'core/traits';
import {deviation, isBalanced, ruleOfX} from '../ruleOfX';
import {diceOf, ruleOfXStats} from '../ruleOfXStats';

const FIXTURES = path.join(__dirname, '../../hero/__tests__/fixtures');

const load = (name: string): Obj => heroDesignerCharacter.getCharacter(JSON.parse(fs.readFileSync(path.join(FIXTURES, `${name}.json`), 'utf8'))) as unknown as Obj;

describe('diceOf', () => {
    it('counts damage classes the way HERO does', () => {
        expect(diceOf('12d6')).toBe(12);
        expect(diceOf('12½d6')).toBe(12.5); // a half-die is half a DC
        expect(diceOf('3d6+1')).toBeCloseTo(3 + 1 / 3); // a pip is a third
        expect(diceOf('3d6-1')).toBeCloseTo(3 - 1 / 3);
    });

    it('reads nothing out of what isn’t a roll', () => {
        expect(diceOf(null)).toBe(0);
        expect(diceOf('-')).toBe(0);
        expect(diceOf('')).toBe(0);
    });
});

describe('ruleOfXStats — real 400-point characters', () => {
    /**
     * The one that matters. These are hand-built characters at the tier the spreadsheet models, so
     * a sane extraction puts them near its 100. They land -3.4% to -7.3%, which is the same
     * neighbourhood as the sheet's own cast (Kinetic -5.3%, Sapphire -3.1%).
     */
    it.each(['starborne', 'greyman', 'indigo-bunting', 'jack-diamond'])('%s scores inside the campaign tolerance', (name) => {
        const stats = ruleOfXStats(load(name));

        expect(isBalanced(stats)).toBe(true);
        expect(ruleOfX(stats)).toBeGreaterThan(90);
    });

    /**
     * **`showSecondary` is the whole ballgame**, and getting it wrong is silent.
     *
     * starborne's Resistant Protection is Only-In-Alternate-Identity — `affectsPrimary: false,
     * `affectsTotal: true` — so the engine rightly hides it out of costume, and the character reads
     * as having no defences at all. The spreadsheet says to assume "the highest possible values a
     * character can generate", and in costume is the highest.
     */
    it('reads a costumed hero in costume — OIHID defences count', () => {
        const stats = ruleOfXStats(load('starborne'));

        expect(stats.def).toBe(23); // (PD 20 + ED 26) / 2, with the OIHID Resistant Protection in
        expect(stats.rdef).toBe(15); // (12 + 18) / 2 — all of it from that one power

        // Read flat, the same character has PD 8 / ED 8 and no resistant defence whatsoever.
        expect(deviation(stats)).toBeGreaterThan(-10);
    });

    it('scores a Brick on its fists — DC without an attack power', () => {
        // jack-diamond has no attack power at all: STR 61 is the attack. Scoring oAP alone would
        // read a 12d6 punch as free, which is what the sheet's IF(DC*5 > oAP) exists to prevent.
        const stats = ruleOfXStats(load('jack-diamond'));

        expect(stats.oap).toBe(0);
        expect(stats.dc).toBe(12); // floor(61 / 5)
        expect(isBalanced(stats)).toBe(true);
    });

    it('finds the blaster’s biggest gun, not its first', () => {
        // starborne carries several attacks; the model wants the largest.
        const stats = ruleOfXStats(load('starborne'));

        expect(stats.oap).toBe(60);
        expect(stats.dc).toBe(12);
    });

    it('counts a Mentalist’s mental combat values and its Mental Defense', () => {
        const stats = ruleOfXStats(load('greyman'));

        expect({omcv: stats.omcv, dmcv: stats.dmcv}).toEqual({omcv: 8, dmcv: 8});
        expect(stats.ocv).toBe(3); // and it can barely punch, which the model should see
    });

    /**
     * Velocity comes from movement *powers*, not the movement rows.
     *
     * `character.movement` only ever carries Running/Swimming/Leaping — a Flight power never
     * reaches it. starborne would read velocity 12 (base Running) instead of 40 (its Flight).
     */
    it('sees a flying character’s Flight, not its walking speed', () => {
        expect(ruleOfXStats(load('starborne')).velocity).toBe(40);
        expect(ruleOfXStats(load('greyman')).velocity).toBe(26); // no Flight; its best is bought Running
    });

    /**
     * A known and deliberate gap, recorded rather than hidden.
     *
     * jane-fawn scores -27% because the model sees no attack: her Entangle is 60 active points but
     * is not `doesdamage`, so it counts for neither DC nor oAP, and her DC 3 is a bare punch. That
     * may be right — Entangle is control, not damage — or `oAP` may be meant to read "largest
     * offensive power" rather than "largest damaging one". It is Phil's model and Phil's call.
     */
    it('scores an Entangle specialist as unarmed — flagged, not fixed', () => {
        const stats = ruleOfXStats(load('jane-fawn'));

        expect(stats.oap).toBe(0);
        expect(stats.dc).toBe(3); // floor(STR 15 / 5)
        expect(isBalanced(stats)).toBe(false);
        expect(deviation(stats)).toBeLessThan(-25);
    });
});

describe('ruleOfXStats — 5E characters', () => {
    it('reads a 5E character through the same code path', () => {
        // Nothing here branches on edition: the characteristics and defences are asked of the
        // engine, so 5E's figured OCV/DCV arrive the same way 6E's bought ones do.
        const stats = ruleOfXStats(load('defensor'));

        expect(stats.ocv).toBeGreaterThan(0);
        expect(stats.dcv).toBeGreaterThan(0);
        expect(stats.spd).toBeGreaterThan(0);
    });
});
