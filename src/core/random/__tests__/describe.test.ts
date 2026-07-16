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
 * Saying a roll out loud.
 *
 * These rules are only correct *about the current tables* — the vowel rule would be wrong about "an
 * hour", and the profession map is authored rather than derived. So every test here walks the real
 * data rather than asserting the rule in the abstract: if someone adds an effect called "Umbral" or
 * a profession called "Hunter/Huntress", the test that goes red is the one that should.
 */
import type {Rng} from 'core/ports';
import {archetypesFor, SPECIAL_FX} from '../allocate';
import {article, describeBuild, effectLabel, professionLabel, revealSentence, UNTHEMED, VOWEL_EFFECTS} from '../describe';
import {buildRecipe, rollRecipe} from '../generate';
import {LOW_POWERED_5E} from '../powerLevel';
import {autoName, parseRecipe} from '../recipe';
import {skillsetsFor} from '../skillset';

const seededRng = (seed: number): Rng => {
    let state = (seed * 2654435761) % 4294967296;

    return {
        next: (min: number, max: number): number => {
            state = (state * 1664525 + 1013904223) % 4294967296;

            return min + (Math.floor(state / 65536) % (max - min + 1));
        },
    };
};

const build = (specialFx: string, archetype: string, profession: string): {specialFx: string; archetype: string; profession: string} => ({
    specialFx,
    archetype,
    profession,
});

const PROFESSIONS = [...new Set([...skillsetsFor('5e'), ...skillsetsFor('6e')].map((skillset) => skillset.profession))];
const ARCHETYPES = [...new Set([...archetypesFor('5e'), ...archetypesFor('6e')].map((archetype) => archetype.name))];

