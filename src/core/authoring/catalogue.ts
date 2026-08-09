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
import sensesData from 'core/data/herodesigner/Senses.json';
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
    powers: 'power',
    martialArts: 'maneuver',
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
    /**
     * The raw pair `perLevel` is the ratio of, carried because an **adder has no template**.
     *
     * A trait's decorator reads `trait.template.lvlval`, which `getCharacter` attaches. An adder's
     * decorator reads `adder.lvlval` directly off the adder — `totalAdders`, `variablePowerPool`,
     * `possession`, `leaping` and `reflection` all do — so the emitter has to write them, and
     * writing a derived `{lvlval: 1, lvlcost: perLevel}` instead is not safe: `baseCost` feeds the
     * same pair to `getMultiplierCost`, whose arithmetic is multiplicative rather than a ratio.
     */
    readonly lvlval: number;
    readonly lvlcost: number;
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
    /**
     * Adders of its own — one level deep, which is all the data has.
     *
     * Area Of Effect is the everyday case: it is a modifier with a Radius/Cone/Line option *and*
     * Selective/Nonselective/Explosion adders that change what it costs. Without these an AOE
     * prices as its bare option and quietly comes out cheap.
     */
    readonly adders: readonly CatalogueAdder[];
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
 * Powers whose decorators read fields no template declares, and which a generated form therefore
 * cannot fill in.
 *
 * `FORCEFIELD` is deliberately *not* here: it is the most-taken defensive power in the corpus and
 * granting it a declared field group (see {@link FIELD_GROUPS}) was cheaper than withholding it.
 * What each of these still wants:
 *
 * - `FORCEWALL` (Barrier) — a length/height/width/body box *and* the four-way defence split. It
 *   reads all eight off the trait and adds `undefined` without them, so it prices `NaN`.
 * - `DUPLICATION` — `points` and `number`; also `NaN` without them.
 * - `ENDURANCERESERVE` — a nested REC sub-power. It reads `trait.power.levels`, and there is no
 *   other trait in the catalogue whose cost depends on a *child* trait.
 * - `FLASH` — its adders are senses drawn from `Senses.json`, not from the template, and its
 *   `optionid` must name one. A different source than every other trait's option list.
 * - `COMPOUNDPOWER` — a power made of powers; open-ended by design.
 * - `VPP` — offered as a *framework* instead, which is what it is. Withheld only as a power.
 *
 * `MULTIFORM` and `SUMMON` were here too, on the evidence that they priced `NaN` once their adders
 * were answered. That turned out to be nothing to do with either of them: `emitAdder` did not carry
 * `lvlval`/`lvlcost`, which an adder needs because — unlike a trait — it is never given a
 * `template`. Fixing that priced both correctly, so both are offered.
 */
const BESPOKE_POWERS = ['COMPOUNDPOWER', 'VPP'];

/**
 * Traits that cannot be offered yet.
 *
 * **This list was most of the way wrong, and the correction is worth keeping.** It used to hold a
 * dozen skills and maneuvers on the stated grounds that "their decorators read fields no template
 * declares — Transport Familiarity's nested adder tree, Weapon Familiarity's category/member split,
 * Autofire Skills' per-skill list". Checking each decorator instead of trusting the comment:
 *
 * - Autofire Skills and Defense Maneuver price from `optionid` against `template.option` — which is
 *   the *ordinary* option mechanism every offered trait already uses.
 * - Two-Weapon Fighting returns a flat 10. It reads nothing at all.
 * - Rapid Attack returns 10, less 1 for an HTH/Ranged-only limitation.
 * - Weapon Familiarity, Transport Familiarity and Weapon Element price from their **adders**, which
 *   the form has always emitted correctly.
 * - Cramming and the custom* entries have no decorator whatsoever; they are `basecost` and `levels`.
 *
 * Not one of them needed a bespoke form. What they needed was a control for a **yes/no adder**,
 * which the trait form rendered as nothing — the same gap that made Damage Negation unbuildable and
 * stopped any attack buying a half-die, on traits that were already on offer. Fixing that unlocked
 * these for free.
 *
 * The lesson is the ledger's own, in a new place: **a "why we can't" comment is a hypothesis.** This
 * one was written once and believed for a release.
 *
 * What is genuinely left is {@link BESPOKE_POWERS}, and each entry there says what it wants.
 */
