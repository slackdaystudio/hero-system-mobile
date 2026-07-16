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

import {combatDetails} from 'core/combat';
import {RollType} from 'core/dice';
import {enduranceCost, heroDesignerCharacter, movementEnduranceCost, strengthEnduranceCost} from 'core/hero';
import {characterTraitDecorator, type Attribute, type Obj, type RollDescriptor, type Writeup} from 'core/traits';
import type {CharacterDocument} from 'core/ports';

/** HERO Designer XMLID of the "Only In Heroic/Alternate Identity" limitation. */
const ONLY_IN_ALTERNATE_ID = 'OIHID';

const TRAIT_KEYS = ['skills', 'perks', 'talents', 'martialArts', 'powers', 'equipment', 'disadvantages'] as const;

const asModifiers = (value: unknown): Obj[] => (Array.isArray(value) ? (value as Obj[]) : value !== null && typeof value === 'object' ? [value as Obj] : []);

/** True when a trait carries the "Only In Alternate Identity" (OIHID) limitation (checks nested modifiers). */
export function isOnlyInAlternateId(trait: Obj): boolean {
    for (const modifier of asModifiers(trait.modifier)) {
        if (String(modifier.xmlid).toUpperCase() === ONLY_IN_ALTERNATE_ID || isOnlyInAlternateId(modifier)) {
            return true;
        }
    }

    return false;
}

const filterOutAlternateId = (items: Obj[]): Obj[] =>
    items
        .filter((item) => !isOnlyInAlternateId(item))
        .map((item) => (Array.isArray(item.powers) ? {...item, powers: filterOutAlternateId(item.powers as Obj[])} : item));

/**
 * True when `predicate` holds for any trait in `items`, or for any trait nested inside
 * one (framework slots, compound powers). Mirrors the descent `filterOutAlternateId`
 * does — `core/util.flatten` is not a substitute, as it only splices `type: 'list'`
 * containers and never visits the children of anything else.
 */
const someTrait = (items: Obj[], predicate: (item: Obj) => boolean): boolean =>
    items.some((item) => predicate(item) || (Array.isArray(item.powers) ? someTrait(item.powers as Obj[], predicate) : false));

/**
 * A copy of the character with every "Only In Alternate Identity" trait removed
 * (recursively, incl. framework slots). Because the engine reads the trait lists,
 * this drops those traits from *everything* derived — characteristics, defenses,
 * combat values, and movement totals — not just their sheet rows. Used to render
 * the base (secret-ID) form.
 */
function withoutAlternateIdTraits(character: Obj): Obj {
    const stripped: Obj = {...character};
    for (const key of TRAIT_KEYS) {
        if (Array.isArray(character[key])) {
            stripped[key] = filterOutAlternateId(character[key] as Obj[]);
        }
    }

    return stripped;
}

/**
 * True when any trait is limited to the alternate identity (OIHID) — the only thing
 * that gates the alternate-ID toggle. Secondary characteristics deliberately do *not*
 * count: they are situational boosts (Density Increase, Growth) with no second identity
 * to switch to, so for those characters the sheet shows the alternate-ID form outright.
 */
export function hasAlternateForm(character: Obj): boolean {
    return TRAIT_KEYS.some((key) => someTrait(toArray(character[key]), isOnlyInAlternateId));
}

/** The character's alias / alternate identity (super name) from the parsed info, or null. */
export function alternateIdentities(document: CharacterDocument): string | null {
    const info = (document as {characterInfo?: {alternateIdentities?: unknown}}).characterInfo;
    const alias = info?.alternateIdentities;

    return typeof alias === 'string' && alias.trim() !== '' ? alias : null;
}

/** Display-ready view of a parsed HeroDesigner character (see the trait engine in core). */
export interface SheetCharacteristic {
    name: string;
    total: number;
    roll: string | null;
    cost: number;
    /**
     * The Normal Damage this characteristic's own value does — **STR only**, and null everywhere else.
     *
     * A `RollDescriptor` rather than a bare `"12d6"` string so the row dispatches through exactly the
     * path a maneuver's damage does (`traitRollRequest`): tap opens the roller pre-filled, long-press
     * rolls inline and records the stat, both for free. The string is right there on `.roll` for the
     * sheet to print.
     */
    damage: RollDescriptor | null;
    /** END to use this characteristic — **STR only** (1 per 10 STR, min 1), null everywhere else. */
    endurance: number | null;
}

