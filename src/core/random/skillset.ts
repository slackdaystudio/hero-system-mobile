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

/**
 * The `input` of a skill the data deliberately leaves to the player.
 *
 * The legacy prose's `Lang:` and `SS[INT]:` named no language and no science, so there is nothing
 * to generate — a random pick would be inventing a fact about someone else's character. The skill
 * is real and costed; only its subject is blank until the player says.
 */
export const PLAYER_DEFINED = 'Player Defined';

/** A skill whose subject the player names. */
export interface PlayerDefinedSlot {
    /**
     * Stable key for the player's answer: xmlid plus which one of them, e.g. `SCIENCE_SKILL#1`.
     *
     * Not the trait's `id`, deliberately. What the player named their language is a fact about
     * *them*, not about the profession's data row — keyed this way it survives a profession change,
     * because every set's `LANGUAGES#0` is the same question. And the Scientist's three Science
     * Skills are identical in the data, so their order carries no meaning to lose.
     */
    readonly slot: string;
    readonly xmlid: string;
    /** The sheet's short name for it — "Language", "SS". */
    readonly alias: string;
}

const slotKey = (xmlid: string, ordinal: number): string => `${xmlid}#${ordinal}`;

/**
 * Walk a skillset's player-defined skills in a fixed order, so {@link playerDefinedSlots} and
 * {@link attachSkillset} always agree on which slot is which.
 */
function eachPlayerDefined(skillset: StructuredSkillset, visit: (trait: Obj, slot: string) => void): void {
    const counts = new Map<string, number>();

    for (const block of Object.values(skillset.buckets)) {
        for (const entries of Object.values(block)) {
            for (const trait of entries as Obj[]) {
                if (trait.input !== PLAYER_DEFINED) {
                    continue;
                }

                const xmlid = String(trait.xmlid);
                const ordinal = counts.get(xmlid) ?? 0;

                counts.set(xmlid, ordinal + 1);
                visit(trait, slotKey(xmlid, ordinal));
            }
        }
    }
}

/** The skills this profession leaves to the player, in sheet order. */
export function playerDefinedSlots(skillset: StructuredSkillset): PlayerDefinedSlot[] {
    const slots: PlayerDefinedSlot[] = [];

    eachPlayerDefined(skillset, (trait, slot) => slots.push({slot, xmlid: String(trait.xmlid), alias: String(trait.alias ?? trait.xmlid)}));

    return slots;
}

/**
 * Attach a skillset to a `ParsedCharacter`, filling in the `.hdc` boilerplate.
 *
 * `named` supplies the player's answers by slot. An answer only ever replaces the `input` string,
 * which feeds the sheet's label and nothing else — so naming a skill cannot move a cost, and the
 * set still totals its 25.
 */
export function attachSkillset(parsed: ParsedCharacter, skillset: StructuredSkillset, named: Readonly<Record<string, string>> = {}): ParsedCharacter {
    const attached: Obj = {...parsed};
    const bySlot = new Map<Obj, string>();

    eachPlayerDefined(skillset, (trait, slot) => bySlot.set(trait, slot));

    for (const [traitKey, block] of Object.entries(skillset.buckets)) {
        const filled: Obj = {};

        for (const [subKey, entries] of Object.entries(block)) {
            filled[subKey] = (entries as Obj[]).map((entry) => {
                const trait = withDefaults(entry);
                const slot = bySlot.get(entry);
                const chosen = slot === undefined ? undefined : named[slot];

                return chosen === undefined || chosen === '' ? trait : {...trait, input: chosen};
            });
        }

        attached[traitKey] = filled;
    }

    return attached as unknown as ParsedCharacter;
}
