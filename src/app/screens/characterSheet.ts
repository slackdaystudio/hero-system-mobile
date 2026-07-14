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
import {heroDesignerCharacter} from 'core/hero';
import {characterTraitDecorator, type Obj, type RollDescriptor} from 'core/traits';
import type {CharacterDocument} from 'core/ports';
import {flatten} from 'core/util';

/**
 * True when the character has "only in Alternate Identity" traits — powers/
 * characteristics that only apply in the alternate (super) form. When so, the
 * sheet offers the {@link buildCharacterSheet} `showSecondary` toggle.
 */
export function hasAlternateForm(character: Obj): boolean {
    return heroDesignerCharacter.hasSecondaryCharacteristics(flatten(toArray(character.powers), 'powers'));
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
}

export interface SheetTrait {
    label: string;
    roll: RollDescriptor | null;
    realCost: number;
    definition: string;
    /** 0 for a top-level trait, 1+ for framework/compound children. */
    depth: number;
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

/** A movement mode with its combat and non-combat distances (already unit-formatted). */
export interface MovementRow {
    name: string;
    combat: string;
    nonCombat: string;
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
    const c: Obj = {...character, showSecondary};
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

    const unit = heroDesignerCharacter.isFifth(c) ? '"' : 'm';
    const movement: MovementRow[] = toArray(c.movement).map((mode) => {
        const distance = heroDesignerCharacter.getMovementTotal(mode, c, true);
        const raw = Number(heroDesignerCharacter.getMovementTotal(mode, c));
        const ncm = heroDesignerCharacter.getTotalNcm(mode, c);
        return {
            name: String(mode.name ?? mode.shortName ?? ''),
            combat: `${distance}${unit}`,
            nonCombat: `${raw * ncm}${unit} (×${ncm})`,
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
    // Several engine methods read `showSecondary` (the alt-ID form); set it on a
    // copy so the caller's toggle drives the totals without mutating input.
    const c: Obj = {...character, showSecondary};

    const characteristics: SheetCharacteristic[] = toArray(c.characteristics).map((entry) => {
        const name = String(entry.name ?? entry.shortName ?? '');
        return {
            name: name.toLowerCase().startsWith('custom') ? String(entry.shortName ?? name) : name,
            total: heroDesignerCharacter.getCharacteristicTotal(String(entry.shortName), c),
            roll: heroDesignerCharacter.getRollTotal(entry, c),
            cost: Number(entry.cost ?? 0),
        };
    });

    const sections: SheetSection[] = [];
    for (const {key, title} of TRAIT_SECTIONS) {
        const items = toArray(c[key]);
        if (items.length > 0) {
            sections.push({title, traits: buildTraits(items, key, c, 0)});
        }
    }

    const complications = toArray(c.disadvantages);
    if (complications.length > 0) {
        sections.push({title: heroDesignerCharacter.isFifth(c) ? 'Disadvantages' : 'Complications', traits: buildTraits(complications, 'disadvantages', c, 0)});
    }

    return {characteristics, sections};
}

const toArray = (value: unknown): Obj[] => (Array.isArray(value) ? (value as Obj[]) : []);

function buildTraits(items: Obj[], listKey: string, character: Obj, depth: number): SheetTrait[] {
    const rows: SheetTrait[] = [];

    for (const item of items) {
        try {
            const decorated = characterTraitDecorator.decorate(item, listKey, () => character);
            rows.push({label: decorated.label(), roll: decorated.roll() ?? null, realCost: decorated.realCost(), definition: decorated.definition(), depth});

            const children = toArray(item.powers);
            if (children.length > 0) {
                rows.push(...buildTraits(children, listKey, character, depth + 1));
            }
        } catch {
            // A single malformed trait shouldn't blank the whole sheet.
            rows.push({label: String(item.name ?? item.alias ?? item.xmlid ?? 'Trait'), roll: null, realCost: 0, definition: '', depth});
        }
    }

    return rows;
}
