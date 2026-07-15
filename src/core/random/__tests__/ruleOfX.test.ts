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
 * The Rule of X, checked against the spreadsheet it was ported from.
 *
 * `Rule of X.xlsx` carries twelve characters on its "400pt (SAMPLE)" sheet with their stats **and**
 * the X Excel computed for each. That makes it a true oracle: these are not numbers restated from
 * the implementation, they are Excel's own output, and any disagreement is this port being wrong.
 *
 * The cast is the published Champions one — Defender, Ironclad, Ogre, Witchcraft and company — so
 * the fixtures double as a sanity check that the model says sensible things about real characters.
 */
import {CAMPAIGN_400, deviation, isBalanced, ruleOfX, TOLERANCE, type RuleOfXStats} from '../ruleOfX';

/** A row off the sheet, in its column order: EGO CON DEX SPD CSL OCV DCV OMCV DMCV DC oAP DEF rDEF STUN BODY dAP Velocity. */
const row = (...values: number[]): RuleOfXStats => {
    const [ego, con, dex, spd, csl, ocv, dcv, omcv, dmcv, dc, oap, def, rdef, stun, body, dap, velocity] = values;

    return {ego, con, dex, spd, csl, ocv, dcv, omcv, dmcv, dc, oap, def, rdef, stun, body, dap, velocity};
};

/** Character, stats, and the X Excel put in column S. */
const SHEET: Array<readonly [string, RuleOfXStats, number]> = [
    ['John Everyplayer', row(13, 20, 24, 5, 2, 8, 8, 3, 4, 12, 60, 26, 17, 40, 10, 30, 40), 100],
    ['Defender', row(15, 30, 25, 5, 2, 8, 8, 4, 5, 12, 60, 20, 15, 32, 10, 30, 40), 101.0144419],
    ['Ironclad', row(10, 30, 18, 5, 4, 7, 6, 3, 3, 12, 30, 25, 23, 60, 15, 15, 40), 100.7768665],
    ['Kinetic', row(14, 23, 26, 7, 0, 10, 10, 4, 4, 9, 30, 15, 6, 30, 10, 24, 40), 94.71282051],
    ['Sapphire', row(14, 23, 23, 6, 0, 8, 8, 4, 4, 12, 60, 23, 12, 36, 10, 36, 30), 96.86361237],
    ['Witchcraft', row(23, 18, 18, 5, 2, 6, 7, 8, 8, 9, 60, 15, 10, 30, 10, 30, 30), 101.9302036],
    ['Ogre', row(10, 33, 20, 4, 3, 6, 6, 3, 3, 13, 20, 27, 27, 74, 20, 34, 46), 104.5961161],
    ['Arrowhead', row(10, 18, 25, 6, 3, 12, 8, 3, 4, 12, 60, 16, 8, 40, 13, 24, 40), 100.001546],
    ['Black Harlequin', row(19, 20, 24, 5, 0, 8, 7, 3, 6, 8, 60, 16, 8, 40, 10, 24, 22), 89.70995475],
    ['Esper', row(43, 20, 18, 5, 0, 5, 7, 8, 8, 5, 50, 19, 10, 40, 18, 24, 12), 103.0032051],
    ['Green Dragon', row(14, 18, 29, 7, 2, 13, 11, 4, 4, 13, 0, 10, 8, 40, 15, 12, 18), 107.6005279],
    ['Shrinker', row(10, 25, 20, 5, 0, 8, 23, 3, 4, 18, 80, 13, 3, 30, 10, 40, 32), 112.8834087],
];

describe('ruleOfX — against the spreadsheet it came from', () => {
    it.each(SHEET)('%s scores what Excel scored it', (_name, stats, expected) => {
        expect(ruleOfX(stats)).toBeCloseTo(expected, 6);
    });

    it('is exactly 100 at the baseline, though the weights total 120', () => {
        // DC and oAP are alternatives — one or the other scores, never both — so 20 of the 120 is
        // never counted at once. That is what lands the baseline on a round 100.
        expect(ruleOfX(CAMPAIGN_400.baseline)).toBe(100);
        expect(Object.values(CAMPAIGN_400.weights).reduce((total, weight) => total + weight, 0)).toBe(120);
        expect(CAMPAIGN_400.weights.dc).toBe(CAMPAIGN_400.weights.oap);
    });

    it('reports the same +/- % the sheet does', () => {
        // Column T: S26/X*100-100.
        expect(deviation(SHEET[3][1])).toBeCloseTo(-5.287179487, 6); // Kinetic
        expect(deviation(SHEET[11][1])).toBeCloseTo(12.88340875, 6); // Shrinker
        expect(deviation(CAMPAIGN_400.baseline)).toBe(0);
    });

    it('flags exactly the two the sheet flags', () => {
        // Phil's rule: within +/-10%. Of the published cast only Shrinker (+12.9) and Black
        // Harlequin (-10.3) fall outside it, and both are meant to.
        const outside = SHEET.filter(([, stats]) => !isBalanced(stats)).map(([name]) => name);

        expect(outside).toEqual(['Black Harlequin', 'Shrinker']);
        expect(TOLERANCE).toBe(10);
    });

    describe('the two terms that are not a plain ratio', () => {
        /**
         * `IF(DC*5 > oAP, …)`: the attack is scored by DCs *or* by active points, whichever prices
         * it higher at 5 points per DC. Scoring oAP alone would read a Brick's 12d6 punch as free,
         * because STR is not a power and carries no active cost.
         */
        it('scores a STR-based attacker on its DCs, not its (absent) power', () => {
            const puncher = {...CAMPAIGN_400.baseline, dc: 14, oap: 0};
            const blaster = {...CAMPAIGN_400.baseline, dc: 12, oap: 60};

            // 14 DC * 5 = 70 > 0, so the DC term carries it.
            expect(ruleOfX(puncher)).toBeGreaterThan(ruleOfX(blaster));

            // ...and an advantaged attack is priced by its active points instead.
            expect(ruleOfX({...CAMPAIGN_400.baseline, dc: 12, oap: 90})).toBeGreaterThan(ruleOfX(blaster));
        });

        /**
         * dAP is multiplied by DCV × DEF × rDEF: defensive points are worth more to someone already
         * hard to hit and hard to hurt. It compounds, so it is where a defensive stack runs away.
         */
        it('compounds defensive active points against how hard the character already is to hurt', () => {
            const tough = {...CAMPAIGN_400.baseline, dcv: 16, def: 52, rdef: 34};
            const doubled = {...CAMPAIGN_400.baseline, dcv: 16, def: 52, rdef: 34, dap: 60};

            // Doubling dAP on a doubled-defence character adds 8x the baseline term (2*2*2 * 5*2),
            // not 5 — that is the compounding, and it is deliberate.
            expect(ruleOfX(doubled) - ruleOfX(tough)).toBeCloseTo(40, 6);
        });
    });

    it('scores a 225pt character against its own campaign, not the 400pt one', () => {
        // Same weights, lower baselines: a 225pt hero at its own baseline is 100 there and would
        // read badly under-powered against a 400pt campaign.
        const {CAMPAIGN_225} = jest.requireActual<typeof import('../ruleOfX')>('../ruleOfX');

        expect(ruleOfX(CAMPAIGN_225.baseline, CAMPAIGN_225)).toBe(100);
        expect(deviation(CAMPAIGN_225.baseline, CAMPAIGN_400)).toBeLessThan(-25);
    });
});
