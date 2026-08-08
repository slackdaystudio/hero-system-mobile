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
 * `characteristicChoice`, `familiarityroll`, `minval`/`maxval`. This module is the one place that
 * reads them, so the UI renders a form it was told about rather than one somebody transcribed.
 *
 * **Nothing here states a cost that the engine will later compute.** An option's `basecost` is
 * carried through to the emitted trait because that is where the `.hdc` format puts it, but no
 * total is ever added up here — `spendOf` asks the engine. Two sources of truth for a price is
 * exactly how the legacy `skillsets.json` came to disagree with itself.
 *
 * Entries come from `heroDesignerCharacter.normalizedTemplate`, not from `getTemplate` directly,
 * because an entry's xmlid is often *derived* from the sub-key it sits under (`knowledgeSkill` →
 * `KNOWLEDGE_SKILL`). Deriving it here as well is how a catalogue comes to offer a trait the
 * engine cannot match.
 */
import {heroDesignerCharacter} from 'core/hero';
import {getTemplate} from 'core/templates';
import type {AuthoringEdition} from './types';

type Obj = Record<string, any>;

/**
 * The built-in template each edition authors against.
 *
 * Superheroic, matching what the generator builds and what the corpus mostly is. The genre
 * overlays (Heroic, Normal, Automaton…) differ only by which entries they remove, and offering
 * that choice is a later decision — a draft records its edition, not its genre, so adding it later
 * is a new field rather than a reinterpretation of an old one.
 */
export const TEMPLATE_FOR: Readonly<Record<AuthoringEdition, string>> = {
    '5E': 'builtIn.Superheroic.hdt',
    '6E': 'builtIn.Superheroic6E.hdt',
};

export const templateFor = (edition: AuthoringEdition): string => TEMPLATE_FOR[edition];

const asArray = (value: unknown): Obj[] => (Array.isArray(value) ? (value as Obj[]) : value === null || value === undefined ? [] : [value as Obj]);

/** The trait categories that can be authored, and the sub-key each keeps its entries under. */
export const AUTHORABLE_CATEGORIES = {
    skills: 'skill',
    perks: 'perk',
    talents: 'talent',
    disadvantages: 'disad',
} as const;

export type AuthorableCategory = keyof typeof AUTHORABLE_CATEGORIES;

/** One choice within an option list — "Common", "completely fluent", "with all Agility Skills". */
export interface CatalogueOption {
    readonly xmlid: string;
    readonly display: string;
    /** What choosing it costs. Copied onto the emitted trait/adder; never summed here. */
    readonly basecost: number;
    /**
     * Present when picking this option changes the *per-level* price rather than a flat cost.
     *
     * Skill Levels are the case: "with any three pre-defined Skills" is 3 points a level where
     * "with a single Skill or Characteristic Roll" is 2. The engine reads it off the template;
     * it rides here so a form can say what a choice costs before it is made.
     */
    readonly perLevel: number | null;
}

/** The bounds a levelled field is allowed to take, straight from the template. */
export interface LevelRange {
    readonly min: number;
    readonly max: number;
    readonly perLevel: number;
    readonly label: string;
}

