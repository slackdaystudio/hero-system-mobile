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
 * What can be authored, read off the rules templates (docs/CHARACTER_AUTHORING.md).
 *
 * The `.hdt` entries are not just costs — they are the field definitions HERO Designer builds its
 * own dialogs from: `display`, `inputlabel`, `option` lists, `adder` lists, `required`,
 * `mincost`/`maxcost`, `minval`/`maxval`. This module is the one place that reads them, so the UI
 * renders a form it was told about rather than one somebody transcribed.
 *
 * **Nothing here states a cost that the engine will later compute.** An option's `basecost` is
 * carried through to the emitted trait because that is where the `.hdc` format puts it, but no
 * total is ever added up here — `spent()` asks the engine. Two sources of truth for a price is
 * exactly how the legacy `skillsets.json` came to disagree with itself.
 */
import {getTemplate} from 'core/templates';
import type {AuthoringEdition} from './types';

type Obj = Record<string, any>;

/**
 * The built-in template each edition authors against.
 *
 * Superheroic, matching what the generator builds and what the corpus mostly is. The genre
 * overlays (Heroic, Normal, Automaton…) differ only by which entries they remove, and offering
 * that choice is a Phase B decision — a draft records its edition, not its genre, so adding it
 * later is a new field rather than a reinterpretation of an old one.
 */
export const TEMPLATE_FOR: Readonly<Record<AuthoringEdition, string>> = {
    '5E': 'builtIn.Superheroic.hdt',
    '6E': 'builtIn.Superheroic6E.hdt',
};

export const templateFor = (edition: AuthoringEdition): string => TEMPLATE_FOR[edition];

const asArray = (value: unknown): Obj[] => (Array.isArray(value) ? (value as Obj[]) : value === null || value === undefined ? [] : [value as Obj]);

/** One choice within an adder that offers a list — "Common", "Very Common". */
export interface CatalogueOption {
    readonly xmlid: string;
    readonly display: string;
    /** What choosing it costs. Copied onto the emitted adder; never summed here. */
    readonly basecost: number;
}

/** An adder the player may (or must) answer on a trait. */
export interface CatalogueAdder {
    readonly xmlid: string;
    readonly display: string;
    /** The template says the trait is incomplete without it — the validator enforces this. */
    readonly required: boolean;
    readonly basecost: number;
    /** Non-empty when the adder is a pick-one; empty when it is a flat yes/no, levelled, or free text. */
    readonly options: readonly CatalogueOption[];
    /**
     * The adder's "option" is really a text field the player fills in.
     *
     * HERO Designer encodes this as a single option whose display is a bare opening bracket: the
     * stored `optionAlias` becomes `"(" + whatever the player typed`, and the reader strips the
     * bracket back off — `Complication.label()` literally does `.slice(1)`. There is exactly one
     * such adder in either edition's data (Rivalry's `DESCRIPTION`), so this is detected from the
     * data rather than hardcoded, but it is not a general mechanism and should not become one.
     */
    readonly freeText: boolean;
    /** The single option a free-text adder must still name when emitted; null otherwise. */
    readonly freeTextOption: CatalogueOption | null;
    /** Present when the adder is bought in levels rather than picked. */
    readonly levels: LevelRange | null;
}

/** The bounds a levelled field is allowed to take, straight from the template. */
export interface LevelRange {
    readonly min: number;
    readonly max: number;
    readonly perLevel: number;
    readonly label: string;
}

/** A complication the player may take. */
export interface CatalogueComplication {
    readonly xmlid: string;
    readonly display: string;
    /** The prompt for the free-text field — "Limitation", "Situation". Null when it takes none. */
    readonly inputLabel: string | null;
    readonly definition: string;
    readonly adders: readonly CatalogueAdder[];
    readonly levels: LevelRange | null;
}

const levelRangeOf = (entry: Obj, label: string): LevelRange | null => {
    if (typeof entry.lvlcost !== 'number' || typeof entry.lvlval !== 'number') {
        return null;
    }

    return {
        min: typeof entry.minval === 'number' ? entry.minval : 0,
        // `maxval` is usually absent and occasionally 999999999 — both mean "no ceiling worth
        // showing". A spinner needs *a* number, and one a player could plausibly reach.
        max: typeof entry.maxval === 'number' && entry.maxval < 1000 ? entry.maxval : 100,
        perLevel: entry.lvlcost,
        label: typeof entry.levelslabel === 'string' ? entry.levelslabel : label,
    };
};

