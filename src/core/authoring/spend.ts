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
 * What a character costs, asked of the engine (docs/CHARACTER_AUTHORING.md).
 *
 * Nothing computed this before. `core/hero/characterPoints` reads the **declared**
 * `<BASIC_CONFIGURATION>` a `.hdc` carries — the points a character was *built on* — and never
 * sums what it actually spends. That is fine for an imported file, whose author already balanced
 * it, and useless while authoring, where the running total is the whole point.
 *
 * Every number here comes from the trait decorators, never from the catalogue. The templates state
 * costs and the engine states costs; if this module added them up itself there would be two
 * answers to every question and no way to tell which was wrong.
 *
 * **Complications fund the build, they do not consume it.** In 5E the disadvantage allowance is
 * added to base points to give the total a character may spend. 6E abolished that: complications
 * are a required *shape*, worth no points at all. So the two editions read the same numbers to
 * opposite effect, and `remaining` is the only place that knows it.
 */
import {TRAIT_CHILD_KEYS} from 'core/hero';
import {characterTraitDecorator, type Obj} from 'core/traits';
import {withDescendants} from 'core/util';
import type {AuthoringEdition, Budget} from './types';

/** The trait buckets a character spends points on, in sheet order. */
const SPENDING_BUCKETS = ['skills', 'perks', 'talents', 'martialArts', 'powers', 'equipment'] as const;

export interface Spend {
    /** What the characteristics cost — the engine's own per-characteristic `cost`. */
    readonly characteristics: number;
    /** What every trait costs, framework pools and their slots alike. */
    readonly traits: number;
    /** Points the complications are worth. Positive; what it *means* is edition-specific. */
    readonly complications: number;
    /** characteristics + traits. What the player has actually spent. */
    readonly spent: number;
}

/**
 * Containers whose own cost **already accounts for everything inside them**, so walking in and
 * pricing the contents as well charges the player twice.
 *
 * Two of them, for different reasons:
 *
 * - **A compound power is the sum of its children.** `CompoundPower.realCost()` literally adds them
 *   up. Measured: `aoe`'s compound power costs 60 and its two children another 60 between them.
 *   Worse inside a framework, where the container's total is then divided — `gravity-girl`'s
 *   compound slot costs 5 against children summing 49, so the pair came to 54 instead of 5.
 * - **A Variable Power Pool's contents are free.** The player pays for the pool and the control
 *   that steers it; the powers built out of it cost nothing further, which is why the engine has no
 *   VPP-slot decorator to divide anything. Counting them is the same mistake as H5 in
 *   docs/KNOWN_DEVIATIONS.md, one consumer along.
 *
 * A **Multipower or Elemental Control is the opposite** and must be descended: its container costs
 * the reserve and each slot costs a fraction on top of it. All four look identical to
 * `withDescendants`, which is why this is a predicate here rather than a flag there.
 */
const totalsItsOwnContents = (trait: Obj): boolean =>
    String(trait.xmlid).toUpperCase() === 'COMPOUNDPOWER' || String(trait.originalType ?? '').toUpperCase() === 'VPP';

/** Every trait in a bucket, descending into containers except the ones that already total their own. */
function pricedNodes(items: readonly Obj[], childKeys: readonly string[]): Obj[] {
    const nodes: Obj[] = [];

    for (const item of items) {
        nodes.push(item);

        if (totalsItsOwnContents(item)) {
            continue;
        }

        for (const key of childKeys) {
            const children = item[key];

            if (Array.isArray(children)) {
                nodes.push(...pricedNodes(children as Obj[], childKeys));
            } else if (children !== undefined && children !== null) {
                nodes.push(...pricedNodes([children as Obj], childKeys));
            }
        }
    }

    return nodes;
}

const sumBucket = (character: Obj, key: string): number =>
    pricedNodes((character[key] ?? []) as Obj[], TRAIT_CHILD_KEYS[key] ?? ['powers']).reduce((total, trait) => {
        try {
            return total + characterTraitDecorator.decorate(trait, key, () => character).realCost();
        } catch {
            // A trait the engine cannot price contributes nothing rather than blanking the total.
            // `validate` is what tells the player about it — see the silent-zero trap in the docs.
            return total;
        }
    }, 0);

/**
 * What a built character costs, bucket by bucket.
 *
 * Takes the **built** character (the engine's output), not a draft, so the sheet and the spend
 * meter are reading the same object and cannot disagree.
 */
