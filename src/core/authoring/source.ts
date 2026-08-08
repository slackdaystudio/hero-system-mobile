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
import type {AuthoredAdder, AuthoredCharacter, AuthoredTrait, AuthoringEdition} from './types';

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

function parseTrait(value: unknown): AuthoredTrait | null {
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

    const {levels, option, characteristic, familiarity} = value;

    if (levels !== undefined && (typeof levels !== 'number' || !Number.isInteger(levels))) {
        return null;
    }

    if (option !== undefined && typeof option !== 'string') {
        return null;
    }

    if (characteristic !== undefined && typeof characteristic !== 'string') {
        return null;
    }

    if (familiarity !== undefined && typeof familiarity !== 'boolean') {
        return null;
    }

    return {
        xmlid: value.xmlid,
        input: asString(value.input),
        adders,
        ...(levels === undefined ? {} : {levels}),
        ...(option === undefined ? {} : {option}),
        ...(characteristic === undefined ? {} : {characteristic}),
        ...(familiarity === undefined ? {} : {familiarity}),
    };
}

/** A whole category, or null if any entry in it is unreadable. */
function parseTraits(value: unknown): AuthoredTrait[] | null {
    if (!Array.isArray(value)) {
        return null;
    }

    const traits: AuthoredTrait[] = [];

    for (const entry of value) {
        const parsed = parseTrait(entry);

        if (parsed === null) {
            return null;
        }

        traits.push(parsed);
    }

    return traits;
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
    if (!isObject(source) || !isEdition(source.edition)) {
        return null;
    }

    const characteristics = parseCharacteristics(source.characteristics);

    if (characteristics === null) {
        return null;
    }

    // Categories added after Phase A: a source written before they existed has no such key, and
    // reads as empty rather than as unreadable. Refusing it would make a schema addition lock
    // players out of characters they had already saved.
    const skills = parseTraits(source.skills ?? []);
    const perks = parseTraits(source.perks ?? []);
    const talents = parseTraits(source.talents ?? []);
    const complications = parseTraits(source.complications ?? []);

    if (skills === null || perks === null || talents === null || complications === null) {
        return null;
    }

    return {
        edition: source.edition,
        name: asString(source.name),
        player: asString(source.player),
        characteristics,
        skills,
        perks,
        talents,
        complications,
    };
}

/** A draft as the JSON the `source` column stores. A plain projection — no engine data rides along. */
const traitToSource = (entry: AuthoredTrait): Record<string, unknown> => ({
    xmlid: entry.xmlid,
    input: entry.input,
    adders: entry.adders.map((adder) => ({...adder})),
    ...(entry.levels === undefined ? {} : {levels: entry.levels}),
    ...(entry.option === undefined ? {} : {option: entry.option}),
    ...(entry.characteristic === undefined ? {} : {characteristic: entry.characteristic}),
    ...(entry.familiarity === undefined ? {} : {familiarity: entry.familiarity}),
});

export const toSource = (draft: AuthoredCharacter): StoredSource => ({
    edition: draft.edition,
    name: draft.name,
    player: draft.player,
    characteristics: {...draft.characteristics},
    skills: draft.skills.map(traitToSource),
    perks: draft.perks.map(traitToSource),
    talents: draft.talents.map(traitToSource),
    complications: draft.complications.map(traitToSource),
});