const BESPOKE = new Set([...BESPOKE_POWERS]);

/**
 * Extra numeric fields a specific trait needs that no template declares.
 *
 * The escape hatch for the per-power long tail, kept deliberately small and explicit. Each entry
 * is a field the engine reads straight off the trait, with no template to describe it — so the
 * only options are to declare it here, or to withhold the power and say why.
 */
export interface FieldGroup {
    /**
     * `defense` is the four-way split, stored as {@link AuthoredDefense} and emitted as
     * `pdlevels`/`edlevels`/`mdlevels`/`powdlevels` with `levels` derived from their sum.
     *
     * `levels` is the general case: each field's `key` **is** the trait field the engine reads, and
     * the answers ride on the power's `fields` map.
     */
    readonly kind: 'defense' | 'levels';
    readonly label: string;
    readonly fields: readonly FieldGroupField[];
    /**
     * Emit this group as a **nested power** rather than as fields on the trait itself.
     *
     * Endurance Reserve is the only one in either edition: its Recovery is a whole `<POWER
     * XMLID="ENDURANCERESERVEREC">` inside the reserve, and `EnduranceReserve.cost()` reads
     * `trait.power.levels` — the one place in the catalogue where a cost depends on a *child*
     * trait. Deliberately not generalised past "one sub-power carrying one number", because that
     * is all the data has; the same reasoning as the one-level cap on nested adders.
     */
    readonly subPower?: {readonly xmlid: string; readonly display: string; readonly levelsFrom: string};
}

export interface FieldGroupField {
    /** For a `levels` group this is the literal trait field — `lengthlevels`, `points`, `number`. */
    readonly key: string;
    readonly label: string;
    /** Bought in halves rather than whole units. Barrier's width is the only one. */
    readonly fractional?: boolean;
}

const DEFENCE_SPLIT: FieldGroup = {
    kind: 'defense',
    label: 'Points of resistant defence',
    fields: [
        {key: 'pd', label: 'rPD'},
        {key: 'ed', label: 'rED'},
        {key: 'mental', label: 'Mental'},
        {key: 'power', label: 'Power'},
    ],
};

/**
 * Extra numeric fields a specific trait needs, by edition.
 *
 * A trait can need more than one group — Barrier needs both a defence split and a set of
 * dimensions — so this returns a list.
 *
 * **Edition matters, and not only for the prices.** `Barrier.cost()` branches: 5E adds
 * `lengthlevels * 2` and `heightlevels * 2` and reads nothing else, while 6E adds length, height,
 * `bodylevels` and `widthlevels * 4 / costperinch`. Offering body and width in 5E would be two
 * controls that changed no number — the same fault as the variable Multipower slot before H13.
 *
 * HERO Designer does write all eight in both editions (5E's are simply zero — see `Fifth.hdc`),
 * but nothing here writes `.hdc`, so emitting only what the edition's decorator reads is the
 * honest shape.
 */
const fieldGroupsFor = (xmlid: string, edition: AuthoringEdition): readonly FieldGroup[] => {
    if (xmlid === 'FORCEFIELD') {
        // `getResistantDefense` and the unusual-defense queries read the four levels straight off
        // the trait. Emitted without them a Resistant Protection costs full price and grants no
        // defence at all — priced correctly, silently useless.
        return [DEFENCE_SPLIT];
    }

    if (xmlid === 'FORCEWALL') {
        return [
            DEFENCE_SPLIT,
            {
                kind: 'levels',
                label: edition === '5E' ? 'Size, in inches' : 'Size, in metres',
                fields:
                    edition === '5E'
                        ? [
                              {key: 'lengthlevels', label: 'Length'},
                              {key: 'heightlevels', label: 'Height'},
                          ]
                        : [
                              {key: 'lengthlevels', label: 'Length'},
                              {key: 'heightlevels', label: 'Height'},
                              {key: 'bodylevels', label: 'BODY'},
                              // A real `.hdc` carries `WIDTHLEVELS="1.5"`, so this one takes halves.
                              {key: 'widthlevels', label: 'Width', fractional: true},
                          ],
            },
        ];
    }

    if (xmlid === 'ENDURANCERESERVE') {
        // The reserve's END is the power's own `levels`, which every trait already has. Only the
        // Recovery needs declaring — and it is a nested power rather than a field, which is the
        // whole reason this one stayed withheld after the others.
        return [
            {
                kind: 'levels',
                label: 'How fast it refills',
                subPower: {xmlid: 'ENDURANCERESERVEREC', display: 'Recovery', levelsFrom: 'rec'},
                fields: [{key: 'rec', label: 'REC'}],
            },
        ];
    }

    if (xmlid === 'DUPLICATION') {
        return [
            {
                kind: 'levels',
                label: 'The duplicate',
                fields: [
                    {key: 'points', label: 'Points it is built on'},
                    // Priced by `getMultiplierCost`, so this is a count and every *doubling* costs
                    // 5 — 1 duplicate is free of multiplier cost, 2 is 5, 4 is 10.
                    {key: 'number', label: 'How many'},
                ],
            },
        ];
    }

    return [];
};

