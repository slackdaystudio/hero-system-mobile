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
 * Turn an {@link AuthoredCharacter} into the `ParsedCharacter` the engine reads
 * (docs/CHARACTER_AUTHORING.md).
 *
 * The engine was written to consume the output of an XML parser, and it relies on that parser's
 * habits. Four of them are not optional, and each cost a debugging session to find:
 *
 *  1. **Every trait category key must be present.** `populateTrait` guards `null` but not
 *     `undefined`, so a missing `perks` throws `Cannot read properties of undefined`. The `.hdc`
 *     parser always emits all seven; so does this.
 *  2. **`name` must be `null`, not absent.** `xml2js` is configured `emptyTag: null`, so an empty
 *     `NAME=""` arrives as `null` and the label code reads it as "no name". Omit the key entirely
 *     and the label renders the literal string `"undefined (Acrobatics)"`.
 *  3. **`alias` is author-supplied.** The engine prints it and never derives it from the template,
 *     so it is copied from the template's `display` here. Same for an adder's `optionAlias`.
 *  4. **Ids must be stable and unique.** They are what `parentid` resolves against and what the
 *     golden master's canonical ordering sorts by. They are derived from position, not from a
 *     counter or a clock, so emitting the same draft twice gives the same document.
 *
 * Pure: same draft in, same `ParsedCharacter` out, every time. That is what makes an authored
 * character re-openable — the stored source rebuilds byte-for-byte what was saved.
 */
import type {ParsedCharacter} from 'core/hero';
import {getTemplate} from 'core/templates';
import {heroDesignerCharacter} from 'core/hero';
import {templateFor, trait, type AuthorableCategory, type CatalogueAdder} from './catalogue';
import type {AuthoredAdder, AuthoredCharacter, AuthoredTrait, AuthoringEdition} from './types';

type Obj = Record<string, any>;

/**
 * Id blocks, one per category, so a complication and a power can never collide.
 *
 * Deliberately small and readable rather than timestamp-shaped like HERO Designer's own. Nothing
 * reads meaning from an id — it only has to be unique within the character and stable across
 * emits.
 */
const ID_BASE: Readonly<Record<string, number>> = {
    characteristics: 1000,
    skills: 2000,
    perks: 3000,
    talents: 4000,
    disadvantages: 5000,
};

/**
 * Insertion order is load-bearing: `populateMovementAndCharacteristics` walks the object in key
 * order and 5E's figured characteristics read the *already populated* primaries. The template's
 * own key order is alphabetical, which would put `ed` before `ego` and feed the figured maths an
 * unpopulated primary. See `core/random/characteristics`, which learned this first.
 */
const PRIMARY = ['str', 'dex', 'con', 'body', 'int', 'ego', 'pre', 'com'] as const;
const COMBAT = ['ocv', 'dcv', 'omcv', 'dmcv'] as const;
const DERIVED = ['pd', 'ed', 'spd', 'rec', 'end', 'stun'] as const;
const MOVEMENT = ['running', 'swimming', 'leaping'] as const;
const CHARACTERISTIC_ORDER = [...PRIMARY, ...COMBAT, ...DERIVED, ...MOVEMENT] as const;

const definedBy = (template: string): ReadonlySet<string> =>
    new Set(Object.keys((getTemplate(template) as unknown as {characteristics?: Obj}).characteristics ?? {}));

const characteristicEntry = (key: string, levels: number, position: number): Obj => ({
    xmlid: key.toUpperCase(),
    id: ID_BASE.characteristics + position,
    alias: key.toUpperCase(),
    levels,
    basecost: 0,
    position,
    multiplier: 1,
    name: null,
    affectsPrimary: true,
    affectsTotal: true,
    notes: null,
});

/** The `.hdc` boilerplate every emitted adder carries, so the data says only what the player chose. */
const ADDER_DEFAULTS: Obj = {basecost: 0, levels: 0, position: -1, multiplier: 1, name: null, notes: null};

