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
import {DEFAULT_BUDGET} from './types';
import type {
    AuthoredAdder,
    AuthoredCharacter,
    AuthoredFramework,
    AuthoredModifier,
    AuthoredPower,
    AuthoredSlot,
    AuthoredTrait,
    AuthoringEdition,
    FrameworkKind,
} from './types';

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

    const {levels, option, characteristic, familiarity, name} = value;

    if (name !== undefined && typeof name !== 'string') {
        return null;
    }

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
        ...(name === undefined ? {} : {name}),
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

function parseModifier(value: unknown): AuthoredModifier | null {
    const base = parseTrait(value);

    if (base === null || !isObject(value)) {
        return null;
    }

    const {text} = value;

    if (text !== undefined && typeof text !== 'string') {
        return null;
    }

    return {
        xmlid: base.xmlid,
        adders: base.adders,
        ...(base.levels === undefined ? {} : {levels: base.levels}),
        ...(base.option === undefined ? {} : {option: base.option}),
        ...(text === undefined ? {} : {text}),
    };
}

const isDefense = (value: unknown): value is {pd: number; ed: number; mental: number; power: number} =>
    isObject(value) && (['pd', 'ed', 'mental', 'power'] as const).every((key) => typeof value[key] === 'number' && Number.isInteger(value[key]));

function parsePowers(value: unknown): AuthoredPower[] | null {
    if (!Array.isArray(value)) {
        return null;
    }

    const powers: AuthoredPower[] = [];

    for (const entry of value) {
        const base = parseTrait(entry);

        if (base === null || !isObject(entry) || !Array.isArray(entry.modifiers)) {
            return null;
        }

        const modifiers: AuthoredModifier[] = [];

        for (const raw of entry.modifiers) {
            const parsed = parseModifier(raw);

            if (parsed === null) {
                return null;
            }

            modifiers.push(parsed);
        }

        if (entry.defense !== undefined && !isDefense(entry.defense)) {
            return null;
        }

        powers.push({...base, modifiers, ...(entry.defense === undefined ? {} : {defense: entry.defense})});
    }

    return powers;
}

/**
 * A framework's slots: powers, plus the one field only a slot has.
 *
 * Separate from {@link parsePowers} rather than folded into it, so `variable` cannot appear on a
 * standalone power or a piece of equipment, where nothing would ever read it.
 */
function parseSlots(value: unknown): AuthoredSlot[] | null {
    const powers = parsePowers(value);

    if (powers === null) {
        return null;
    }

    const slots: AuthoredSlot[] = [];

    for (const [index, power] of powers.entries()) {
        // Sources written before slot kinds existed have no such key on any slot — and every one
        // of them was emitted fixed, which is what an absent field reads as. A key that is present
        // but not a boolean is malformed, and rejected like any other field of the wrong type.
        const {variable} = (value as unknown[])[index] as Record<string, unknown>;

        if (variable !== undefined && typeof variable !== 'boolean') {
            return null;
        }

        slots.push(variable === undefined ? power : {...power, variable});
    }

    return slots;
}

const FRAMEWORK_KINDS = new Set<FrameworkKind>(['multipower', 'elementalControl', 'vpp']);

function parseFrameworks(value: unknown): AuthoredFramework[] | null {
    if (!Array.isArray(value)) {
        return null;
    }

    const frameworks: AuthoredFramework[] = [];

    for (const entry of value) {
        if (!isObject(entry) || !FRAMEWORK_KINDS.has(entry.kind as FrameworkKind) || typeof entry.reserve !== 'number' || !Number.isInteger(entry.reserve)) {
            return null;
        }

        const slots = parseSlots(entry.slots ?? []);

        if (slots === null || !Array.isArray(entry.modifiers)) {
            return null;
        }

        const modifiers: AuthoredModifier[] = [];

        for (const raw of entry.modifiers) {
            const parsed = parseModifier(raw);

            if (parsed === null) {
                return null;
            }

            modifiers.push(parsed);
        }

        frameworks.push({kind: entry.kind as FrameworkKind, name: asString(entry.name), reserve: entry.reserve, modifiers, slots});
    }

    return frameworks;
}

