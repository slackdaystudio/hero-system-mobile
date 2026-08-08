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
 * Whether a draft is something the engine can actually price
 * (docs/CHARACTER_AUTHORING.md).
 *
 * **This has no counterpart anywhere else in the codebase, and that is the point.** `getCharacter`
 * prices; it does not judge. Nothing needed to judge before, because a `.hdc` from HERO Designer
 * was legal by construction. An authoring UI is a machine for producing inputs that might not be.
 *
 * The failure mode it exists to stop is silent, not loud. A trait whose xmlid the edition does not
 * define resolves to no template and prices at **0**, reading on the sheet as though somebody
 * authored a free power — `LACKOFWEAKNESS`, `SEDUCTION`, `AREA_KNOWLEDGE` and
 * `LIGHTNING_REFLEXES_SINGLE` have all done exactly this in shipped builds. Worse, in the app the
 * decorator *throws* on such a trait and `characterSheet` catches it, degrading the row to a
 * cost-0 stub. So a typo does not crash: it quietly makes the character cheaper.
 *
 * Severity is the useful distinction, not legality:
 *   - `error`   — the engine will mis-price or refuse this. Saving it produces a wrong character.
 *   - `warning` — legal, priced correctly, but probably not what was meant (over budget, blank).
 */
import {AUTHORABLE_CATEGORIES, characteristics, complications, modifier, trait, type AuthorableCategory, type CatalogueTrait} from './catalogue';
import type {AuthoredCharacter, AuthoredPower, AuthoredTrait, AuthoringEdition} from './types';

export type Severity = 'error' | 'warning';

export interface Problem {
    readonly severity: Severity;
    /** Where it is, so the UI can point at the offending row: `complications[2]`, `name`. */
    readonly path: string;
    readonly message: string;
}

/** True when nothing is an `error`. Warnings never block a save — they are advice. */
export const isSaveable = (problems: readonly Problem[]): boolean => !problems.some((problem) => problem.severity === 'error');

/** What the player calls each category, for a message they can act on. */
const CATEGORY_NOUN: Readonly<Record<AuthorableCategory, string>> = {
    skills: 'skill',
    perks: 'perk',
    talents: 'talent',
    powers: 'power',
    disadvantages: 'complication',
};

function validateTrait(authored: AuthoredTrait, category: AuthorableCategory, index: number, edition: AuthoringEdition): Problem[] {
    const path = `${category}[${index}]`;
    const catalogue = trait(authored.xmlid, category, edition);

    if (catalogue === null) {
        return [
            {
                severity: 'error',
                path,
                // The specific trap: not "unknown", but "this edition doesn't have it". 6E deleted
                // entries 5E had, and the engine's answer to a missing template is 0, not an error.
                message: `${edition} has no ${CATEGORY_NOUN[category]} "${authored.xmlid}". It would price at 0 rather than fail.`,
            },
        ];
    }

    if (catalogue.unsupported !== null) {
        return [
            {
                severity: 'error',
                path,
                message:
                    catalogue.unsupported === 'bespoke'
                        ? `${catalogue.display} needs a form of its own — it is priced by fields no template declares.`
                        : `${catalogue.display} states no cost, so nothing here could price it.`,
            },
        ];
    }

    const problems: Problem[] = [...validateTraitFields(authored, catalogue, path)];
    const chosen = new Map(authored.adders.map((adder) => [adder.xmlid, adder]));

    for (const adder of catalogue.adders) {
        const answer = chosen.get(adder.xmlid);

        if (adder.required && answer === undefined) {
            problems.push({severity: 'error', path, message: `${catalogue.display} needs its "${adder.display}".`});
            continue;
        }

        if (answer === undefined) {
            continue;
        }

        if (adder.freeText && (answer.text ?? '').trim() === '') {
            // Its optionAlias becomes a bare "(", and `Complication.label()` slices that to "".
            problems.push({severity: 'error', path, message: `"${adder.display}" needs some text — it is what the sheet prints.`});
        }

        if (!adder.freeText && adder.options.length > 0 && !adder.options.some((option) => option.xmlid === answer.option)) {
            problems.push({
                severity: 'error',
                path,
                message: `"${adder.display}" needs one of: ${adder.options.map((option) => option.display).join(', ')}.`,
            });
        }

        if (adder.levels !== null && answer.levels !== undefined && (answer.levels < adder.levels.min || answer.levels > adder.levels.max)) {
            problems.push({
                severity: 'error',
                path,
                message: `"${adder.display}" must be between ${adder.levels.min} and ${adder.levels.max}.`,
            });
        }
    }

    // `input` is what makes the label read "Psychological: Code Of The Hero". Without it the row
    // is still priced correctly, so this is advice rather than an error.
    if (catalogue.inputLabel !== null && authored.input.trim() === '') {
        problems.push({severity: 'warning', path, message: `${catalogue.display} has no "${catalogue.inputLabel}" — the sheet will show only its type.`});
    }

    return problems;
}

