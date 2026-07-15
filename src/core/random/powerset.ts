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
 * Powersets (phase 3 of docs/RANDOM_CHARACTER.md) — the archetype's powers, structured.
 *
 * The data is a `.hdc` `powers` block, which is what lets the engine price it: **no cost is
 * ever stated**. A multipower slot's `5u` and an elemental-control slot's discount are
 * *derived* by the decorators from the reserve, the slot's active points and its modifiers.
 * The authoring job is therefore to get the shape right, not the arithmetic — and the
 * allocator's balance is the check that it was.
 */
import type {ParsedCharacter} from 'core/hero';
import powersetData from '../data/random/powersets.5e.json';

type Obj = Record<string, any>;

/**
 * Somewhere the structured build is knowingly not quite right — almost always because the
 * legacy prose it was translated from was itself loose, and being faithful to it beats
 * inventing precision the original never had. Declared here rather than left as a comment, so
 * `approximations()` can list every one across the whole data set for review.
 */
export interface Approximation {
    /** The power's `name`, as it appears on the sheet. */
    readonly power: string;
    readonly note: string;
}

export interface Powerset {
    readonly label: string;
    readonly powers: Obj;
    readonly approximations?: readonly Approximation[];
}

/**
 * Cosmetic fields every HERO Designer power carries. Kept out of the data so a powerset entry
 * says only what matters — the rest is noise inherited from the `.hdc` format.
 *
 * `affectsPrimary` / `affectsTotal` are **not** cosmetic, and both are `true` deliberately:
 * a generated character has no alternate identity, so its powers always apply. Imported
 * characters often carry `affectsPrimary: false` on defensive powers — that marks them as
 * alternate-form only, which is a thing a *player* decided about *their* character, not a
 * default. Consequence: a generated character's totals are identical in both forms and the
 * sheet offers no Alternate Identity toggle, which is correct — it has no second identity to
 * toggle to.
 */
const POWER_DEFAULTS: Obj = {
    basecost: 0,
    levels: 0,
    position: 0,
    multiplier: 1,
    graphic: 'Burst',
    color: '255 255 255',
    sfx: 'Default',
    showActiveCost: true,
    includeNotesInPrintout: true,
    quantity: 1,
    affectsPrimary: true,
    affectsTotal: true,
    notes: null,
};

const withDefaults = (power: Obj): Obj => ({...POWER_DEFAULTS, ...power});

export const POWERSETS_5E = powersetData as unknown as Record<string, Powerset[]>;

/** Every powerset authored for an archetype, or `[]` while its data is still to be written. */
export const powersetsFor = (archetype: string): Powerset[] => (Array.isArray(POWERSETS_5E[archetype]) ? POWERSETS_5E[archetype] : []);

/** Attach a powerset to a `ParsedCharacter`, filling in the `.hdc` boilerplate. */
export function attachPowerset(parsed: ParsedCharacter, powerset: Powerset): ParsedCharacter {
    const powers: Obj = {};

    for (const [frameworkKey, entries] of Object.entries(powerset.powers)) {
        powers[frameworkKey] = (entries as Obj[]).map(withDefaults);
    }

    return {...parsed, powers} as unknown as ParsedCharacter;
}

/**
 * Every knowingly-loose corner of the authored data, flattened for review. Grows as powersets
 * land; a test pins the list, so a new approximation has to be declared rather than smuggled in.
 */
export function approximations(): Array<Approximation & {archetype: string; powerset: string}> {
    return Object.entries(POWERSETS_5E)
        .filter(([, powersets]) => Array.isArray(powersets))
        .flatMap(([archetype, powersets]) =>
            powersets.flatMap((powerset) => (powerset.approximations ?? []).map((approximation) => ({archetype, powerset: powerset.label, ...approximation}))),
        );
}