describe('describing a roll', () => {
    it('reads a roll back as a sentence', () => {
        // Phil's own example, and the one the dialog shows.
        expect(revealSentence(build('Ice', 'Powered Armor', 'Playboy/Socialite'))).toBe('You are an Ice Powered Armor Socialite.');
    });

    describe('a vs an', () => {
        /**
         * Four of the sixteen effects take "an", and one of them is the reason the typo got fixed:
         * "Eldritch". Pinned as a list rather than a rule so that adding a vowel-initial effect —
         * or a tricky one the naive rule would get wrong — has to come past this test.
         */
        it('takes an for exactly the vowel-initial effects', () => {
            expect(VOWEL_EFFECTS).toEqual(['Ice', 'Air', 'Earth', 'Eldritch']);
        });

        it('agrees with the effect when there is one', () => {
            expect(describeBuild(build('Ice', 'Brick', 'Spy'))).toBe('an Ice Brick Spy');
            expect(describeBuild(build('Fire', 'Brick', 'Spy'))).toBe('a Fire Brick Spy');
        });

        /**
         * "an Energy Projector". With no effect the archetype is the first word, so the article has
         * to agree with *it* — a rule that says "look at the effect" is right until Other rolls.
         */
        it('agrees with the archetype when the effect is unthemed', () => {
            expect(describeBuild(build(UNTHEMED, 'Energy Projector', 'Spy'))).toBe('an Energy Projector Spy');
            expect(describeBuild(build(UNTHEMED, 'Brick', 'Spy'))).toBe('a Brick Spy');
        });

        it('never says “a” before a vowel, for any roll the tables can produce', () => {
            const wrong = SPECIAL_FX.flatMap((specialFx) =>
                ARCHETYPES.flatMap((archetype) =>
                    PROFESSIONS.map((profession) => revealSentence(build(specialFx, archetype, profession))).filter((sentence) =>
                        /^You are an? [aeiou]/i.test(sentence) ? !sentence.startsWith('You are an ') : sentence.startsWith('You are an '),
                    ),
                ),
            );

            expect(wrong).toEqual([]);
        });

        it('has an opinion about every word it could have to start with', () => {
            expect([...SPECIAL_FX, ...ARCHETYPES].filter((word) => !['a', 'an'].includes(article(word)))).toEqual([]);
        });
    });

    describe('professions', () => {
        it('prints a single word for the slash-pairs', () => {
            expect(professionLabel('Actor/Actress')).toBe('Actor');
            expect(professionLabel('Playboy/Socialite')).toBe('Socialite');
        });

        it('leaves an ordinary profession alone', () => {
            expect(professionLabel('Soldier')).toBe('Soldier');
            expect(professionLabel('Scientist')).toBe('Scientist');
        });

        /**
         * The map is authored, so nothing keeps it in step with the data except this. A slash in a
         * profession name is unsayable — there is no right way to guess which half to print, which
         * is exactly why the map exists.
         */
        it('has a display form for every slashed profession in either edition', () => {
            expect(PROFESSIONS.filter((profession) => professionLabel(profession).includes('/'))).toEqual([]);
        });

        it('prints no slash in any sentence the tables can produce', () => {
            const slashed = PROFESSIONS.map((profession) => revealSentence(build('Fire', 'Brick', profession))).filter((sentence) => sentence.includes('/'));

            expect(slashed).toEqual([]);
        });
    });

    describe('the unthemed roll', () => {
        /**
         * "Other" is a real answer — plenty of heroes have no elemental theme — but it names the
         * *absence* of an effect, so it is never a word. It stays in the table because it is a
         * legitimate 1-in-16 outcome; it just doesn't get said.
         */
        it('still offers Other as a real roll', () => {
            expect(SPECIAL_FX).toContain(UNTHEMED);
        });

        it('names no effect', () => {
            expect(effectLabel(UNTHEMED)).toBeNull();
            expect(effectLabel('Fire')).toBe('Fire');
        });

        it('leaves the word out of the sentence', () => {
            expect(revealSentence(build(UNTHEMED, 'Brick', 'Spy'))).toBe('You are a Brick Spy.');
        });

        it('leaves the word out of the name', () => {
            expect(autoName({specialFx: UNTHEMED, archetype: 'Brick'})).toBe('Brick');
            expect(autoName({specialFx: 'Fire', archetype: 'Brick'})).toBe('Fire Brick');
        });

        it('never leaves a double space or a stray word behind', () => {
            const malformed = ARCHETYPES.map((archetype) => revealSentence(build(UNTHEMED, archetype, 'Soldier'))).filter(
                (sentence) => sentence.includes('  ') || sentence.includes(UNTHEMED),
            );

            expect(malformed).toEqual([]);
        });
    });

    /**
     * The typo shipped in the legacy app, so 1-in-16 characters out there are called "Eldrich
     * Mystic".
     *
     * Correcting it needs no migration because nothing validates `specialFx`: `parseRecipe` only
     * checks it is a non-empty string, and `resolveRecipe` never reads it at all. A character
     * already saved with the typo keeps its name and stays editable — the two tests below are the
     * evidence for that, and the second is the one that would catch a future `specialFx` that *is*
     * validated against the table.
     */
    describe('Eldritch', () => {
        it('is spelled correctly now', () => {
            expect(SPECIAL_FX).toContain('Eldritch');
            expect(SPECIAL_FX).not.toContain('Eldrich');
            expect(revealSentence(build('Eldritch', 'Mystic', 'Royalty'))).toBe('You are an Eldritch Mystic Royalty.');
        });

        it('leaves a character already saved with the typo alone', () => {
            const rolled = rollRecipe(seededRng(4), LOW_POWERED_5E);
            const stored = {...rolled, specialFx: 'Eldrich', name: `Eldrich ${rolled.archetype}`};

            // Still resolves, still parses, still builds — the effect is not looked up anywhere.
            expect(parseRecipe(stored)).not.toBeNull();
            expect(buildRecipe(stored).spent).toBe(LOW_POWERED_5E.total);

            // ...and its name still reads as auto, so a re-roll would follow the recipe as before.
            expect(autoName(stored)).toBe(stored.name);
        });
    });
});