/**
 * The fields a trait carries in its own right — characteristic, option, levels, familiarity.
 *
 * Each of these fails silently rather than loudly, which is why they are errors and not warnings:
 *   - a skill with no `characteristic` falls through `Skill.cost()` to its own `basecost`, which
 *     most skills do not declare, so it costs 0 and still renders;
 *   - `Roll` computes `base + trait.levels` unguarded, so a non-integer level prints "NaN-";
 *   - `SkillLevels.cost()` divides by the *chosen option's* `lvlval`, so no option means
 *     dividing by undefined.
 */
function validateTraitFields(authored: AuthoredTrait, catalogue: CatalogueTrait, path: string): Problem[] {
    const problems: Problem[] = [];

    if (catalogue.characteristics.length > 0 && authored.familiarity !== true) {
        if (authored.characteristic === undefined) {
            problems.push({severity: 'error', path, message: `${catalogue.display} must say which characteristic it rolls against.`});
        } else if (!catalogue.characteristics.some((choice) => choice.characteristic === authored.characteristic)) {
            problems.push({
                severity: 'error',
                path,
                message: `${catalogue.display} cannot be based on ${authored.characteristic} — only ${catalogue.characteristics.map((choice) => choice.characteristic).join(', ')}.`,
            });
        }
    }

    if (catalogue.options.length > 0 && !catalogue.options.some((option) => option.xmlid === authored.option)) {
        problems.push({
            severity: 'error',
            path,
            message: `${catalogue.display} needs one of: ${catalogue.options.map((option) => option.display).join(', ')}.`,
        });
    }

    if (authored.levels !== undefined && (!Number.isInteger(authored.levels) || authored.levels < 0)) {
        problems.push({severity: 'error', path, message: `${catalogue.display} must have a whole, non-negative number of levels.`});
    }

    if (authored.familiarity === true && catalogue.familiarity === null) {
        problems.push({severity: 'error', path, message: `${catalogue.display} cannot be taken at familiarity.`});
    }

    return problems;
}

/**
 * Every characteristic key this edition defines, as a set — anything else is not authorable.
 * Derived from the same catalogue the UI renders, so the two cannot disagree about what exists.
 */
const authorableCharacteristics = (edition: AuthoringEdition): ReadonlySet<string> => new Set(characteristics(edition).map((entry) => entry.key));

/** Where each catalogue category lives on a draft — `disadvantages` is called `complications` there. */
const DRAFT_KEY: Readonly<Record<AuthorableCategory, 'skills' | 'perks' | 'talents' | 'powers' | 'complications'>> = {
    skills: 'skills',
    perks: 'perks',
    talents: 'talents',
    powers: 'powers',
    disadvantages: 'complications',
};

/**
 * A power's modifiers, and the fields no template describes.
 *
 * A modifier the edition does not define resolves to no template and contributes **nothing** to
 * the multiplier, so the power comes out at its unmodified price and reads as though the advantage
 * were free. Same failure as an unknown trait, one level down.
 */