/** The combat line for a martial-arts maneuver: strike (OCV), evasion (DCV), range, damage, notes. */
export interface ManeuverDetail {
    ocv: string | null;
    dcv: string | null;
    range: string | null;
    damage: string | null;
    notes: string;
}

export interface SheetTrait {
    label: string;
    roll: RollDescriptor | null;
    realCost: number;
    /** END this power costs to use (6E, 1 per 10 Active Points), or 0 when it costs none. */
    endurance: number;
    definition: string;
    /** 0 for a top-level trait, 1+ for framework/compound children. */
    depth: number;
    /** The mechanical stat block — the flip-card front (definition is the back). */
    writeup: Writeup;
    /** Present for martial-arts maneuvers — drives the two-row combat table. */
    maneuver?: ManeuverDetail;
}

const MANEUVER_MAIN = new Set(['Name', 'OCV', 'DCV', 'Range', 'Effect']);

const maneuverValue = (attributes: Attribute[], label: string): string | null => {
    const found = attributes.find((attribute) => attribute.label === label);
    return found === undefined ? null : String(found.value);
};

/**
 * A "simple damage code" is an effect that is *only* a damage expression — dice
 * plus damage-type keywords (e.g. "16d6 Strike", "Flash 7d6", "3½d6 NND",
 * "HKA 5 DC"). Anything with extra descriptive text (Grab, Disarm, Target Falls,
 * FMove, a STR value, …) is not, and belongs in the notes.
 */
const isSimpleDamageCode = (effect: string): boolean => {
    const remainder = effect
        .replace(/\d+½?d6/gi, ' ') // 16d6, 3½d6
        .replace(/½d6/gi, ' ') // bare ½d6
        .replace(/\+?\s*\d+\s*DC/gi, ' ') // +5 DC, 5 DC
        .replace(/\b(Strike|NND|Flash|HKA|Normal|Killing)\b/gi, ' ')
        .replace(/[½\d+,;.\s-]/g, ''); // leftover digits / punctuation / ½

    return remainder === '';
};

/** Extract the maneuver combat line from a decorated maneuver's attributes, definition, and roll. */
function buildManeuver(attributes: Attribute[], definition: string, roll: RollDescriptor | null): ManeuverDetail {
    const effect = maneuverValue(attributes, 'Effect');
    const extras: string[] = [];

    // A complex effect goes to the notes; the Damage column then holds just the
    // clean rollable dice (if any). A simple damage code stays in the column.
    let damage: string | null;
    if (effect === null) {
        damage = roll?.roll ?? null;
    } else if (isSimpleDamageCode(effect)) {
        damage = effect;
    } else {
        damage = roll?.roll ?? null;
        extras.push(effect);
    }

    for (const attribute of attributes) {
        if (!MANEUVER_MAIN.has(attribute.label)) {
            extras.push(attribute.label === 'Phase' ? `Phase ${attribute.value}` : String(attribute.value));
        }
    }
    if (definition.trim() !== '') {
        extras.push(definition.trim());
    }

    return {
        ocv: maneuverValue(attributes, 'OCV'),
        dcv: maneuverValue(attributes, 'DCV'),
        range: maneuverValue(attributes, 'Range'),
        damage,
        notes: extras.filter((entry) => entry.trim() !== '').join(' · '),
    };
}

export interface SheetSection {
    title: string;
    traits: SheetTrait[];
}

export interface CharacterSheet {
    characteristics: SheetCharacteristic[];
    sections: SheetSection[];
}

/** A labelled combat number. `attackOcv` marks it as rollable as a to-hit at that OCV. */
export interface CombatStat {
    label: string;
    value: string;
    attackOcv?: number;
}

