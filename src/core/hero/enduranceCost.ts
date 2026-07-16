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

type Obj = Record<string, any>;

/**
 * Modifiers that make an otherwise-free power cost END: "Costs Endurance" and its
 * "Costs Endurance To Maintain" variant. Either forces `usesEndurance` true regardless of the
 * template default (e.g. a Persistent defense bought Costs END).
 */
const COSTS_END_MODIFIERS = new Set(['COSTSEND', 'COSTSENDTOMAINTAIN']);

const asModifiers = (value: unknown): Obj[] => (Array.isArray(value) ? (value as Obj[]) : value !== null && typeof value === 'object' ? [value as Obj] : []);

/** First modifier (descending nested modifiers) that satisfies `match`, or null. */
function findModifier(trait: Obj, match: (modifier: Obj) => boolean): Obj | null {
    for (const modifier of asModifiers(trait.modifier)) {
        if (match(modifier)) {
            return modifier;
        }
        const nested = findModifier(modifier, match);
        if (nested !== null) {
            return nested;
        }
    }

    return null;
}

/**
 * Whether using this power costs END at all. The power template's `usesend` is the default
 * (Blast/Constant powers true; defenses, senses, and framework containers false); a Costs Endurance
 * modifier overrides it to true. This is the gate — the amount is {@link enduranceCost}.
 */
export function usesEndurance(trait: Obj): boolean {
    if (findModifier(trait, (modifier) => COSTS_END_MODIFIERS.has(String(modifier.xmlid).toUpperCase())) !== null) {
        return true;
    }

    return (trait.template as Obj | undefined)?.usesend === true;
}

/** The Reduced Endurance option on a power: `'ZERO'` (0 END), `'HALF'` (½ END), or null if unmodified. */
function reducedEnduranceOption(trait: Obj): 'ZERO' | 'HALF' | null {
    const modifier = findModifier(trait, (candidate) => String(candidate.xmlid).toUpperCase() === 'REDUCEDEND');
    if (modifier === null) {
        return null;
    }

    const option = String(modifier.optionid ?? modifier.option ?? '').toUpperCase();

    return option === 'ZERO' ? 'ZERO' : option === 'HALF' ? 'HALF' : null;
}

/**
 * The END a power costs to use, per 6E: **1 END per 10 Active Points, rounded to the nearest whole
 * number, minimum 1** — and 0 for powers that do not cost END ({@link usesEndurance}). Reduced
 * Endurance zeroes it (0 END) or halves it (½ END, still minimum 1).
 *
 * `activeCost` is the power's Active Points (the decorator's `activeCost()`); for a framework it is
 * the slot's, which is what a character actually pays when using that slot.
 *
 * ROUNDING is pinned to nearest, half up (6E1 128). No fixture pins the exact half-point behaviour;
 * if you have the rulebook to hand, confirm whether AP ending in 5 rounds up or in the player's favour.
 */
export function enduranceCost(trait: Obj, activeCost: number): number {
    if (!usesEndurance(trait)) {
        return 0;
    }

    const reduced = reducedEnduranceOption(trait);
    if (reduced === 'ZERO') {
        return 0;
    }

    const base = Math.max(1, Math.round(Math.max(0, activeCost) / 10));

    return reduced === 'HALF' ? Math.max(1, Math.round(base / 2)) : base;
}

/**
 * END to use Strength: 1 per 10 STR (6E), minimum 1, and 0 for a character with no STR to spend. The
 * optional grittier "1 END per 5 STR" campaign variant is not modelled. Paid once per Phase however
 * many ways STR is exerted — the tracker leaves that to the player, who taps when they use it.
 */
export function strengthEnduranceCost(strength: number): number {
    return strength <= 0 ? 0 : Math.max(1, Math.round(strength / 10));
}

/**
 * END to move a mode's full distance in a Phase: 1 END per 10 Active Points, minimum 1 (6E — e.g.
 * the free 12m of Running costs 1 END).
 *
 * `metres` is the distance in metres — 5E quotes movement in inches, so the caller converts (1" = 2m)
 * to keep the two editions on one distance-based rule.
 *
 * APPROXIMATION: it prices each metre at ~1 Active Point, since the stored movement mode carries no
 * template to read a true Active-Point cost from. That is exact for the 1-point/metre modes (Running,
 * Flight, and most combat movement) and reads a touch high for the cheaper base modes (Swimming,
 * Leaping). If a per-mode point-rate table is wanted, refine here.
 */
export function movementEnduranceCost(metres: number): number {
    return metres <= 0 ? 0 : Math.max(1, Math.round(metres / 10));
}