function validatePower(power: AuthoredPower, index: number, edition: AuthoringEdition): Problem[] {
    const path = `powers[${index}]`;
    const catalogue = trait(power.xmlid, 'powers', edition);

    if (catalogue === null || catalogue.unsupported !== null) {
        return []; // already reported by validateTrait; saying it twice helps nobody
    }

    const problems: Problem[] = [];

    for (const applied of power.modifiers) {
        const entry = modifier(applied.xmlid, edition);

        if (entry === null) {
            problems.push({
                severity: 'error',
                path,
                message: `${edition} has no modifier "${applied.xmlid}". It would change the cost by nothing at all.`,
            });
            continue;
        }

        if (entry.options.length > 0 && !entry.options.some((option) => option.xmlid === applied.option)) {
            problems.push({severity: 'error', path, message: `"${entry.display}" needs one of: ${entry.options.map((option) => option.display).join(', ')}.`});
        }

        if (entry.freeText && (applied.text ?? '').trim() === '') {
            problems.push({severity: 'error', path, message: `"${entry.display}" needs some text — it is what the sheet prints.`});
        }
    }

    // A declared field group is not optional: `getResistantDefense` reads those numbers straight
    // off the trait, so a Resistant Protection without them costs full price and defends nothing.
    if (catalogue.fieldGroup !== null && power.defense === undefined) {
        problems.push({severity: 'error', path, message: `${catalogue.display} needs its ${catalogue.fieldGroup.label.toLowerCase()} — without them it costs points and grants no defence.`});
    }

    if (power.defense !== undefined) {
        const values = [power.defense.pd, power.defense.ed, power.defense.mental, power.defense.power];

        if (values.some((value) => !Number.isInteger(value) || value < 0)) {
            problems.push({severity: 'error', path, message: `${catalogue.display} must have whole, non-negative defences.`});
        } else if (values.every((value) => value === 0)) {
            problems.push({severity: 'warning', path, message: `${catalogue.display} grants no defence.`});
        }
    }

    return problems;
}

/**
 * Everything wrong with a draft, most severe first.
 *
 * Deliberately exhaustive rather than fail-fast: a player fixing one field wants to see the other
 * three, not discover them one save at a time.
 */
export function validate(draft: AuthoredCharacter): Problem[] {
    const problems: Problem[] = [];

    if (draft.name.trim() === '') {
        problems.push({severity: 'warning', path: 'name', message: 'The character has no name.'});
    }

    const defined = authorableCharacteristics(draft.edition);

    for (const [key, total] of Object.entries(draft.characteristics)) {
        if (!defined.has(key)) {
            problems.push({
                severity: 'error',
                path: `characteristics.${key}`,
                // COM is 5E-only, OCV/DCV/OMCV/DMCV are 6E-only. Emitting one the template lacks
                // is not survivable: `getCharacteristicFields` reads its definition with no guard.
                message: `${draft.edition} has no "${key.toUpperCase()}".`,
            });
            continue;
        }

        if (!Number.isFinite(total) || !Number.isInteger(total)) {
            problems.push({severity: 'error', path: `characteristics.${key}`, message: `${key.toUpperCase()} must be a whole number.`});
        }
    }

    const known = new Set(complications(draft.edition).map((entry) => entry.xmlid));
    if (draft.complications.length === 0 && known.size > 0) {
        problems.push({severity: 'warning', path: 'complications', message: 'No complications taken.'});
    }

    for (const category of Object.keys(AUTHORABLE_CATEGORIES) as AuthorableCategory[]) {
        draft[DRAFT_KEY[category]].forEach((entry, index) => problems.push(...validateTrait(entry, category, index, draft.edition)));
    }

    draft.powers.forEach((power, index) => problems.push(...validatePower(power, index, draft.edition)));

    return [...problems].sort((a, b) => (a.severity === b.severity ? 0 : a.severity === 'error' ? -1 : 1));
}
