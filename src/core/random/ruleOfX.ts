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
 * The Rule of X — a character's combat effectiveness as one number.
 *
 * Ported from Phil's own `Rule of X.xlsx`, sheet "400pt (SAMPLE)". HS62.282 describes the idea and,
 * in his words, is "vague and hand-wavy"; the spreadsheet is his attempt to make it workable. This
 * is that spreadsheet, in code, weights and baselines intact.
 *
 * **Why the generator needs it.** Points spent is not combat effectiveness. Every archetype can
 * total exactly 400 and still be wildly out of line with the others — a character is balanced when
 * it lands near the campaign's X, not when it spends its budget. Nothing else here can tell a
 * generated Speedster it is too fast.
 *
 * How it works: each stat is scored as `(character / baseline) × weight`, and a character sitting
 * exactly on the baseline scores 100. (The weights themselves total 120 — DC and oAP are
 * alternatives, so 20 of that is never counted at once.) Above the norm costs proportionally more,
 * below discounts the same way, so an archetype is free to run hot on SPD provided it gives the
 * points back elsewhere. Phil's guidance: **keep characters within ±10%**.
 *
 * It is a tool, not a law. Quoting the spreadsheet: "not a substitute for a GM's critical character
 * analysis… munchkins will be munchkins."
 */

/** The inputs, in the spreadsheet's own column order. */
export interface RuleOfXStats {
    /** Include Mental Defense in this total. */
    readonly ego: number;
    /** Include any CON bought specifically to resist stun. */
    readonly con: number;
    /** Include Lightning Reflexes. */
    readonly dex: number;
    /** Maximum SPD. */
    readonly spd: number;
    /** Every Combat Skill Level the character owns. */
    readonly csl: number;
    /** Maximum OCV. For Martial Arts, the best non-defensive maneuver's modifier. */
    readonly ocv: number;
    /** Maximum DCV, excluding the standard Dodge everyone has. */
    readonly dcv: number;
    readonly omcv: number;
    readonly dmcv: number;
    /** Maximum Damage Classes, martial maneuvers included, standard moves (Haymaker) excluded. */
    readonly dc: number;
    /** Offensive Active Points of the largest attack power. */
    readonly oap: number;
    /** Total normal PD and ED, halved: `(PD + ED) / 2`. */
    readonly def: number;
    /** Total resistant PD and ED, halved: `(rPD + rED) / 2`. */
    readonly rdef: number;
    readonly stun: number;
    readonly body: number;
    /** Defensive Active Points of the largest defensive power — includes PD/ED/Resistant Protection. */
    readonly dap: number;
    /** Maximum velocity. Teleportation does not count. */
    readonly velocity: number;
}

export interface RuleOfXCampaign {
    readonly name: string;
    readonly baseline: RuleOfXStats;
    readonly weights: RuleOfXStats;
}

/**
 * The 400-point campaign, straight off the spreadsheet's "400pt (SAMPLE)" rows 2 and 4 (`Data!A2`
 * agrees). Everything is configurable there and so is meant to be configurable here — Phil: "if you
 * disagree with how I've weighted abilities, then change it".
 *
 * Worth noticing before authoring against it: **SPD and DC/oAP carry a weight of 20 each**, the
 * heaviest in the model, and DCV 10 is next. A single point of SPD is worth four of CON.
 */
export const CAMPAIGN_400: RuleOfXCampaign = {
    name: '400pt',
    baseline: {ego: 13, con: 20, dex: 24, spd: 5, csl: 2, ocv: 8, dcv: 8, omcv: 3, dmcv: 4, dc: 12, oap: 60, def: 26, rdef: 17, stun: 40, body: 10, dap: 30, velocity: 40},
    weights: {ego: 5, con: 3, dex: 5, spd: 20, csl: 5, ocv: 3, dcv: 10, omcv: 3, dmcv: 5, dc: 20, oap: 20, def: 5, rdef: 3, stun: 3, body: 2, dap: 5, velocity: 3},
};

/** The 225-point campaign — the spreadsheet's other sample. Same weights, lower baselines. */
export const CAMPAIGN_225: RuleOfXCampaign = {
    name: '225pt',
    baseline: {ego: 10, con: 15, dex: 15, spd: 3, csl: 1, ocv: 6, dcv: 6, omcv: 3, dmcv: 3, dc: 10, oap: 50, def: 21, rdef: 7, stun: 35, body: 12, dap: 12, velocity: 24},
    weights: CAMPAIGN_400.weights,
};

/** Phil's recommendation: "keep characters within +/-10% of the Rule of X, max". */
export const TOLERANCE = 10;

/** Stats scored linearly against the baseline. Attack and the two compound terms are special. */
const LINEAR = ['ego', 'con', 'dex', 'spd', 'csl', 'ocv', 'dcv', 'omcv', 'dmcv', 'def', 'rdef', 'stun', 'body'] as const;

const ratio = (value: number, baseline: number): number => (baseline === 0 ? 0 : value / baseline);

/**
 * A character's X. Exactly 100 at the campaign's baseline.
 *
 * Two terms aren't a plain ratio, and both are the spreadsheet's own shape:
 *
 * - **Attack is DC *or* oAP, never both.** `IF(DC*5 > oAP, …)` picks whichever prices the attack
 *   higher, at the model's 5 points per DC. It matters most for a Brick: STR-based damage has real
 *   DCs behind no power at all, so scoring oAP alone would read a 12d6 punch as free.
 * - **dAP is scaled by DCV × DEF × rDEF.** Defensive active points are worth more to a character
 *   who is already hard to hit and hard to hurt, so this term compounds rather than adds.
 */
export function ruleOfX(stats: RuleOfXStats, campaign: RuleOfXCampaign = CAMPAIGN_400): number {
    const {baseline, weights} = campaign;
    const linear = LINEAR.reduce((total, key) => total + ratio(stats[key], baseline[key]) * weights[key], 0);

    const attack = stats.dc * 5 > stats.oap ? ratio(stats.dc, baseline.dc) * weights.dc : ratio(stats.oap, baseline.oap) * weights.oap;

    const defensive = ratio(stats.dcv, baseline.dcv) * ratio(stats.def, baseline.def) * ratio(stats.rdef, baseline.rdef) * (ratio(stats.dap, baseline.dap) * weights.dap);

    return linear + attack + defensive + ratio(stats.velocity, baseline.velocity) * weights.velocity;
}

/** How far off the campaign's X a character is, as a percentage. The spreadsheet's "+/- %" column. */
export function deviation(stats: RuleOfXStats, campaign: RuleOfXCampaign = CAMPAIGN_400): number {
    return (ruleOfX(stats, campaign) / ruleOfX(campaign.baseline, campaign)) * 100 - 100;
}

/** Whether a character sits inside the campaign's tolerance. */
export const isBalanced = (stats: RuleOfXStats, campaign: RuleOfXCampaign = CAMPAIGN_400, tolerance = TOLERANCE): boolean =>
    Math.abs(deviation(stats, campaign)) <= tolerance;
