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
import {characteristics, complication, complications} from './catalogue';
import type {AuthoredCharacter, AuthoredComplication, AuthoringEdition} from './types';

export type Severity = 'error' | 'warning';

export interface Problem {
    readonly severity: Severity;
    /** Where it is, so the UI can point at the offending row: `complications[2]`, `name`. */
    readonly path: string;
    readonly message: string;
}

/** True when nothing is an `error`. Warnings never block a save — they are advice. */
export const isSaveable = (problems: readonly Problem[]): boolean => !problems.some((problem) => problem.severity === 'error');

function validateComplication(authored: AuthoredComplication, index: number, edition: AuthoringEdition): Problem[] {
    const path = `complications[${index}]`;
    const catalogue = complication(authored.xmlid, edition);

    if (catalogue === null) {
        return [
            {
                severity: 'error',
                path,
                // The specific trap: not "unknown", but "this edition doesn't have it". 6E deleted
                // entries 5E had, and the engine's answer to a missing template is 0, not an error.
                message: `${edition} has no complication "${authored.xmlid}". It would price at 0 rather than fail.`,
            },
        ];
    }

    const problems: Problem[] = [];
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
 * Every characteristic key this edition defines, as a set — anything else is not authorable.
 * Derived from the same catalogue the UI renders, so the two cannot disagree about what exists.
 */
const authorableCharacteristics = (edition: AuthoringEdition): ReadonlySet<string> => new Set(characteristics(edition).map((entry) => entry.key));

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

    draft.complications.forEach((entry, index) => problems.push(...validateComplication(entry, index, draft.edition)));

    return [...problems].sort((a, b) => (a.severity === b.severity ? 0 : a.severity === 'error' ? -1 : 1));
}