const optionsOf = (adder: Obj): CatalogueOption[] =>
    asArray(adder.option).map((option) => ({
        xmlid: String(option.xmlid),
        display: String(option.display ?? option.xmlid),
        basecost: typeof option.basecost === 'number' ? option.basecost : 0,
    }));

/** The bracket-only option that marks a free-text adder — see {@link CatalogueAdder.freeText}. */
const FREE_TEXT_MARKER = '(';

const adderOf = (adder: Obj): CatalogueAdder => {
    const options = optionsOf(adder);
    const freeText = options.length === 1 && options[0].display.trim() === FREE_TEXT_MARKER;

    return {
        xmlid: String(adder.xmlid),
        display: String(adder.display ?? adder.xmlid),
        required: adder.required === true,
        basecost: typeof adder.basecost === 'number' ? adder.basecost : 0,
        // A free-text adder has nothing to pick from, so it offers no options to a chooser.
        options: freeText ? [] : options,
        freeText,
        freeTextOption: freeText ? options[0] : null,
        levels: levelRangeOf(adder, 'Levels'),
    };
};

/**
 * Every complication this edition defines, in template order.
 *
 * `GENERICDISADVANTAGE` is included: it is the escape hatch for a complication the rulebook has no
 * entry for, and the engine prices it from its adders like any other.
 */
export function complications(edition: AuthoringEdition): CatalogueComplication[] {
    const template = getTemplate(templateFor(edition)) as unknown as Obj;

    return asArray(template.disadvantages?.disad).map((entry) => ({
        xmlid: String(entry.xmlid),
        display: String(entry.display ?? entry.xmlid),
        inputLabel: typeof entry.inputlabel === 'string' ? entry.inputlabel : null,
        definition: typeof entry.definition === 'string' ? entry.definition : '',
        adders: asArray(entry.adder).map(adderOf),
        levels: levelRangeOf(entry, 'Levels'),
    }));
}

/** One complication by xmlid, or null when this edition has no such entry. */
export const complication = (xmlid: string, edition: AuthoringEdition): CatalogueComplication | null =>
    complications(edition).find((entry) => entry.xmlid === xmlid) ?? null;

/**
 * The characteristics this edition defines, in the order a sheet reads them.
 *
 * Asked of the template rather than hardcoded, for the reason `core/random/characteristics`
 * documents: a second list of what 6E has would be a copy of the template, free to drift from it.
 * The editions differ in both directions — COM is 5E-only, OCV/DCV/OMCV/DMCV are 6E-only — and
 * emitting a characteristic the template lacks is not survivable, so this list is the authority.
 */
export interface CatalogueCharacteristic {
    readonly key: string;
    readonly name: string;
    /** What the characteristic is before a point is spent — the floor a spinner starts from. */
    readonly base: number;
    /** Points per point of the characteristic. Indicative only; the engine prices the build. */
    readonly perPoint: number;
    readonly min: number;
    readonly max: number;
    /** True for Running/Swimming/Leaping — shown apart from the primaries. */
    readonly movement: boolean;
}

/** Ordered as HERO Designer writes them; see `core/random/characteristics` on why order matters. */
const CHARACTERISTIC_ORDER = [
    'str',
    'dex',
    'con',
    'body',
    'int',
    'ego',
    'pre',
    'com',
    'ocv',
    'dcv',
    'omcv',
    'dmcv',
    'spd',
    'pd',
    'ed',
    'rec',
    'end',
    'stun',
    'running',
    'swimming',
    'leaping',
] as const;

const MOVEMENT = new Set(['running', 'swimming', 'leaping']);

export function characteristics(edition: AuthoringEdition): CatalogueCharacteristic[] {
    const template = getTemplate(templateFor(edition)) as unknown as Obj;
    const defined = (template.characteristics ?? {}) as Obj;

    return CHARACTERISTIC_ORDER.filter((key) => defined[key] !== undefined).map((key) => {
        const entry = defined[key] as Obj;
        const base = typeof entry.base === 'number' ? entry.base : 0;

        return {
            key,
            name: String(entry.display ?? key.toUpperCase()),
            base,
            perPoint: typeof entry.lvlcost === 'number' && typeof entry.lvlval === 'number' && entry.lvlval !== 0 ? entry.lvlcost / entry.lvlval : 1,
            // `minval` is the floor in *levels*, so the lowest reachable total is base + minval.
            min: base + (typeof entry.minval === 'number' ? entry.minval : 0),
            max: base + (typeof entry.maxval === 'number' && entry.maxval < 10000 ? entry.maxval : 999),
            movement: MOVEMENT.has(key),
        };
    });
}