export function spendOf(character: Obj): Spend {
    const characteristics = ((character.characteristics ?? []) as Obj[]).reduce((total, entry) => total + (Number(entry.cost) || 0), 0);
    const traits = SPENDING_BUCKETS.reduce((total, key) => total + sumBucket(character, key), 0);

    // `cost()`, not `realCost()`: a complication's worth is its base value. The decorator chain's
    // advantage/limitation multipliers have no meaning on a disadvantage.
    const complications = withDescendants((character.disadvantages ?? []) as Obj[], TRAIT_CHILD_KEYS.disadvantages).reduce((total, entry) => {
        try {
            return total + characterTraitDecorator.decorate(entry, 'disadvantages', () => character).cost();
        } catch {
            return total;
        }
    }, 0);

    return {characteristics, traits, complications, spent: characteristics + traits};
}

/** What one row of an authoring list should say: what it is, and what it costs. */
export interface TraitSummary {
    readonly label: string;
    readonly cost: number;
}

/**
 * A label and a cost for every trait in a category, in draft order.
 *
 * So a list can show what each entry costs without every entry's form being on screen. Priced by
 * decorating the *built* character, so a row and the meter above it are reading the same numbers —
 * the alternative is a second cost model that agrees until it doesn't.
 *
 * Order is draft order because `emit` assigns `position` from the array index and the engine sorts
 * on it. Frameworks are excluded here: they nest, so a flat list of them is the wrong shape —
 * {@link frameworkSummaries} handles those.
 */
export function summaries(character: Obj, key: string): TraitSummary[] {
    // Framework containers are not entries in any draft list, so they are skipped: `draft.powers`
    // holds only the standalone ones, and a container would shift every index after it.
    const entries = ((character[key] ?? []) as Obj[]).filter((entry) => entry.type !== 'list');

    return entries.map((entry) => describe(entry, key, character));
}

/** A container's own label and cost, plus one per slot — the shape a framework card wants. */
export function frameworkSummaries(character: Obj): Array<{container: TraitSummary; slots: TraitSummary[]}> {
    return ((character.powers ?? []) as Obj[])
        .filter((entry) => entry.type === 'list')
        .map((container) => ({
            container: describe(container, 'powers', character),
            slots: ((container.powers ?? []) as Obj[]).map((slot) => describe(slot, 'powers', character)),
        }));
}

const describe = (entry: Obj, key: string, character: Obj): TraitSummary => {
    try {
        const decorated = characterTraitDecorator.decorate(entry, key, () => character);

        return {label: decorated.label(), cost: decorated.realCost()};
    } catch {
        // A trait the engine cannot render still needs a row, or it vanishes from the list and the
        // player has no way to fix or delete it. `validate` is what says why.
        return {label: String(entry.name ?? entry.alias ?? entry.xmlid), cost: 0};
    }
};

export interface Remaining {
    /** Everything the campaign grants: base, plus the complications that fund it in 5E. */
    readonly total: number;
    readonly spent: number;
    /** What is left of the allowance. Never negative — past it, the excess is experience. */
    readonly left: number;
    /**
     * Points spent beyond the campaign's allowance.
     *
     * Not an error, and not an overspend: in HERO a character who costs more than their starting
     * allowance has **earned** the difference, and that is what experience is. The sheet's
     * nameplate already prints it — `"400 + 25 pts"` — so all this has to do is say how much.
     */
    readonly experience: number;
    /** Complications taken, and the most that count. Over the limit, the excess funds nothing. */
    readonly complications: number;
    readonly complicationLimit: number;
}

/**
 * How much a character has left to spend.
 *
 * The edition fork is real and it is here: 5E complications *buy* points, capped at the limit, so
 * a 5E character's total grows as it takes them. 6E complications buy nothing — the 400 is the
 * whole allowance and the 75 is a requirement the character must meet, not a source of points.
 */
export function remaining(spend: Spend, budget: Budget, edition: AuthoringEdition): Remaining {
    const counted = Math.min(spend.complications, budget.complicationLimit);
    const total = edition === '5E' ? budget.base + counted : budget.base;

    return {
        total,
        spent: spend.spent,
        left: Math.max(0, total - spend.spent),
        experience: Math.max(0, spend.spent - total),
        complications: spend.complications,
        complicationLimit: budget.complicationLimit,
    };
}