const isBudget = (value: unknown): value is {base: number; complicationLimit: number} =>
    isObject(value) &&
    typeof value.base === 'number' &&
    Number.isInteger(value.base) &&
    typeof value.complicationLimit === 'number' &&
    Number.isInteger(value.complicationLimit);

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
    const powers = parsePowers(source.powers ?? []);
    const martialArts = parseTraits(source.martialArts ?? []);
    const equipment = parsePowers(source.equipment ?? []);
    const frameworks = parseFrameworks(source.frameworks ?? []);
    // Sources written before the allowance was pickable have no budget and read as the default —
    // which is the level they were in fact built to, since it was the only one on offer.
    const budget = source.budget === undefined ? DEFAULT_BUDGET[source.edition] : source.budget;

    if (!isBudget(budget)) {
        return null;
    }

    if (
        skills === null ||
        perks === null ||
        talents === null ||
        complications === null ||
        powers === null ||
        martialArts === null ||
        equipment === null ||
        frameworks === null
    ) {
        return null;
    }

    return {
        edition: source.edition,
        name: asString(source.name),
        player: asString(source.player),
        budget: {base: budget.base, complicationLimit: budget.complicationLimit},
        characteristics,
        skills,
        perks,
        talents,
        powers,
        martialArts,
        equipment,
        frameworks,
        complications,
    };
}

/** A draft as the JSON the `source` column stores. A plain projection — no engine data rides along. */
const modifierToSource = (mod: AuthoredModifier): Record<string, unknown> => ({...mod, adders: mod.adders.map((adder) => ({...adder}))});

const traitToSource = (entry: AuthoredTrait): Record<string, unknown> => ({
    xmlid: entry.xmlid,
    input: entry.input,
    ...(entry.name === undefined ? {} : {name: entry.name}),
    adders: entry.adders.map((adder) => ({...adder})),
    ...(entry.levels === undefined ? {} : {levels: entry.levels}),
    ...(entry.option === undefined ? {} : {option: entry.option}),
    ...(entry.characteristic === undefined ? {} : {characteristic: entry.characteristic}),
    ...(entry.familiarity === undefined ? {} : {familiarity: entry.familiarity}),
});

const powerToSource = (entry: AuthoredPower): Record<string, unknown> => ({
    ...traitToSource(entry),
    modifiers: entry.modifiers.map(modifierToSource),
    ...(entry.defense === undefined ? {} : {defense: {...entry.defense}}),
});

/**
 * A slot. `powerToSource` plus its kind — and it has to be spelled out, because this projection is
 * a whitelist rather than a spread: a field nobody adds here is silently dropped on save and the
 * character comes back subtly cheaper than the player left it.
 */
const slotToSource = (entry: AuthoredSlot): Record<string, unknown> => ({
    ...powerToSource(entry),
    ...(entry.variable === undefined ? {} : {variable: entry.variable}),
});

export const toSource = (draft: AuthoredCharacter): StoredSource => ({
    edition: draft.edition,
    name: draft.name,
    player: draft.player,
    budget: {...draft.budget},
    characteristics: {...draft.characteristics},
    skills: draft.skills.map(traitToSource),
    perks: draft.perks.map(traitToSource),
    talents: draft.talents.map(traitToSource),
    powers: draft.powers.map(powerToSource),
    martialArts: draft.martialArts.map(traitToSource),
    equipment: draft.equipment.map(powerToSource),
    frameworks: draft.frameworks.map((framework) => ({
        kind: framework.kind,
        name: framework.name,
        reserve: framework.reserve,
        modifiers: framework.modifiers.map(modifierToSource),
        slots: framework.slots.map(slotToSource),
    })),
    complications: draft.complications.map(traitToSource),
});