/**
 * A maneuver's combat line, as the template states it.
 *
 * Copied onto the emitted trait rather than left in the template, because `Maneuver` reads all of
 * it off the *trait* — a real `.hdc` writes it out per maneuver and the decorator was written
 * against that. A maneuver emitted without them renders with no OCV, no DCV and no effect.
 */
export interface ManeuverProfile {
    readonly ocv: number;
    readonly dcv: number;
    readonly dc: number;
    readonly phase: string;
    readonly effect: string;
    readonly weaponEffect: string;
    readonly category: string;
    readonly addStr: boolean;
    readonly activeCost: number;
    readonly killing: boolean;
}

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
    /** Non-null when the trait needs fields no template describes — see {@link FieldGroup}. */
    readonly fieldGroups: readonly FieldGroup[];
    /** Non-null for a martial maneuver: the combat line the sheet prints. */
    readonly maneuver: ManeuverProfile | null;
    /** True when the power may carry advantages and limitations. */
    readonly modifiable: boolean;
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
        lvlval: entry.lvlval,
        lvlcost: entry.lvlcost,
    };
};

/**
 * The senses, which are the one thing a trait can be built from that lives outside the templates.
 *
 * `Flash` is the only trait that reads them. Its `optionid` names the sense group it blinds, and
 * any *adder* whose xmlid is a sense adds another — but the templates declare no options for
 * `FLASH` at all, so a form built from the template alone offers nothing to pick and the decorator
 * reads `undefined`. That is what kept Flash withheld.
 *
 * Rather than give Flash a bespoke form, the senses are **injected as ordinary options and adders**.
 * Everything downstream then works untouched: the picker, `emitTrait`'s `option`/`optionid`/
 * `optionAlias`, `emitAdder`, and the validator's "needs one of" rule. The data was missing, not
 * the mechanism.
 */
const SENSES = sensesData as unknown as {sensegroup: Obj[]; sense: Obj[]};

/**
 * What a Flash can blind, as a pick-one.
 *
 * **Groups only.** Every one of the 11 Flashes in the corpus names a group, and the decorator
 * charges `targetingcost * levels` for the primary sense whether it is a group or a single sense —
 * so offering "Normal Sight" would charge the price of the whole Sight Group for one sense of it.
 * The template carries `targetinghalfcost`/`nontargetinghalfcost` that nothing reads, which is
 * probably where a single sense was meant to be priced; until that is settled, offering it would be
 * offering a wrong number.
 *
 * `basecost` is 0 because a Flash's price is per level, computed by its own decorator from the
 * template's `targetingcost`. Nothing copies an option's basecost onto a trait — only onto an adder.
 */
const senseGroupOptions = (): CatalogueOption[] =>
    SENSES.sensegroup.map((group) => ({xmlid: String(group.xmlid), display: String(group.display ?? group.xmlid), basecost: 0, perLevel: null}));

/**
 * The extra senses a Flash may also blind, as yes/no adders.
 *
 * Groups *and* individual senses, because here the decorator does tell them apart —
 * `targetinggroupcost` (10) against `targetingsensecost` (5). Their `basecost` is 0 for the same
 * reason as above: `Flash.cost()` prices a sense adder from the template, never from the adder.
 *
 * The template's own two adders are deliberately **not** offered. `Flash.cost()` overrides `cost()`
 * outright and never calls `totalAdders`, so Alterable Origin and Reduced Negation contribute
 * nothing on a Flash — they would be controls that changed no number, which is the fault H13's
 * variable slot had.
 */
