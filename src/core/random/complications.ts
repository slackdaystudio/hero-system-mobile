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
 * Complication packages (phase 3 of docs/RANDOM_CHARACTER.md) — the disadvantage half of a build.
 *
 * Like the powersets, the data is a `.hdc` block and **states no cost**: a disadvantage's price
 * is the sum of its adder basecosts, which the engine computes. Taken at the level's **fixed
 * limit** — in theory a character may take fewer; in practice nobody does — so a package must
 * total exactly `level.limit`.
 */
import type {ParsedCharacter} from 'core/hero';
import type {Edition} from './powerLevel';
import packageData from '../data/random/complicationPackages.5e.json';
import packageData6E from '../data/random/complicationPackages.6e.json';

type Obj = Record<string, any>;

export interface ComplicationSet {
    readonly label: string;
    readonly disadvantages: Obj;
}

/** Cosmetic `.hdc` fields, kept out of the data so an entry says only what matters. */
const DISADVANTAGE_DEFAULTS: Obj = {
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
    notes: null,
};

const ADDER_DEFAULTS: Obj = {basecost: 0, levels: 0, position: -1, multiplier: 1};

const withDefaults = (disadvantage: Obj): Obj => ({
    ...DISADVANTAGE_DEFAULTS,
    ...disadvantage,
    ...(Array.isArray(disadvantage.adder) ? {adder: (disadvantage.adder as Obj[]).map((adder) => ({...ADDER_DEFAULTS, ...adder}))} : {}),
});

export const COMPLICATION_SETS_5E = (packageData as unknown as {packages: ComplicationSet[]}).packages;
export const COMPLICATION_SETS_6E = (packageData6E as unknown as {packages: ComplicationSet[]}).packages;

/**
 * The complication packages for an edition.
 *
 * They are NOT interchangeable: a package totals its level's fixed limit, and 5E Low Powered's is
 * 100 where 6E Standard's is 75. The 5E ones also carry Normal Characteristic Maxima, which 6E
 * abolished.
 */
export const complicationSetsFor = (edition: Edition): ComplicationSet[] => (edition === '6e' ? COMPLICATION_SETS_6E : COMPLICATION_SETS_5E);

/** Attach a complication package to a `ParsedCharacter`, filling in the `.hdc` boilerplate. */
export function attachComplications(parsed: ParsedCharacter, set: ComplicationSet): ParsedCharacter {
    const disadvantages: Obj = {};

    for (const [subKey, entries] of Object.entries(set.disadvantages)) {
        disadvantages[subKey] = (entries as Obj[]).map(withDefaults);
    }

    return {...parsed, disadvantages} as unknown as ParsedCharacter;
}
