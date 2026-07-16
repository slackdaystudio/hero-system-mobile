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
 * Saying what a roll produced, in English: "an Ice Powered Armor Socialite".
 *
 * The generator has always spoken in table keys — `specialFx`, `archetype.name`,
 * `skillset.profession` — because that is what they are. Concatenating them was fine while the only
 * reader was {@link autoName}, which nobody looks at twice. The Generate dialog reads the roll back
 * to the player as a sentence, and a sentence has rules the tables don't.
 *
 * Three of them, and each is here because the data made it necessary rather than because English
 * did:
 *
 * | Rule | Why |
 * |---|---|
 * | `a` / `an` | "a Ice Powered Armor". Four of the sixteen effects start with a vowel. |
 * | Profession display forms | "Actor/Actress" is a slash-pair in the table; you can't say it. |
 * | "Other" is not an effect | "You are an Other Brick Spy" — it's the *absence* of an effect. |
 *
 * Deliberately in `core/`, next to the data it describes: these are facts about the tables, not
 * about the screen, and they are pinned by tests that walk the real data. `autoName` already sets
 * the precedent that a player-visible string can be assembled here.
 */
import specialFxData from '../data/random/specialfx.json';

const SPECIAL_FX: readonly string[] = (specialFxData as unknown as {effects: string[]}).effects;

/**
 * The effects list's placeholder for "no particular effect".
 *
 * A real 1-in-16 roll and a real answer — plenty of heroes have no elemental theme — but it is the
 * name of a *gap*, so it is never printed. A Brick who rolls it is "a Brick", not "an Other Brick".
 */
export const UNTHEMED = 'Other';

/**
 * What a rolled effect is called, or null when it names no effect at all.
 *
 * Null rather than an empty string: callers have to decide what to do with the hole, and `''` would
 * let them paper over it into a double space.
 */
export const effectLabel = (specialFx: string): string | null => (specialFx === UNTHEMED ? null : specialFx);

/**
 * The professions whose table key is a slash-pair, and the single word to print instead.
 *
 * Authored, not derived — the printable form is the gender-neutral member, and that is not
 * positional: it's the *first* of "Actor/Actress" and the *second* of "Playboy/Socialite". A test
 * pins that every slashed profession in either edition's data has an entry here.
 */
const PROFESSION_LABELS: Readonly<Record<string, string>> = {
    'Actor/Actress': 'Actor',
    'Playboy/Socialite': 'Socialite',
};

/** What a profession is called in a sentence — "Socialite" for the table's "Playboy/Socialite". */
export const professionLabel = (profession: string): string => PROFESSION_LABELS[profession] ?? profession;

/**
 * `a` or `an` for a word.
 *
 * The naive vowel rule, and it is correct for every word this can be handed — the check is a test
 * over the real effects and archetypes, not the rule's general soundness. It would be wrong about
 * "an hour" or "a unicorn"; neither the effects table nor the archetypes contain a silent `h` or a
 * `yoo-`, and the test goes red if one is ever added.
 */
export const article = (word: string): 'a' | 'an' => ('aeiou'.includes(word.charAt(0).toLowerCase()) ? 'an' : 'a');

/** The words of a build, in reading order, with anything unnamed left out. */
const words = (build: DescribableBuild): string[] =>
    [effectLabel(build.specialFx), build.archetype, professionLabel(build.profession)].filter((word): word is string => word !== null);

/** The parts of a roll a sentence is made of. Structurally a `CharacterRecipe`, without the import. */
export interface DescribableBuild {
    readonly specialFx: string;
    readonly archetype: string;
    readonly profession: string;
}

/**
 * A roll as a noun phrase, article included: "an Ice Powered Armor Socialite".
 *
 * The article agrees with whatever word actually comes first, which is the archetype when the effect
 * is {@link UNTHEMED} — "an Energy Projector", not "a Energy Projector".
 */
export function describeBuild(build: DescribableBuild): string {
    const phrase = words(build);

    return `${article(phrase[0])} ${phrase.join(' ')}`;
}

/** The reveal the Generate dialog shows: "You are an Ice Powered Armor Socialite." */
export const revealSentence = (build: DescribableBuild): string => `You are ${describeBuild(build)}.`;

/** Every effect that takes "an". Exported so a test can pin the list against the data. */
export const VOWEL_EFFECTS: readonly string[] = SPECIAL_FX.filter((effect) => effect !== UNTHEMED && article(effect) === 'an');
