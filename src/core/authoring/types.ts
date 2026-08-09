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

import type {BasicConfiguration} from 'core/hero';
import {POWER_LEVELS} from 'core/random';

/** Which rulebook a draft is built against. The single fork the whole engine follows. */
export type AuthoringEdition = '5E' | '6E';

/**
 * The budget a character is being built to.
 *
 * `base` is what the campaign grants, **quoted the way that edition quotes it** — a 5E character's
 * pre-disadvantage base, a 6E character's whole allowance. `complicationLimit` is how much of the
 * build complications may fund (5E) or how many points' worth are required (6E); HERO calls both a
 * limit and neither is a suggestion.
 *
 * Plain numbers rather than the id of a preset, so a GM running a campaign the rulebook has no
 * name for can still say what it allows. The presets are a convenience over these, not a
 * replacement for them.
 */
export interface Budget {
    readonly base: number;
    readonly complicationLimit: number;
}

/** A named campaign level, as something to pick. */
export interface PointAllowance extends Budget {
    readonly id: string;
    readonly name: string;
    readonly edition: AuthoringEdition;
}

/**
 * The campaign levels a character can be authored at.
 *
 * Derived from `core/random`'s `POWER_LEVELS` rather than restated, because those numbers are
 * already checked against both rulebooks and a second copy is exactly how the legacy
 * `skillsets.json` came to disagree with itself about what a profession cost.
 *
 * **The two editions are quoted in different units**, which is the easiest thing here to get
 * wrong — `powerLevel.ts` spells it out: 5E quotes base and adds disadvantages, 6E quotes the
 * total and subtracts complications. So a 6E allowance's `base` is the level's *total*, and a 5E
 * one's is its *base*. That is the same conversion `declaredConfiguration` makes when it writes a
 * character's `<BASIC_CONFIGURATION>`, which is why an authored character's declared points come
 * out agreeing with a generated one's.
 */
export const POINT_ALLOWANCES: readonly PointAllowance[] = POWER_LEVELS.map((level) => ({
    id: level.id,
    name: level.name,
    edition: level.edition === '6e' ? '6E' : '5E',
    base: level.edition === '6e' ? level.total : level.base,
    complicationLimit: level.limit,
}));

/** The allowances offered for an edition. */
export const allowancesFor = (edition: AuthoringEdition): PointAllowance[] => POINT_ALLOWANCES.filter((allowance) => allowance.edition === edition);

/** The named allowance matching a budget exactly, or null when it has been hand-set. */
export const allowanceFor = (budget: Budget, edition: AuthoringEdition): PointAllowance | null =>
    allowancesFor(edition).find((allowance) => allowance.base === budget.base && allowance.complicationLimit === budget.complicationLimit) ?? null;

/** Just the two numbers — an allowance carries a name and an id that a draft has no use for. */
const budgetOf = (id: string): Budget => {
    const allowance = POINT_ALLOWANCES.find((candidate) => candidate.id === id)!;

    return {base: allowance.base, complicationLimit: allowance.complicationLimit};
};

/** Where a new draft starts: Standard Superheroic, the level the generator builds to. */
export const DEFAULT_BUDGET: Readonly<Record<AuthoringEdition, Budget>> = {
    '5E': budgetOf('5e-standard'),
    '6E': budgetOf('6e-standard'),
};

/**
 * The `<BASIC_CONFIGURATION>` a character built to this budget declares.
 *
 * Without it the sheet's nameplate shows no points and no campaign tier — `pointSummary` reads the
 * declared block and returns null when it is absent, which is what an authored character did
 * before this. The base and the limit are already in the edition's own units, so no conversion
 * happens here.
 *
 * `experience` is whatever the character costs past its allowance. That is what experience *is* in
 * HERO — a character who costs more than their starting points has earned the difference — and it
 * is why going over is not an error. The tier stays keyed on base alone, deliberately:
 * `powerTier` does not let a character climb the campaign ladder by earning points.
 */