/**
 * One adder, priced and labelled from the template.
 *
 * The chosen option's `basecost` is copied onto the adder because that is where the `.hdc` format
 * carries it and where `totalAdders` reads it. It is copied at emit time rather than stored on the
 * draft so a template correction re-prices old drafts instead of preserving a stale number.
 */
function emitAdder(chosen: AuthoredAdder, catalogue: CatalogueAdder | undefined): Obj {
    const base = {
        ...ADDER_DEFAULTS,
        xmlid: chosen.xmlid,
        alias: catalogue?.display ?? chosen.xmlid,
        basecost: catalogue?.basecost ?? 0,
        ...(chosen.levels === undefined ? {} : {levels: chosen.levels}),
    };

    // A free-text adder still names its single option, but its `optionAlias` carries the player's
    // words behind an opening bracket — which is why the reader slices the first character off.
    // See CatalogueAdder.freeText; Rivalry's description is the only one in either edition.
    if (catalogue?.freeText === true && catalogue.freeTextOption !== null) {
        return {
            ...base,
            basecost: catalogue.freeTextOption.basecost,
            option: catalogue.freeTextOption.xmlid,
            optionid: catalogue.freeTextOption.xmlid,
            optionAlias: `(${chosen.text ?? ''}`,
        };
    }

    const option = catalogue?.options.find((candidate) => candidate.xmlid === chosen.option);

    return option === undefined
        ? base
        : {
              ...base,
              basecost: option.basecost,
              option: option.xmlid,
              optionid: option.xmlid,
              // Read by the writeup, and by RIVALRY's label. A missing optionAlias there throws,
              // and the sheet degrades the row to a cost-0 stub rather than showing an error.
              optionAlias: option.display,
          };
}

const TRAIT_DEFAULTS: Obj = {
    multiplier: 1,
    name: null,
    notes: null,
    affectsPrimary: true,
    affectsTotal: true,
};

/**
 * One trait — skill, perk, talent or complication — in the shape the engine reads.
 *
 * All four go through here because the `.hdc` format makes no structural distinction between them:
 * an xmlid, optional free text, an optional pick-one, levels, and adders. What differs is which of
 * those the template declares, and the catalogue already answers that.
 *
 * **`levels` is always emitted, and always a number.** `Roll` computes a skill roll as
 * `base + trait.levels`, unguarded — an absent `levels` makes that `NaN` and the sheet prints
 * "NaN-" rather than failing. Most other numeric fields can be left out; this one cannot.
 */
function emitTrait(authored: AuthoredTrait, category: AuthorableCategory, position: number, edition: AuthoringEdition): Obj {
    const catalogue = trait(authored.xmlid, category, edition);
    const option = catalogue?.options.find((candidate) => candidate.xmlid === authored.option);

    return {
        ...TRAIT_DEFAULTS,
        xmlid: authored.xmlid,
        id: ID_BASE[category] + position,
        alias: catalogue?.display ?? authored.xmlid,
        position,
        // From the template, because that is where a real `.hdc` gets it. `CharacterTrait.cost()`
        // reads the *trait's* basecost and never the template's, so a 3-point Talent emitted
        // without it costs nothing and still renders — the silent-zero trap, from the inside.
        basecost: catalogue?.basecost ?? 0,
        levels: authored.levels ?? 0,
        // `input` drives the sheet label ("Psychological: Code Of The Hero", "Language: French").
        // The engine keys on the property *existing*, so an unanswered one is omitted rather than
        // sent as an empty string.
        ...(authored.input.trim() === '' ? {} : {input: authored.input.trim()}),
        // `Skill.cost()` reads `characteristic` to find its price in the template's
        // characteristicChoice, and `Roll` reads it to find what the skill rolls against.
        ...(authored.characteristic === undefined ? {} : {characteristic: authored.characteristic}),
        // Truthiness is what the decorators test, so an unticked box is omitted rather than false —
        // matching a real `.hdc`, where FAMILIARITY="No" parses to the boolean.
        ...(authored.familiarity === true ? {familiarity: true} : {}),
        ...(option === undefined ? {} : {option: option.xmlid, optionid: option.xmlid, optionAlias: option.display}),
        adder: authored.adders.map((adder) =>
            emitAdder(
                adder,
                catalogue?.adders.find((candidate) => candidate.xmlid === adder.xmlid),
            ),
        ),
    };
}

