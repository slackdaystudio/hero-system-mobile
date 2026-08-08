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
 * Reading a stored draft back (docs/CHARACTER_AUTHORING.md).
 *
 * The mirror of `core/random`'s `parseRecipe`, and it fails the same way on purpose: a source it
 * cannot make sense of returns `null`, and the character simply stops being editable. It still
 * opens and still renders, because the sheet reads the *document* — the stored source only governs
 * whether the editor can be entered.
 *
 * That matters because a draft outlives the build that wrote it. Rejecting the whole character
 * because one field went missing would make a schema change destroy players' work; refusing to
 * edit it does not.
 */
import type {StoredSource} from 'core/ports';
import type {AuthoredAdder, AuthoredCharacter, AuthoredComplication, AuthoringEdition} from './types';

const isObject = (value: unknown): value is Record<string, unknown> => typeof value === 'object' && value !== null && !Array.isArray(value);

const isEdition = (value: unknown): value is AuthoringEdition => value === '5E' || value === '6E';

const asString = (value: unknown): string => (typeof value === 'string' ? value : '');

/** Characteristic totals: every value must be a finite whole number, or the map is not a map. */
function parseCharacteristics(value: unknown): Readonly<Record<string, number>> | null {
    if (!isObject(value)) {
        return null;
    }

    const characteristics: Record<string, number> = {};

    for (const [key, total] of Object.entries(value)) {
        if (typeof total !== 'number' || !Number.isFinite(total) || !Number.isInteger(total)) {
            return null;
        }

        characteristics[key] = total;
    }

    return characteristics;
}

function parseAdder(value: unknown): AuthoredAdder | null {
    if (!isObject(value) || typeof value.xmlid !== 'string') {
        return null;
    }

    const {option, levels} = value;

    if (option !== undefined && typeof option !== 'string') {
        return null;
    }

    if (levels !== undefined && (typeof levels !== 'number' || !Number.isInteger(levels))) {
        return null;
    }

    return {
        xmlid: value.xmlid,
        ...(option === undefined ? {} : {option}),
        ...(levels === undefined ? {} : {levels}),
    };
}

function parseComplication(value: unknown): AuthoredComplication | null {
    if (!isObject(value) || typeof value.xmlid !== 'string' || !Array.isArray(value.adders)) {
        return null;
    }

    const adders: AuthoredAdder[] = [];

    for (const entry of value.adders) {
        const adder = parseAdder(entry);

        if (adder === null) {
            return null;
        }

        adders.push(adder);
    }

    const {levels} = value;

    if (levels !== undefined && (typeof levels !== 'number' || !Number.isInteger(levels))) {
        return null;
    }

    return {
        xmlid: value.xmlid,
        input: asString(value.input),
        adders,
        ...(levels === undefined ? {} : {levels}),
    };
}

/**
 * A stored source as a draft, or null when it is not one this build understands.
 *
 * **Shape only — this does not check that anything named still exists.** A complication the
 * edition dropped parses fine here and is caught by `validate`, which is where the player gets
 * told about it in words. Conflating the two would mean a rules-data change silently locked
 * people out of their own characters.
 */
export function parseSource(source: StoredSource | null | undefined): AuthoredCharacter | null {
    if (!isObject(source) || !isEdition(source.edition) || !Array.isArray(source.complications)) {
        return null;
    }

    const characteristics = parseCharacteristics(source.characteristics);

    if (characteristics === null) {
        return null;
    }

    const complications: AuthoredComplication[] = [];

    for (const entry of source.complications) {
        const complication = parseComplication(entry);

        if (complication === null) {
            return null;
        }

        complications.push(complication);
    }

    return {
        edition: source.edition,
        name: asString(source.name),
        player: asString(source.player),
        characteristics,
        complications,
    };
}

/** A draft as the JSON the `source` column stores. A plain projection — no engine data rides along. */
export const toSource = (draft: AuthoredCharacter): StoredSource => ({
    edition: draft.edition,
    name: draft.name,
    player: draft.player,
    characteristics: {...draft.characteristics},
    complications: draft.complications.map((entry) => ({
        xmlid: entry.xmlid,
        input: entry.input,
        adders: entry.adders.map((adder) => ({...adder})),
        ...(entry.levels === undefined ? {} : {levels: entry.levels}),
    })),
});
