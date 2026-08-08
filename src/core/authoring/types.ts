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
 * What a player has built, as data — the authoring **draft** (docs/CHARACTER_AUTHORING.md).
 *
 * This is deliberately *not* a `ParsedCharacter`. A draft says what the player chose; `emit` turns
 * it into the `.hdc`-shaped input the engine reads. Keeping them apart is what makes the draft
 * safe to store and safe to re-open: it carries no engine boilerplate to drift, no ids to collide,
 * and no display strings to fall out of step with the templates that produce them.
 *
 * Every reference is **by xmlid**, never by resolved object — the same discipline
 * `core/random`'s recipe uses, and for the same reason. A draft outlives the build that wrote it,
 * so it names things and lets the current template data answer.
 */

/** Which rulebook a draft is built against. The single fork the whole engine follows. */
export type AuthoringEdition = '5E' | '6E';

/**
 * A chosen adder on a trait: the adder's xmlid, plus the option xmlid when it offers a list.
 *
 * The cost is *not* here. It lives in the template and is copied in at emit time, so a draft
 * saved before a template correction re-prices itself rather than preserving the old number.
 */
export interface AuthoredAdder {
    readonly xmlid: string;
    /** The chosen `option` xmlid, when the adder declares an `option` list. */
    readonly option?: string;
    /** Levels, when the adder is bought in levels (`lvlval`/`lvlcost`). */
    readonly levels?: number;
    /**
     * The player's words, for an adder whose "option" is really a free-text field
     * (see {@link CatalogueAdder.freeText}). Rivalry's description is the only one.
     */
    readonly text?: string;
}

/**
 * One complication the player has taken.
 *
 * `input` is the free text the template asks for under its own `inputlabel` — "Code Of The Hero"
 * for a Psychological Complication. Its presence is what makes the sheet label read
 * "Psychological: Code Of The Hero" rather than the bare template name, so it is not decoration.
 */
export interface AuthoredComplication {
    readonly xmlid: string;
    readonly input: string;
    readonly adders: readonly AuthoredAdder[];
    /** Levels, for the handful priced by them (UNLUCK). */
    readonly levels?: number;
}

/**
 * A character being authored.
 *
 * Characteristics are **totals**, the number a player actually thinks in ("STR 20"), not the
 * levels-above-base the `.hdc` stores. `emit` converts, reusing the engine to do it so 5E's
 * figured characteristics stay the engine's problem — see `core/random/characteristics`.
 */
export interface AuthoredCharacter {
    readonly edition: AuthoringEdition;
    readonly name: string;
    readonly player: string;
    /** Characteristic totals by lower-case key: `{str: 20, dex: 15}`. Absent = leave at base. */
    readonly characteristics: Readonly<Record<string, number>>;
    readonly complications: readonly AuthoredComplication[];
}

/** An empty draft at an edition — what "new character" starts from. */
export const emptyDraft = (edition: AuthoringEdition): AuthoredCharacter => ({
    edition,
    name: '',
    player: '',
    characteristics: {},
    complications: [],
});