/** A movement mode with its combat and non-combat distances (already unit-formatted) and END to use it. */
export interface MovementRow {
    name: string;
    combat: string;
    nonCombat: string;
    /** END to move the mode's full distance in a Phase (6E, ~1 per 10m). */
    endurance: number;
}

export interface CombatSheet {
    combatValues: CombatStat[];
    defenses: CombatStat[];
    info: CombatStat[];
    movement: MovementRow[];
}

const COMBAT_VALUE_FIELDS: Array<{key: string; label: string; attack: boolean}> = [
    {key: 'ocv', label: 'OCV', attack: true},
    {key: 'dcv', label: 'DCV', attack: false},
    {key: 'omcv', label: 'OMCV', attack: true},
    {key: 'dmcv', label: 'DMCV', attack: false},
];

/**
 * Build the combat/movement view: combat values and phases (via the golden-mastered
 * `combatDetails` port, so 5E figured OCV/DCV is handled), defenses, key combat
 * characteristics, and per-mode movement distances.
 */
export function buildCombatSheet(character: Obj, showSecondary = false): CombatSheet {
    const source = showSecondary ? character : withoutAlternateIdTraits(character);
    const c: Obj = {...source, showSecondary};
    const total = (shortName: string): number => heroDesignerCharacter.getCharacteristicTotal(shortName, c);

    // init() flips showSecondary while it works, so hand it its own copy and keep `c` primary.
    const details: Obj = combatDetails.init({...c}).primary;

    const combatValues: CombatStat[] = COMBAT_VALUE_FIELDS.filter((field) => details[field.key] !== undefined).map((field) => ({
        label: field.label,
        value: String(details[field.key]),
        attackOcv: field.attack ? Number(details[field.key]) : undefined,
    }));

    const defenses: CombatStat[] = [
        {label: 'PD', value: heroDesignerCharacter.getTotalDefense(c, 'PD')},
        {label: 'ED', value: heroDesignerCharacter.getTotalDefense(c, 'ED')},
        {label: 'Mental', value: heroDesignerCharacter.getTotalUnusualDefense(c, 'MENTALDEFENSE')},
        {label: 'Power', value: heroDesignerCharacter.getTotalUnusualDefense(c, 'POWERDEFENSE')},
    ];

    const phases = Object.keys(details.phases)
        .map(Number)
        .sort((a, b) => a - b)
        .join(', ');

    const info: CombatStat[] = [
        {label: 'SPD', value: String(total('SPD'))},
        {label: 'Phases', value: phases.length > 0 ? phases : '—'},
        {label: 'DEX', value: String(total('DEX'))},
        {label: 'REC', value: String(total('REC'))},
        {label: 'END', value: String(total('END'))},
        {label: 'STUN', value: String(total('STUN'))},
        {label: 'BODY', value: String(total('BODY'))},
    ];

    const isFifth = heroDesignerCharacter.isFifth(c);
    const unit = isFifth ? '"' : 'm';
    const movement: MovementRow[] = toArray(c.movement).map((mode) => {
        const distance = heroDesignerCharacter.getMovementTotal(mode, c, true);
        const raw = Number(heroDesignerCharacter.getMovementTotal(mode, c));
        const ncm = heroDesignerCharacter.getTotalNcm(mode, c);
        return {
            name: String(mode.name ?? mode.shortName ?? ''),
            combat: `${distance}${unit}`,
            nonCombat: `${raw * ncm}${unit} (×${ncm})`,
            // END is charged on distance in metres; 5E quotes movement in inches (1" = 2m), so convert.
            endurance: movementEnduranceCost(isFifth ? raw * 2 : raw),
        };
    });

    return {combatValues, defenses, info, movement};
}

const TRAIT_SECTIONS: Array<{key: string; title: string}> = [
    {key: 'skills', title: 'Skills'},
    {key: 'perks', title: 'Perks'},
    {key: 'talents', title: 'Talents'},
    {key: 'martialArts', title: 'Martial Arts'},
    {key: 'powers', title: 'Powers'},
    {key: 'equipment', title: 'Equipment'},
];

/**
 * A stored document is either a processed HeroDesigner character (flat trait
 * arrays, from a real import) or a thin/legacy blob. Returns the character as an
 * engine `Obj` when it looks processed, else null so the screen can fall back.
 */
