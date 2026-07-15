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
 * Structured skillsets (phase 3 of docs/RANDOM_CHARACTER.md) — the profession half of a build.
 *
 * As with powers and complications, the data states **no cost**: a skill carries its `basecost`
 * on the trait and the engine prices it. The legacy prose's "skills" is a catch-all over several
 * `.hdc` trait buckets — `skills`, `perks`, `talents` — so a set may carry any of them.
 *
 * **Hitting 25 exactly.** A set's listed skills rarely land on it, and the levers are:
 *
 * | Lever | Cost | Effect |
 * |-------|------|--------|
 * | Familiarity | **1** | roll becomes a flat 8- |
 * | Proficiency | **2** | roll becomes a flat 10- |
 * | Full skill | **3** | the normal roll |
 * | `levels` on a skill | **+2** each | +1 to that skill's roll |
 *
 * Familiarity and Proficiency are what make an **odd** remainder closable — `levels` alone moves
 * in 2s. Every set records what it needed and why.
 */
import type {ParsedCharacter} from 'core/hero';
import skillsetData from '../data/random/skillPackages.5e.json';

type Obj = Record<string, any>;

export interface StructuredSkillset {
    readonly profession: string;
    /** Why this set is not simply its listed skills at 3 points each. */
    readonly note?: string;
    /** Any of `skills`, `perks`, `talents`, each a `.hdc` block keyed by its sub-key. */
    readonly buckets: Record<string, Obj>;
}

const SKILL_DEFAULTS: Obj = {
    basecost: 0,
    levels: 0,
    position: 0,
    multiplier: 1,
    graphic: 'Burst',
    color: '255 255 255',
    sfx: 'Default',
    showActiveCost: true,
    includeNotesInPrintout: true,
    quantity: 1,
    notes: null,
    familiarity: false,
    proficiency: false,
    /** `null`, not absent: a missing `name` renders as the literal "undefined (Acting)" on the sheet. */
    name: null,
    levelsonly: false,
};

const withDefaults = (trait: Obj): Obj => ({...SKILL_DEFAULTS, ...trait});

export const SKILLSETS_5E = (skillsetData as unknown as {skillsets: StructuredSkillset[]}).skillsets;

/** Professions with a structured skillset. The rest are still legacy name strings. */
export const structuredSkillset = (profession: string): StructuredSkillset | undefined =>
    SKILLSETS_5E.find((skillset) => skillset.profession === profession);

/** Attach a skillset to a `ParsedCharacter`, filling in the `.hdc` boilerplate. */
export function attachSkillset(parsed: ParsedCharacter, skillset: StructuredSkillset): ParsedCharacter {
    const attached: Obj = {...parsed};

    for (const [traitKey, block] of Object.entries(skillset.buckets)) {
        const filled: Obj = {};

        for (const [subKey, entries] of Object.entries(block)) {
            filled[subKey] = (entries as Obj[]).map(withDefaults);
        }

        attached[traitKey] = filled;
    }

    return attached as unknown as ParsedCharacter;
}
