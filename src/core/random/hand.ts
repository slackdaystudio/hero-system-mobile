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
 * A hand of candidates to choose between, rather than one character to accept.
 *
 * **Why a hand.** Four players rolling one character each on four phones cannot coordinate — the
 * app has no idea what anyone else drew — so no distribution can promise a table anything. Deal
 * five and let the player keep one, and the coordination happens at the table where it belongs:
 * "I've got a Brick and a Mentalist, which do we need?" A bad draw also stops mattering, because
 * there are four others beside it.
 *
 * Weighting the archetypes was the other idea, and it is worth writing down why it lost. Uniform is
 * the **minimum-collision** distribution: any weighting concentrates probability mass, so it makes
 * two players drawing the same archetype *more* likely, not less. Weighting toward the middle would
 * buy fewer Bricks at the price of a table of four Patriots, which is worse — at least the Bricks
 * were differently built.
 *
 * **Archetypes in a hand are distinct, and that part is not cosmetic.** Every archetype has exactly
 * one powerset, so two candidates sharing an archetype share their characteristics *and* their
 * powers — only the skills differ. That is a wasted slot, and dealt uniformly it would happen to
 * about two hands in three.
 */
import {heroDesignerCharacter} from 'core/hero';
import type {Rng} from 'core/ports';
import type {Obj} from 'core/traits';
import {pickDistinct} from './allocate';
import {buildRecipe, generatableArchetypes, rollRecipeFor, type GeneratedCharacter} from './generate';
import {LOW_POWERED_5E, type PowerLevel} from './powerLevel';
import {ruleOfXStats} from './ruleOfXStats';
import type {RuleOfXStats} from './ruleOfX';

/** How many to deal. Five is enough to argue about and few enough to read at a glance. */
export const HAND_SIZE = 5;

/** One option in a hand: the character, and enough of its numbers to choose it by. */
export interface Candidate {
    readonly rolled: GeneratedCharacter;
    /**
     * Read off the built character, not the recipe.
     *
     * Carried here because building is the expensive half of a deal (~40ms each, against ~4ms to
     * read the stats off the result) and the screen needs both. Doing it once means the numbers on
     * the card are the numbers of the character that gets saved, not of a rebuild that agreed.
     */
    readonly stats: RuleOfXStats;
}

/**
 * Deal a hand of candidates, one per archetype, no archetype twice.
 *
 * Never longer than the number of archetypes that can be generated — asking for twenty gets eleven
 * rather than a repeat. Everything except the archetype is rolled independently per candidate, so
 * two candidates may well share a profession or an effect; those don't make them the same character.
 */
export function dealHand(rng: Rng, level: PowerLevel = LOW_POWERED_5E, size: number = HAND_SIZE): Candidate[] {
    const archetypes = generatableArchetypes(level.edition);

    if (archetypes.length === 0) {
        throw new Error(`No archetype has a structured powerset for ${level.name}`);
    }

    return pickDistinct(rng, archetypes, size).map((archetype) => {
        const rolled = buildRecipe(rollRecipeFor(rng, level, archetype), level);

        return {rolled, stats: ruleOfXStats(heroDesignerCharacter.getCharacter(rolled.parsed) as unknown as Obj)};
    });
}
