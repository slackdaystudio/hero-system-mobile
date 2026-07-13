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
 * Types for the HERO Designer rules templates under `core/data/herodesigner`.
 *
 * A template is a large base rulebook (`Main` / `Main6E`) overlaid by a small
 * genre/type template (AI, Automaton, Computer, Heroic, Normal, Superheroic).
 * The overlay can *remove* entries from the base and *add* new ones. Only the
 * merge-relevant structure is typed precisely; the deep per-item payload (a
 * skill/power/modifier carries dozens of heterogeneous fields) is left open.
 */

/** A single rules entry (skill, power, modifier, …). Identified by `xmlid`. */
export interface TemplateItem {
    xmlid: string;
    display?: string;
    [field: string]: unknown;
}

/**
 * One category of rules entries, e.g. `skills`. The entries live under a
 * category-specific sub-key (`skills.skill`, `powers.power`, …) as an item or an
 * array of items. `remove` lists `xmlid`s (upper-cased) to drop from the base.
 */
export interface ItemCategory {
    remove?: string | string[];
    [subKey: string]: TemplateItem | TemplateItem[] | string | string[] | undefined;
}

/**
 * The characteristics block: a map of characteristic key -> definition, plus an
 * optional `remove` list. Values are left open (each characteristic carries a
 * large, varied definition object).
 */
export interface CharacteristicsBlock {
    remove?: string | string[];
    [characteristic: string]: unknown;
}

/** A full or overlay template document (both share this shape). */
export interface HeroDesignerTemplateData {
    version?: number;
    /** Present on overlay templates; names the base, e.g. `builtIn.Main6E.hdt`. */
    extends?: string;
    mainapp?: unknown;
    characteristics?: CharacteristicsBlock | null;
    skills?: ItemCategory | null;
    skillEnhancers?: ItemCategory | null;
    martialArts?: ItemCategory | null;
    perks?: ItemCategory | null;
    talents?: ItemCategory | null;
    powers?: ItemCategory | null;
    modifiers?: ItemCategory | null;
    disadvantages?: ItemCategory | null;
    [key: string]: unknown;
}

/** What `getTemplate` accepts: a built-in template id, or an overlay document. */
export type TemplateInput = string | HeroDesignerTemplateData;

/** The item categories merged by `finalizeTemplate`, as (category, sub-key) pairs. */
export const ITEM_CATEGORIES: ReadonlyArray<readonly [keyof HeroDesignerTemplateData, string]> = [
    ['skills', 'skill'],
    ['skillEnhancers', 'enhancer'],
    ['martialArts', 'maneuver'],
    ['perks', 'perk'],
    ['talents', 'talent'],
    ['powers', 'power'],
    ['modifiers', 'modifier'],
    ['disadvantages', 'disad'],
];
