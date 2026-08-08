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

import {camelCase, snakeCase} from 'change-case';

// The pure half of the legacy `Common.js` — the helpers the rules engine relies
// on, ported verbatim in behaviour and lifted out of the RN-coupled bits
// (`Dimensions`/`Platform`/`Toast`), which stay in the app layer.

const hasOwn = (obj: object, key: string): boolean => Object.prototype.hasOwnProperty.call(obj, key);

export const isEmptyObject = (obj: unknown): boolean => {
    if (obj === null || obj === undefined) {
        return true;
    }

    return Object.keys(obj).length === 0 && (obj as {constructor: unknown}).constructor === Object;
};

/** Legacy semantics: relies on loose `isNaN` coercion, so strings are accepted. */
export const isInt = (value: number | string): boolean => !isNaN(value as number) && (value as number) % 1 === 0;

export const isFloat = (value: number | string): boolean => (!isNaN(value as number) ? (value as number) % 1 !== 0 : false);

/**
 * How many times `step` must be applied to reach `total` — i.e. log-base-`step` of `total`,
 * rounded up.
 *
 * U2 (docs/KNOWN_DEVIATIONS.md) — intentional divergence from legacy: a `total` of zero
 * buys zero multiplications. Legacy had no guard, so `Math.log(0)` made this `-Infinity`
 * and callers added that straight into a cost. The same guard absorbs negative and `NaN`
 * totals, which are equally undefined and previously yielded `-Infinity`/`NaN`.
 * (`getMultiplications(1, …)` was already 0; zero is the same case.)
 *
 * U3 — intentional divergence: `Math.log(total) / Math.log(step)` is inexact, so an exact
 * power could land a hair above its integer and `Math.ceil` would round it up —
 * `Math.log(9) / Math.log(3)` is `2.0000000000000004`, giving 3 instead of 2. Base 2 is exact
 * in binary and so never showed the fault. Rather than snap within an epsilon (which would
 * have to be picked, and gets less safe as the exponent grows), ask the question exactly:
 * `total` is an exact power of `step` iff `step ** n === total`. Integer powers are exact in
 * a double up to 2^53, far beyond anything the template data holds, and a genuine fraction
 * still rounds up. Non-integer or negative `step` keeps legacy's behaviour — `Math.log` of a
 * negative is `NaN`, and `NaN` propagates as before.
 */
export const getMultiplications = (total: number, step = 2): number => {
    if (!(total > 0)) {
        return 0;
    }

    const exact = Math.log(total) / Math.log(step);
    const nearest = Math.round(exact);

    return Math.pow(step, nearest) === total ? nearest : Math.ceil(exact);
};

export const getMultiplierCost = (total: number, step: number, cost: number): number => {
    if (step === 1) {
        return (total / step) * cost;
    }

    return getMultiplications(total, step) * cost;
};

interface Adder {
    basecost: number;
    levels?: number;
    lvlval?: number;
    lvlcost?: number;
}

export const totalAdders = (adder: Adder | Adder[] | null | undefined): number => {
    let total = 0;

    if (adder === undefined || adder === null) {
        return total;
    }

    if (Array.isArray(adder)) {
        for (const a of adder) {
            total += totalAdders(a);
        }
    } else {
        total += adder.basecost;

        if (adder.levels !== undefined && adder.levels > 0) {
            total += Math.round((adder.levels / (adder.lvlval as number)) * (adder.lvlcost as number));
        }
    }

    return total;
};

interface ModifierRef {
    xmlid: string;
}

interface PowerWithModifiers {
    type?: string;
    modifier?: ModifierRef | ModifierRef[] | null;
}

export const hasModifier = (modifierXmlid: string, power: PowerWithModifiers): boolean => {
    if (hasOwn(power, 'type') && power.type === 'power') {
        if (power.modifier !== undefined && power.modifier !== null) {
            if (Array.isArray(power.modifier)) {
                return power.modifier.some((m) => m.xmlid === modifierXmlid);
            } else {
                return power.modifier.xmlid === modifierXmlid;
            }
        }
    }

    return false;
};

interface FlattenableItem {
    type?: string;
    [key: string]: unknown;
}

/** Flattens `type: 'list'` container items, splicing their `key` children inline. */
export const flatten = <T extends FlattenableItem>(items: T[], key: string): T[] => {
    let flattened: T[] = [];

    for (const item of items) {
        if (item.type === 'list' && hasOwn(item, key)) {
            flattened = flattened.concat(flatten(item[key] as T[], key));
        } else {
            flattened.push(item);
        }
    }

    return flattened;
};

/**
 * Every trait in `items`, depth-first, **including** the containers themselves.
 *
 * The difference from {@link flatten} is the container: `flatten` splices a framework away and
 * returns only its slots, which is right for a totals query (the pool is not a power). Anything
 * *summing costs* needs the opposite — a Multipower's pool costs real points, and so do its slots.
 *
 * Children may hang off more than one key: a framework nests its slots under the category's own
 * child key (`powers.powers`, `skills.skills`, `martialArts.maneuver`), while a compound power
 * always nests under `powers`. Equipment is the one category that sees both. Pass every key that
 * applies — see `TRAIT_CHILD_KEYS` in `core/hero`.
 */
export const withDescendants = <T extends FlattenableItem>(items: T[], keys: readonly string[]): T[] => {
    const walked: T[] = [];

    for (const item of items) {
        walked.push(item);

        for (const key of keys) {
            if (Array.isArray(item[key])) {
                walked.push(...withDescendants(item[key] as T[], keys));
            }
        }
    }

    return walked;
};

/**
 * Indexes objects by a key. Collisions collapse into an array under that key —
 * a legacy quirk the rules engine depends on, preserved exactly.
 */
export const toMap = <T extends Record<string, unknown>>(objects: T | T[] | null | undefined, mapKey = 'xmlid'): Map<unknown, T | T[]> => {
    const map = new Map<unknown, T | T[]>();

    if (objects === undefined || objects === null) {
        return map;
    }

    if (Array.isArray(objects)) {
        for (const object of objects) {
            if (hasOwn(object, mapKey)) {
                if (map.has(object[mapKey])) {
                    const existing = map.get(object[mapKey]);
                    if (Array.isArray(existing)) {
                        existing.push(object);
                    } else {
                        map.set(object[mapKey], [existing as T, object]);
                    }
                } else {
                    map.set(object[mapKey], object);
                }
            }
        }
    } else {
        if (hasOwn(objects, mapKey)) {
            map.set(objects[mapKey], objects);
        }
    }

    return map;
};

/**
 * HERO rounds fractional point costs "in the player's favour": a fraction whose
 * hundredths land in 0.50–0.59 truncates down, otherwise it rounds normally.
 */
export const roundInPlayersFavor = (toBeRounded: number): number => {
    let rounded = toBeRounded;

    if (isFloat(toBeRounded)) {
        if (/0\.5[0-9]/.test((toBeRounded % 1).toFixed(2))) {
            rounded = Math.trunc(toBeRounded);
        } else {
            rounded = Math.round(toBeRounded);
        }
    }

    return rounded;
};

export const toCamelCase = (text: string): string => camelCase(text);

export const toSnakeCase = (text: string): string => snakeCase(text);

export const capitalize = (word: string): string => word.toLowerCase().charAt(0).toUpperCase() + word.slice(1);

export const toKg = (lbs: number): number => Math.round(lbs * 0.453592);

export const toCm = (inches: number): number => Math.round(inches * 2.54);