/** A `ParsedCharacter` at the given characteristic *levels* — the shape the engine consumes. */
function parsedFrom(draft: AuthoredCharacter, levels: Record<string, number>): ParsedCharacter {
    const template = templateFor(draft.edition);
    const defined = definedBy(template);
    const characteristics: Obj = {};
    let position = 0;

    for (const key of CHARACTERISTIC_ORDER) {
        if (defined.has(key)) {
            characteristics[key] = characteristicEntry(key, levels[key] ?? 0, position);
            position += 1;
        }
    }

    return {
        version: 6,
        template,
        characterInfo: {
            characterName: draft.name,
            playerName: draft.player,
            alternateIdentities: '',
            height: '',
            weight: '',
            campaignName: '',
            genre: '',
            gm: '',
        },
        characteristics,
        // All seven present, every time — `populateTrait` throws on `undefined`, not on `null`.
        skills: {skill: draft.skills.map((entry, index) => emitTrait(entry, 'skills', index, draft.edition))},
        perks: {perk: draft.perks.map((entry, index) => emitTrait(entry, 'perks', index, draft.edition))},
        talents: {talent: draft.talents.map((entry, index) => emitTrait(entry, 'talents', index, draft.edition))},
        martialarts: {},
        powers: {},
        equipment: {},
        disadvantages: {disad: draft.complications.map((entry, index) => emitTrait(entry, 'disadvantages', index, draft.edition))},
    } as unknown as ParsedCharacter;
}

const totalOf = (character: Obj, key: string): number =>
    (character.characteristics as Obj[]).find((entry) => String(entry.shortName).toLowerCase() === key)?.value ?? 0;

const has = (character: Obj, key: string): boolean =>
    (character.characteristics as Obj[]).some((entry) => String(entry.shortName).toLowerCase() === key);

/**
 * Emit the engine's input for a draft.
 *
 * A draft states characteristics as **totals** — what a player reads off a sheet — but the `.hdc`
 * stores *levels bought above base*, and in 5E the base itself is figured from other
 * characteristics (ED from CON, STUN from BODY+STR+CON, and so on). Rather than reimplement that,
 * the draft is emitted at zero, priced by the engine, and the levels read back as
 * `target − whatever the engine says base is`. `value = levels + <base and figured terms>` holds
 * for every characteristic whatever its formula, so one probe settles all of them.
 *
 * Two passes because the figured characteristics read the primaries: pass one settles the
 * primaries, pass two reads the figured bases those imply. 6E figures nothing, so its second pass
 * is a no-op — one code path rather than an edition branch.
 */
export function emit(draft: AuthoredCharacter): ParsedCharacter {
    const levels: Record<string, number> = {};
    const probe = (): Obj => heroDesignerCharacter.getCharacter(parsedFrom(draft, levels)) as unknown as Obj;

    const settle = (keys: readonly string[], character: Obj): void => {
        for (const key of keys) {
            const target = draft.characteristics[key];

            if (target === undefined || !has(character, key)) {
                continue;
            }

            levels[key] = target - totalOf(character, key);
        }
    };

    settle([...PRIMARY, ...COMBAT, ...MOVEMENT], probe());
    settle(DERIVED, probe());

    return parsedFrom(draft, levels);
}

/** Emit and price in one step — the document the app stores and the sheet renders. */
export const build = (draft: AuthoredCharacter): Obj => heroDesignerCharacter.getCharacter(emit(draft)) as unknown as Obj;