const senseAdders = (): CatalogueAdder[] =>
    [...SENSES.sensegroup, ...SENSES.sense].map((sense) => ({
        xmlid: String(sense.xmlid),
        display: String(sense.display ?? sense.xmlid),
        required: false,
        basecost: 0,
        options: [],
        freeText: false,
        freeTextOption: null,
        levels: null,
        adders: [],
    }));

const optionsOf = (entry: Obj): CatalogueOption[] =>
    asArray(entry.option).map((option) => ({
        xmlid: String(option.xmlid),
        display: String(option.display ?? option.xmlid),
        basecost: typeof option.basecost === 'number' ? option.basecost : 0,
        perLevel: typeof option.lvlcost === 'number' && typeof option.lvlval === 'number' && option.lvlval !== 0 ? option.lvlcost / option.lvlval : null,
    }));

/** The bracket-only option that marks a free-text adder — see {@link CatalogueAdder.freeText}. */
const FREE_TEXT_MARKER = '(';

/**
 * `depth` guards the one level of nesting the data has. It is never passed positionally from a
 * `.map` — `Array.prototype.map` hands the index in as the second argument, which silently reads
 * as "you are already nested" for every entry but the first.
 */
const adderOf = (adder: Obj, depth: 0 | 1 = 0): CatalogueAdder => {
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
        // One level only. The data never nests further, and a form that recursed arbitrarily would
        // be describing a shape the rules do not have.
        adders: depth === 1 ? [] : asArray(adder.adder).map((nested) => adderOf(nested, 1)),
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

const maneuverProfileOf = (entry: Obj): ManeuverProfile | null => {
    if (typeof entry.phase !== 'string' || typeof entry.effect !== 'string') {
        return null;
    }

    return {
        ocv: typeof entry.ocv === 'number' ? entry.ocv : 0,
        dcv: typeof entry.dcv === 'number' ? entry.dcv : 0,
        dc: typeof entry.dc === 'number' ? entry.dc : 0,
        phase: entry.phase,
        effect: entry.effect,
        weaponEffect: typeof entry.weaponeffect === 'string' ? entry.weaponeffect : '',
        category: typeof entry.category === 'string' ? entry.category : '',
        // The template writes "Y"/"N" here where a parsed `.hdc` carries a boolean.
        addStr: entry.addstr === true || entry.addstr === 'Y',
        activeCost: typeof entry.activecost === 'number' ? entry.activecost : 0,
        killing: entry.killing === true,
    };
};

function traitOf(entry: Obj, category: AuthorableCategory, edition: AuthoringEdition): CatalogueTrait {
    const xmlid = String(entry.xmlid);
    const choices = characteristicChoicesOf(entry);
    // Flash is built from the senses rather than from its own entry — see `SENSES`. It is the only
    // trait in either edition whose choices come from outside the templates.
    const options = xmlid === 'FLASH' ? senseGroupOptions() : optionsOf(entry);
    const adders = xmlid === 'FLASH' ? senseAdders() : asArray(entry.adder).map((adder) => adderOf(adder));
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
        fieldGroups: fieldGroupsFor(xmlid, edition),
        maneuver: category === 'martialArts' ? maneuverProfileOf(entry) : null,
        // Only powers take advantages and limitations. A skill with an advantage is not a thing.
        modifiable: category === 'powers',
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
        traits.push(traitOf(entry, category, edition));
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

/**
 * The advantages and limitations that may be put on a power.
 *
 * One flat list rather than two, because which is which is not a property of the modifier — it is
 * the sign of what it ends up costing, and an option can flip it (Limited Power is a limitation;
 * some of its options are worth less than others). `ModifierCalculator` splits them on the
 * computed cost for exactly that reason, and so should anything showing them.
 */
export function modifiers(edition: AuthoringEdition): CatalogueAdder[] {
    const template = heroDesignerCharacter.normalizedTemplate(templateFor(edition));
    const seen = new Set<string>();

    return asArray(template.modifiers?.modifier)
        .filter((entry) => {
            const xmlid = String(entry.xmlid);

            return seen.has(xmlid) ? false : (seen.add(xmlid), true);
        })
        .map((entry) => adderOf(entry));
}

/** One modifier by xmlid, or null when this edition has no such thing. */
export const modifier = (xmlid: string, edition: AuthoringEdition): CatalogueAdder | null =>
    modifiers(edition).find((entry) => entry.xmlid === xmlid) ?? null;

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
