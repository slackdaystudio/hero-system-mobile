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

import {heroDesignerCharacter} from 'core/hero';
import {characterTraitDecorator, type Obj, type RollDescriptor} from 'core/traits';
import type {CharacterDocument} from 'core/ports';

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
export function buildCharacterSheet(character: Obj): CharacterSheet {
    // Several engine methods read `showSecondary`; default it without mutating input.
    const c: Obj = {...character, showSecondary: character.showSecondary ?? false};

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
            rows.push({label: decorated.label(), roll: decorated.roll(), realCost: decorated.realCost(), definition: decorated.definition(), depth});

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
