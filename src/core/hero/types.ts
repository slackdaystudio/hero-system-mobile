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

import type {HeroDesignerTemplateData} from 'core/templates';

/**
 * Types for the HERO Designer character model.
 *
 * The domain is an XML-derived bag: a "trait" carries dozens of heterogeneous,
 * mostly-optional fields, and `adder`/`modifier`/`power` are each sometimes an
 * object and sometimes an array. We type the load-bearing fields precisely and
 * leave the long tail open via index signatures — a discriminated-union-lite
 * model that stays faithful to the legacy engine while giving the ported code
 * real types on the fields that carry cost/roll math.
 */

/** A cost adder/sub-adder attached to a trait or template entry. */
export interface Adder {
    xmlid?: string;
    basecost: number;
    levels?: number;
    lvlval?: number;
    lvlcost?: number;
    lvlmultiplier?: number;
    [field: string]: unknown;
}

/** A power advantage/limitation modifier. */
export interface Modifier {
    xmlid: string;
    [field: string]: unknown;
}

/**
 * A single trait (skill, perk, talent, maneuver, power, disadvantage, …) as it
 * exists after normalization: the raw parsed entry, enriched by `getCharacter`
 * with its matched `template` and a `type` discriminator.
 */
export interface Trait {
    xmlid: string;
    id?: number | string;
    alias?: string;
    name?: string | null;
    /** The category sub-key ('skill' | 'power' | …), or 'list' for containers/frameworks. */
    type?: string;
    /** Original category before any re-typing (e.g. 'VPP', 'power'). */
    originalType?: string;
    /** The matched rules-template entry, attached during populate. */
    template?: HeroDesignerTemplateData | Record<string, unknown>;
    levels?: number;
    position?: number;
    parentid?: number | string;
    affectsPrimary?: boolean;
    affectsTotal?: boolean;
    input?: string;
    optionAlias?: string;
    adder?: Adder | Adder[];
    modifier?: Modifier | Modifier[];
    /** Child traits for compound powers / frameworks / list containers. */
    powers?: Trait[];
    [field: string]: unknown;
}

/** Kind discriminator for a characteristic vs a movement mode. */
export type CharacteristicType = 1 | 2;

/** A normalized characteristic or movement entry (see `_populateMovementAndCharacteristics`). */
export interface Characteristic {
    type: CharacteristicType;
    name: string;
    shortName: string;
    value: number;
    cost: number;
    base: number;
    definition: string | null;
    roll: boolean;
    /** Non-combat multiplier; only populated for movement entries. */
    ncm: number | null;
}

/** A parsed characteristic entry from the `.hdc` (pre-normalization). */
export interface ParsedCharacteristic {
    alias: string;
    levels: number;
    [field: string]: unknown;
}

/**
 * The parsed `.hdc` document handed to `getCharacter` — the shape the legacy
 * `File` parser produces (camelCased keys, coerced values, portrait stripped in
 * our fixtures). Trait categories arrive as `{ <subKey>: entry | entry[] }`.
 */
export interface ParsedCharacter {
    version?: number;
    template: string | HeroDesignerTemplateData;
    characterInfo?: Record<string, unknown>;
    characteristics: Record<string, ParsedCharacteristic>;
    skills?: Record<string, unknown> | null;
    perks?: Record<string, unknown> | null;
    talents?: Record<string, unknown> | null;
    martialarts?: Record<string, unknown> | null;
    powers?: Record<string, unknown> | null;
    disadvantages?: Record<string, unknown> | null;
    equipment?: Record<string, unknown> | null;
    portrait?: string | null;
    [field: string]: unknown;
}

/**
 * The normalized character produced by `getCharacter`: characteristics/movement
 * split out, every trait category flattened into a typed array. (`showSecondary`,
 * `notes`, `combatDetails` are added later by the app's character-load step, not
 * by `getCharacter` itself.)
 */
export interface Character {
    version?: number;
    /** Faithful to legacy: sourced from a non-existent `baseTemplateName`, so `undefined`. */
    template?: string;
    characterInfo?: Record<string, unknown>;
    characteristics: Characteristic[];
    movement: Characteristic[];
    skills: Trait[];
    perks: Trait[];
    talents: Trait[];
    martialArts: Trait[];
    powers: Trait[];
    equipment: Trait[];
    disadvantages: Trait[];
    portrait: string | null;
    showSecondary?: boolean;
    notes?: string;
    combatDetails?: unknown;
}