export function asHeroCharacter(document: CharacterDocument): Obj | null {
    const characteristics = (document as {characteristics?: unknown}).characteristics;
    const looksProcessed =
        Array.isArray(characteristics) && characteristics.length > 0 && typeof (characteristics[0] as {shortName?: unknown} | undefined)?.shortName === 'string';

    return looksProcessed ? (document as unknown as Obj) : null;
}

/** Build the full sheet from a processed character: characteristics + decorated trait sections. */
export function buildCharacterSheet(character: Obj, showSecondary = false): CharacterSheet {
    // Off = base (secret-ID) form: drop the alt-ID traits at the source so both the
    // rows and every derived total exclude them. `showSecondary` additionally drives
    // the affectsPrimary "secondary characteristics" math the engine already does.
    const source = showSecondary ? character : withoutAlternateIdTraits(character);
    const c: Obj = {...source, showSecondary};

    const characteristics: SheetCharacteristic[] = toArray(c.characteristics).map((entry) => {
        const name = String(entry.name ?? entry.shortName ?? '');
        const isStrength = String(entry.shortName).toUpperCase() === 'STR';
        const total = heroDesignerCharacter.getCharacteristicTotal(String(entry.shortName), c);

        return {
            name: name.toLowerCase().startsWith('custom') ? String(entry.shortName ?? name) : name,
            total,
            roll: heroDesignerCharacter.getRollTotal(entry, c),
            cost: Number(entry.cost ?? 0),
            // STR is the only characteristic that is itself an attack. Read off `c`, not the raw
            // character, so it obeys the same alternate-identity filtering as the total above it —
            // a STR bought Only In Alternate Identity must not punch while the identity is off.
            damage: isStrength ? {roll: heroDesignerCharacter.getStrengthDamage(c), type: RollType.NormalDamage} : null,
            // STR is likewise the only characteristic that costs END to use.
            endurance: isStrength ? strengthEnduranceCost(total) : null,
        };
    });

    const sections: SheetSection[] = [];
    for (const {key, title} of TRAIT_SECTIONS) {
        const traits = buildTraits(toArray(c[key]), key, c, 0);
        if (traits.length > 0) {
            sections.push({title, traits});
        }
    }

    const complications = buildTraits(toArray(c.disadvantages), 'disadvantages', c, 0);
    if (complications.length > 0) {
        sections.push({title: heroDesignerCharacter.isFifth(c) ? 'Disadvantages' : 'Complications', traits: complications});
    }

    return {characteristics, sections};
}

const toArray = (value: unknown): Obj[] => (Array.isArray(value) ? (value as Obj[]) : []);

function buildTraits(items: Obj[], listKey: string, character: Obj, depth: number): SheetTrait[] {
    const rows: SheetTrait[] = [];

    for (const item of items) {
        try {
            const decorated = characterTraitDecorator.decorate(item, listKey, () => character);
            const roll = decorated.roll() ?? null;
            const maneuver = listKey === 'martialArts' ? buildManeuver(decorated.attributes(), decorated.definition(), roll) : undefined;
            // Only Powers cost END; skills/perks/talents never do (and their templates carry no `usesend`).
            const endurance = listKey === 'powers' ? enduranceCost(item, decorated.activeCost()) : 0;
            rows.push({label: decorated.label(), roll, realCost: decorated.realCost(), endurance, definition: decorated.definition(), depth, writeup: decorated.toWriteup(), maneuver});

            const children = toArray(item.powers);
            if (children.length > 0) {
                rows.push(...buildTraits(children, listKey, character, depth + 1));
            }
        } catch {
            // A single malformed trait shouldn't blank the whole sheet.
            rows.push({
                label: String(item.name ?? item.alias ?? item.xmlid ?? 'Trait'),
                roll: null,
                realCost: 0,
                endurance: 0,
                definition: '',
                depth,
                writeup: {attributes: [], advantages: [], limitations: [], notes: null, cost: {base: 0, active: 0, real: 0}},
            });
        }
    }

    return rows;
}