export const declaredFor = (budget: Budget, experience = 0): BasicConfiguration => ({
    basePoints: budget.base,
    disadPoints: budget.complicationLimit,
    experience: Math.max(0, Math.round(experience)),
});

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
 * One trait the player has taken — a skill, perk, talent or complication.
 *
 * The same shape for all four because the `.hdc` format treats them the same way: an xmlid, some
 * free text, a pick-one, a number of levels, and a list of adders. What differs is which of those
 * a given entry declares, and the template says that — see `CatalogueTrait`.
 *
 * `input` is the free text the template asks for under its own `inputlabel` — "Code Of The Hero"
 * for a Psychological Complication, "French" for a Language. Its presence is what makes a sheet
 * label read "Psychological: Code Of The Hero" rather than the bare template name, so it is not
 * decoration.
 */
export interface AuthoredTrait {
    readonly xmlid: string;
    /**
     * The player's own name for it — "Fire Bolt" for a Blast.
     *
     * Distinct from `input`, which answers a question the template asked. A name is what the sheet
     * leads with, printing "Fire Bolt (Blast)" where an unnamed one is just "Blast".
     */
    readonly name?: string;
    readonly input: string;
    readonly adders: readonly AuthoredAdder[];
    /** Levels bought, for anything priced by them — Skill Levels, Contacts, Unluck. */
    readonly levels?: number;
    /** The chosen entry-level option: a Language's fluency, a Skill Level's breadth. */
    readonly option?: string;
    /**
     * Which characteristic a skill rolls against — `DEX` for Acrobatics, `INT` or `GENERAL` for a
     * Knowledge Skill. Required for any skill the template gives a `characteristicChoice`: without
     * it `Skill.cost()` falls through to the trait's own basecost, which for most skills is absent.
     */
    readonly characteristic?: string;
    /**
     * Taken at familiarity — an 8- roll for a point, instead of the full skill.
     *
     * A separate flag rather than "0 levels", because they are different purchases: a familiarity
     * costs 1 and rolls 8-, where the same skill bought normally costs 3 and rolls off a
     * characteristic.
     */
    readonly familiarity?: boolean;
}

/** Kept as its own name because the rules, the UI and the sheet all call them complications. */
export type AuthoredComplication = AuthoredTrait;

/**
 * An advantage or limitation on a power.
 *
 * The same shape as an adder, plus its own adders — HERO lets a modifier be modified, and Area Of
 * Effect is the everyday case: a Radius has an "Accurate" adder of its own.
 *
 * Whether it is an advantage or a limitation is not recorded here, because it is not a choice: the
 * sign of its cost decides, and `ModifierCalculator` splits them on exactly that. Storing a flag
 * would let a draft disagree with the rules about which is which.
 */
export interface AuthoredModifier {
    readonly xmlid: string;
    readonly option?: string;
    readonly levels?: number;
    readonly text?: string;
    readonly adders: readonly AuthoredAdder[];
}

/**
 * The four defences a Resistant Protection is split across.
 *
 * A `.hdc` records the split *and* a `levels` total, and across all 37 corpus characters the total
 * is always the sum of the four. So the emitter derives it rather than asking twice — the power
 * costs by `levels` and grants defence by the split, and the two disagreeing is not a state worth
 * being able to represent.
 *
 * Its own field rather than four more adders because it is a genuine gap: nothing in the template
 * declares these, and `getResistantDefense` reads them straight off the trait. Without them a
 * Resistant Protection costs full price and grants nothing at all, quietly.
 */
export interface AuthoredDefense {
    readonly pd: number;
    readonly ed: number;
    readonly mental: number;
    readonly power: number;
}

/**
 * The three power frameworks, named as the `.hdc` names them.
 *
 * These strings are load-bearing twice over: they are the sub-key a container is emitted under,
 * which is what `normalizeCharacterItems` turns into `originalType`, and `originalType` is what
 * `isPowerFrameworkItem` matches to decide how a slot is priced. Spelling one differently means
 * the container still parses and the slots still cost full price.
 */
export type FrameworkKind = 'multipower' | 'elementalControl' | 'vpp';

/**
 * A power framework: a pool of points, and the powers that draw on it.
 *
 * Its own list rather than a kind of power, because a framework is not priced like one — the
 * container costs its reserve, and each slot costs a fraction of what it would cost alone. The
 * three kinds do that arithmetic differently, which is the whole reason to have them.
 *
 * A framework carries modifiers like any power: a Unified Power on the pool applies to every slot
 * in it, which `ModifierCalculator` handles by reading the parent's modifiers as well as the
 * slot's own.
 */
