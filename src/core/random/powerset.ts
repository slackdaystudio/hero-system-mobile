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
import type {Edition} from './powerLevel';
import powersetData from '../data/random/powersets.5e.json';
import powersetData6E from '../data/random/powersets.6e.json';

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
    /**
     * Martial maneuvers, when the archetype has them. They are **not powers** — a `.hdc` carries
     * them in their own trait bucket — but their cost comes out of the powers balance: the legacy
     * prose folds them into `powersCost` (Martial Artist's 115 is powers 100 + maneuvers 15).
     */
    readonly martialarts?: Obj;
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
export const POWERSETS_6E = powersetData6E as unknown as Record<string, Powerset[]>;

/** The powersets for an edition. */
export const powersetsForEdition = (edition: Edition): Record<string, Powerset[]> => (edition === '6e' ? POWERSETS_6E : POWERSETS_5E);

/** Every powerset authored for an archetype, or `[]` while its data is still to be written. */
/**
 * The powersets an archetype has in an edition.
 *
 * Defaults to 5E so every existing caller keeps its meaning — the generator was 5E-only until the
 * 6E data landed, and the edition is threaded from the PowerLevel rather than guessed.
 */
export const powersetsFor = (archetype: string, edition: Edition = '5e'): Powerset[] => {
    const sets = powersetsForEdition(edition)[archetype];

    return Array.isArray(sets) ? sets : [];
};

const withBoilerplate = (block: Obj): Obj => {
    const filled: Obj = {};

    for (const [subKey, entries] of Object.entries(block)) {
        filled[subKey] = (entries as Obj[]).map(withDefaults);
    }

    return filled;
};

/** Attach a powerset to a `ParsedCharacter`, filling in the `.hdc` boilerplate. */
export function attachPowerset(parsed: ParsedCharacter, powerset: Powerset): ParsedCharacter {
    const attached: Obj = {...parsed, powers: withBoilerplate(powerset.powers)};

    if (powerset.martialarts !== undefined) {
        attached.martialarts = withBoilerplate(powerset.martialarts);
    }

    return attached as unknown as ParsedCharacter;
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