/** A characteristic a skill may be based on, and what it costs on that characteristic. */
export interface CatalogueCharacteristicChoice {
    /** `DEX`, `INT`, or `GENERAL` for a skill that rolls a flat 11-. */
    readonly characteristic: string;
    readonly basecost: number;
    readonly perLevel: number;
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

/**
 * Why a trait cannot be offered yet.
 *
 * Stated rather than silently filtered, because a catalogue that quietly drops part of the
 * rulebook reads to a player as "the app doesn't have Weapon Familiarity" rather than "not yet".
 * The UI counts them; see the "no silent caps" note in docs/CHARACTER_AUTHORING.md.
 */
export type Unsupported =
    /** Its decorator reads fields the template never declares, so a generic form cannot fill them. */
    | 'bespoke'
    /** Nothing in the entry says what it costs — it is priced entirely by its own decorator. */
    | 'unpriced';

/**
 * Traits whose decorators read fields no template declares.
 *
 * Each is a `core/traits` class with its own idea of what the trait carries — Transport
 * Familiarity's nested adder tree, Weapon Familiarity's category/member split, Autofire Skills'
 * per-skill list. A generic form cannot produce those, and producing them *badly* is worse than
 * not offering them: the engine prices a malformed trait at 0 rather than refusing it.
 *
 * The custom* entries are here for the opposite reason — they are deliberately open-ended, and
 * what they need is a bespoke "write your own" form rather than a generated one.
 *
 * Shrinking this list is the substance of a later phase, one decorator at a time.
 */
const BESPOKE = new Set([
    'AUTOFIRE_SKILLS',
    'CRAMMING',
    'CUSTOMSKILL',
    'CUSTOMPERK',
    'CUSTOMTALENT',
    'DEFENSE_MANEUVER',
    'RAPID_ATTACK_HTH',
    'TRANSPORT_FAMILIARITY',
    'TWO_WEAPON_FIGHTING_HTH',
    'WEAPON_FAMILIARITY',
    // 5E spells two of them differently for the same decorators.
    'RAPID_ATTACK',
    'TWO_WEAPON_FIGHTING',
]);

/** A trait the player may take, with everything a form needs to render it. */
export interface CatalogueTrait {
    readonly category: AuthorableCategory;
    readonly xmlid: string;
    readonly display: string;
    readonly definition: string;
    /** The prompt for the free-text field — "Language", "Contact Name". Null when it takes none. */
    readonly inputLabel: string | null;
    /**
     * What the entry costs before levels, options and adders.
     *
     * Emitted onto the trait, because that is where a real `.hdc` puts it and where
     * `CharacterTrait.cost()` reads it — the template is consulted for *per-level* prices but never
     * for the base. A trait emitted without it prices at 0 and still renders, which is how a
     * 3-point Talent becomes free.
     */
    readonly basecost: number;
    /** The characteristics this skill may roll against; empty for anything that is not a skill roll. */
    readonly characteristics: readonly CatalogueCharacteristicChoice[];
    /** The entry's own pick-one list — a Language's fluency, a Skill Level's breadth. */
    readonly options: readonly CatalogueOption[];
    readonly adders: readonly CatalogueAdder[];
    readonly levels: LevelRange | null;
    /** Non-null when the skill may be taken at familiarity — an 8- roll for a reduced cost. */
    readonly familiarity: {readonly roll: number; readonly cost: number} | null;
    /** Null when it can be authored; otherwise why not. */
    readonly unsupported: Unsupported | null;
}

const levelRangeOf = (entry: Obj, label: string): LevelRange | null => {
    if (typeof entry.lvlcost !== 'number' || typeof entry.lvlval !== 'number' || entry.lvlval === 0) {
        return null;
    }

    return {
        // `minval` is occasionally deeply negative (Skill Levels declare -99). A floor of 0 is what
        // a player can actually buy; a negative number of levels is not a thing a form can offer.
        min: typeof entry.minval === 'number' && entry.minval > 0 ? entry.minval : 0,
        // `maxval` is usually absent and occasionally 999999999 — both mean "no ceiling worth
        // showing". A spinner needs *a* number, and one a player could plausibly reach.
        max: typeof entry.maxval === 'number' && entry.maxval < 1000 ? entry.maxval : 100,
        perLevel: entry.lvlcost / entry.lvlval,
        label: typeof entry.levelslabel === 'string' ? entry.levelslabel : label,
    };
};

const optionsOf = (entry: Obj): CatalogueOption[] =>
    asArray(entry.option).map((option) => ({
        xmlid: String(option.xmlid),
        display: String(option.display ?? option.xmlid),
        basecost: typeof option.basecost === 'number' ? option.basecost : 0,
        perLevel: typeof option.lvlcost === 'number' && typeof option.lvlval === 'number' && option.lvlval !== 0 ? option.lvlcost / option.lvlval : null,
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
 * The characteristics a skill may be bought against.
 *
 * `characteristicChoice.item` is one object or an array of them, each naming a characteristic with
 * its own base and per-level cost — Acrobatics is DEX only, but a Knowledge Skill can be INT or
 * GENERAL, and the two are not the same price.
 */
const characteristicChoicesOf = (entry: Obj): CatalogueCharacteristicChoice[] =>
    asArray(entry.characteristicChoice?.item).map((item) => ({
        characteristic: String(item.characteristic),
        basecost: typeof item.basecost === 'number' ? item.basecost : 0,
        perLevel: typeof item.lvlcost === 'number' && typeof item.lvlval === 'number' && item.lvlval !== 0 ? item.lvlcost / item.lvlval : 0,
    }));

function traitOf(entry: Obj, category: AuthorableCategory): CatalogueTrait {
    const xmlid = String(entry.xmlid);
    const choices = characteristicChoicesOf(entry);
    const options = optionsOf(entry);
    const adders = asArray(entry.adder).map(adderOf);
    const levels = levelRangeOf(entry, 'Levels');
    const priced = typeof entry.basecost === 'number' || levels !== null || choices.length > 0 || options.length > 0 || adders.length > 0;

    return {
        category,
        xmlid,
        display: String(entry.display ?? xmlid),
        definition: typeof entry.definition === 'string' ? entry.definition : '',
        inputLabel: typeof entry.inputlabel === 'string' ? entry.inputlabel : null,
        basecost: typeof entry.basecost === 'number' ? entry.basecost : 0,
        characteristics: choices,
        options,
        adders,
        levels,
        familiarity: typeof entry.familiarityroll === 'number' && typeof entry.familiaritycost === 'number' ? {roll: entry.familiarityroll, cost: entry.familiaritycost} : null,
        unsupported: BESPOKE.has(xmlid) ? 'bespoke' : priced ? null : 'unpriced',
    };
}

/**
 * Every entry a category defines in an edition, de-duplicated and in template order.
 *
 * De-duplication is not optional: `normalizedTemplate` concatenates the entries it collected onto
 * the array they partly came from, so each plainly-declared skill appears twice.
 */
export function catalogue(category: AuthorableCategory, edition: AuthoringEdition): CatalogueTrait[] {
    const template = heroDesignerCharacter.normalizedTemplate(templateFor(edition));
    const seen = new Set<string>();
    const traits: CatalogueTrait[] = [];

    for (const entry of asArray(template[category]?.[AUTHORABLE_CATEGORIES[category]])) {
        const xmlid = String(entry.xmlid);

        if (seen.has(xmlid)) {
            continue;
        }

        seen.add(xmlid);
        traits.push(traitOf(entry, category));
    }

    return traits;
}

/** The entries a player may actually take — everything the generic form can render. */
export const authorable = (category: AuthorableCategory, edition: AuthoringEdition): CatalogueTrait[] =>
    catalogue(category, edition).filter((entry) => entry.unsupported === null);

/** The entries deliberately withheld, so a caller can say how many rather than quietly drop them. */
export const withheld = (category: AuthorableCategory, edition: AuthoringEdition): CatalogueTrait[] =>
    catalogue(category, edition).filter((entry) => entry.unsupported !== null);

/** One entry by xmlid, or null when this edition has no such thing. */
export const trait = (xmlid: string, category: AuthorableCategory, edition: AuthoringEdition): CatalogueTrait | null =>
    catalogue(category, edition).find((entry) => entry.xmlid === xmlid) ?? null;

/** Complications, kept as its own name because the UI and the rules both call them that. */
export const complications = (edition: AuthoringEdition): CatalogueTrait[] => catalogue('disadvantages', edition);

/** One complication by xmlid, or null when this edition has no such entry. */
export const complication = (xmlid: string, edition: AuthoringEdition): CatalogueTrait | null => trait(xmlid, 'disadvantages', edition);

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
    // The un-normalized template on purpose: normalization moves Running/Swimming/Leaping into
    // `powers`, and this list wants the characteristics where a character sheet keeps them.
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