export interface AuthoredFramework {
    readonly kind: FrameworkKind;
    readonly name: string;
    /**
     * Points in the pool.
     *
     * Emitted as the container's `basecost` for a Multipower or Elemental Control, and as its
     * `levels` for a Variable Power Pool — the format uses different fields, and
     * `VariablePowerPool.cost()` reads `levels` where the other two read `basecost`.
     */
    readonly reserve: number;
    readonly modifiers: readonly AuthoredModifier[];
    readonly slots: readonly AuthoredSlot[];
}

/** A power: a trait, plus the advantages and limitations that make it cost what it costs. */
export interface AuthoredPower extends AuthoredTrait {
    readonly modifiers: readonly AuthoredModifier[];
    /** Only for the powers whose catalogue entry declares a `defense` field group. */
    readonly defense?: AuthoredDefense;
    /**
     * Answers to a `levels` field group, keyed by the **trait field the engine reads** —
     * `lengthlevels`, `bodylevels`, `points`, `number`.
     *
     * Keyed that way rather than by some friendlier name because there is nothing to translate
     * *to*: these exist precisely because no template describes them, so the decorator's field name
     * is the only name they have. See `fieldGroupsFor` in the catalogue.
     */
    readonly fields?: Readonly<Record<string, number>>;
}

/**
 * A power sitting in a framework.
 *
 * Its own type only so `variable` has somewhere to live that a standalone power and a piece of
 * equipment don't — the choice is meaningless off a slot, and an optional field on
 * {@link AuthoredPower} would have offered it everywhere.
 */
export interface AuthoredSlot extends AuthoredPower {
    /**
     * A **variable** slot rather than a fixed one: the reserve can be split across it and its
     * neighbours, and the power run at less than full value. Flexibility is what you pay for, so
     * it costs a fifth of the power's real cost where a fixed slot costs a tenth.
     *
     * **Multipower only.** An Elemental Control slot pays whatever it exceeds the pool by and a
     * VPP's slots are prefabs, so neither has the distinction; `emit` ignores the flag on those
     * two rather than writing a field their decorators would never read.
     *
     * Defaults to fixed, which is what HERO Designer defaults a new slot to. See H13 in
     * docs/KNOWN_DEVIATIONS.md — until it was fixed the engine priced both kinds identically.
     */
    readonly variable?: boolean;
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
    /**
     * What the campaign allows — see `Budget`.
     *
     * Part of the draft rather than a screen setting, because it is part of the character: it is
     * what the sheet's nameplate declares and what the campaign tier is read from. A character
     * re-opened at a different allowance than it was built to would silently be over or under
     * budget for reasons nobody could see.
     */
    readonly budget: Budget;
    /** Characteristic totals by lower-case key: `{str: 20, dex: 15}`. Absent = leave at base. */
    readonly characteristics: Readonly<Record<string, number>>;
    readonly skills: readonly AuthoredTrait[];
    readonly perks: readonly AuthoredTrait[];
    readonly talents: readonly AuthoredTrait[];
    readonly powers: readonly AuthoredPower[];
    /**
     * Martial maneuvers. Not powers, and kept in their own `.hdc` bucket — but their cost comes
     * out of the same pot, which is why `core/random`'s allocator counts them with the powers.
     */
    readonly martialArts: readonly AuthoredTrait[];
    /**
     * Carried gear. Powers in every respect the engine cares about — same catalogue, same
     * modifiers — but its own category, so a sword and an innate power stay told apart on the sheet.
     */
    readonly equipment: readonly AuthoredPower[];
    readonly frameworks: readonly AuthoredFramework[];
    readonly complications: readonly AuthoredTrait[];
}

/** An empty draft at an edition — what "new character" starts from. */
export const emptyDraft = (edition: AuthoringEdition): AuthoredCharacter => ({
    edition,
    name: '',
    player: '',
    budget: DEFAULT_BUDGET[edition],
    characteristics: {},
    skills: [],
    perks: [],
    talents: [],
    powers: [],
    martialArts: [],
    equipment: [],
    frameworks: [],
    complications: [],
});
