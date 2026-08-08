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
 * The recipe: what a generated character was rolled from, and rebuilding one from it.
 *
 * Only generated characters are editable, and an edit *is* a rebuild — so the load-bearing claims
 * are that a rebuild reproduces the roll exactly, and that every edit leaves a character the rules
 * still accept. Both are checked against the engine rather than asserted.
 */
import {heroDesignerCharacter, TRAIT_CHILD_KEYS} from 'core/hero';
import {withDescendants} from 'core/util';
import {characterTraitDecorator} from 'core/traits';
import type {Rng} from 'core/ports';
import {buildRecipe, generateRandomCharacter, rollRecipe} from '../generate';
import {
    autoName,
    changeProfession,
    changeSpecialFx,
    namedSkillSlots,
    nameSkill,
    parseRecipe,
    renameRecipe,
    rerollArchetype,
    resolveRecipe,
    reviseRecipe,
    type CharacterRecipe,
} from '../recipe';
import {powersetsFor} from '../powerset';
import {LOW_POWERED_5E} from '../powerLevel';

type Obj = Record<string, any>;

/** The generator's own seeded LCG — see generate.test.ts for why it reads the high bits. */
const seededRng = (seed: number): Rng => {
    let state = (seed * 2654435761) % 4294967296;

    return {
        next: (min: number, max: number): number => {
            state = (state * 1664525 + 1013904223) % 4294967296;

            return min + (Math.floor(state / 65536) % (max - min + 1));
        },
    };
};

const documentOf = (recipe: CharacterRecipe): Obj => heroDesignerCharacter.getCharacter(buildRecipe(recipe).parsed) as unknown as Obj;

/** What the character actually costs, priced by the engine across every bucket. */
const spentOn = (character: Obj, buckets: readonly string[]): number =>
    buckets.reduce(
        (total, bucket) =>
            total +
            // Containers included: a framework's slots nest under it (H2) and every one costs.
            withDescendants((character[bucket] ?? []) as Obj[], TRAIT_CHILD_KEYS[bucket]).reduce(
                (sum, trait) => sum + characterTraitDecorator.decorate(trait, bucket, () => character).realCost(),
                0,
            ),
        0,
    );

const powersCost = (character: Obj): number => spentOn(character, ['powers', 'martialArts']);
const skillsCost = (character: Obj): number => spentOn(character, ['skills', 'perks', 'talents']);
const complicationsCost = (character: Obj): number =>
    withDescendants(character.disadvantages as Obj[], TRAIT_CHILD_KEYS.disadvantages).reduce(
        (total, row) => total + characterTraitDecorator.decorate(row, 'disadvantages', () => character).cost(),
        0,
    );

describe('CharacterRecipe', () => {
    /**
     * The claim the whole feature rests on: a saved character can be rebuilt from its recipe alone.
     * If this drifts, editing silently produces a different character than the one the player rolled.
     */
    it('rebuilds byte-for-byte what the roll produced', () => {
        for (let seed = 0; seed < 25; seed++) {
            const generated = generateRandomCharacter(seededRng(seed));
            const rebuilt = buildRecipe(generated.recipe);

            expect(rebuilt.parsed).toEqual(generated.parsed);
            expect(rebuilt.spent).toBe(generated.spent);
        }
    });

    it('needs no rng to rebuild — a recipe fully determines a character', () => {
        const recipe = rollRecipe(seededRng(4));

        expect(buildRecipe(recipe).parsed).toEqual(buildRecipe(recipe).parsed);
    });

    describe('naming', () => {
        it('lets an auto name follow the recipe, and a chosen name outlive it', () => {
            const fireBrick: CharacterRecipe = {...rerollArchetype(seededRng(1), rollRecipe(seededRng(1)), 'Brick'), specialFx: 'Fire', name: 'Fire Brick'};

            // Untouched by the player, so it re-derives.
            expect(reviseRecipe(fireBrick, {archetype: 'Speedster'}).name).toBe('Fire Speedster');
            expect(changeSpecialFx(fireBrick, 'Ice').name).toBe('Ice Brick');

            // Named by the player, so it survives a re-roll.
            const named = renameRecipe(fireBrick, 'Ember');
            expect(reviseRecipe(named, {archetype: 'Speedster'}).name).toBe('Ember');
            expect(changeSpecialFx(named, 'Ice').name).toBe('Ember');
        });

        it('gives a fresh roll an auto name', () => {
            const recipe = rollRecipe(seededRng(9));

            expect(recipe.name).toBe(autoName(recipe));
        });
    });

    describe('parseRecipe', () => {
        it('accepts a recipe it just wrote', () => {
            const recipe = rollRecipe(seededRng(2));

            // Through JSON, the way storage round-trips it.
            expect(parseRecipe(JSON.parse(JSON.stringify(recipe)))).toEqual(recipe);
        });

        it('rejects a recipe naming data that no longer exists, rather than throwing', () => {
            const recipe = rollRecipe(seededRng(2));

            // What a recipe from an older build looks like once an archetype is dropped or
            // renamed. It must read as "not editable", never as a crash on open.
            expect(parseRecipe({...recipe, archetype: 'Sorcerer Supreme'})).toBeNull();
            expect(parseRecipe({...recipe, powerset: 'Powerset From A Past Life'})).toBeNull();
            expect(parseRecipe({...recipe, profession: 'Astronaut'})).toBeNull();
            expect(parseRecipe({...recipe, complications: 'Cursed'})).toBeNull();
            expect(parseRecipe({...recipe, level: '5e-mythic'})).toBeNull();
        });

        it('rejects a powerset belonging to a different archetype', () => {
            // Resolution is scoped to the archetype, so a mismatched pair can't build.
            const brick = powersetsFor('Brick')[0];
            const recipe = {...rollRecipe(seededRng(2)), archetype: 'Energy Projector', powerset: brick.label};

            expect(parseRecipe(recipe)).toBeNull();
        });

        it('rejects junk', () => {
            expect(parseRecipe(null)).toBeNull();
            expect(parseRecipe('Fire Brick')).toBeNull();
            expect(parseRecipe({})).toBeNull();
            expect(parseRecipe({...rollRecipe(seededRng(2)), name: ''})).toBeNull();
        });
    });

    describe('editing', () => {
        it('re-rolls onto a new archetype with a powerset that belongs to it', () => {
            const recipe = rerollArchetype(seededRng(5), rollRecipe(seededRng(5)), 'Brick');

            for (let seed = 0; seed < 20; seed++) {
                const rerolled = rerollArchetype(seededRng(seed), recipe, 'Energy Projector');

                expect(rerolled.archetype).toBe('Energy Projector');
                expect(powersetsFor('Energy Projector').map((powerset) => powerset.label)).toContain(rerolled.powerset);
                expect(resolveRecipe(rerolled)).not.toBeNull();
            }
        });

        it('keeps skills and complications when the archetype is re-rolled', () => {
            // What the confirmation promises: "Powers and characteristics will be replaced.
            // Skills and complications stay."
            const recipe = rerollArchetype(seededRng(6), rollRecipe(seededRng(6)), 'Brick');
            const rerolled = rerollArchetype(seededRng(1), recipe, 'Martial Artist');

            expect(rerolled.profession).toBe(recipe.profession);
            expect(rerolled.complications).toBe(recipe.complications);
            expect(skillsCost(documentOf(rerolled))).toBe(skillsCost(documentOf(recipe)));
        });

        it('leaves powers alone when only the profession changes', () => {
            const recipe = rollRecipe(seededRng(8));
            const swapped = changeProfession(recipe, 'Soldier');

            expect(swapped.powerset).toBe(recipe.powerset);
            expect(swapped.archetype).toBe(recipe.archetype);
            expect(powersCost(documentOf(swapped))).toBe(powersCost(documentOf(recipe)));
        });

        /**
         * The one that keeps the feature honest. An edit rebuilds through the same pipeline as a
         * roll, so an edited character has to come out just as legal — every bucket on budget, and
         * the full 250 spent. A rebuild that quietly lost the skills bucket would still render.
         */
        it('leaves every edited character legal at its full total', () => {
            const professions = ['Soldier', 'Spy', 'Physician'];

            for (const archetype of ['Brick', 'Energy Projector', 'Martial Artist', 'Speedster']) {
                for (let seed = 0; seed < 3; seed++) {
                    const rolled = rerollArchetype(seededRng(seed), rollRecipe(seededRng(seed)), archetype);
                    const edited = renameRecipe(changeProfession(rolled, professions[seed % professions.length]), 'Ember');
                    const built = buildRecipe(edited);
                    const document = documentOf(edited);

                    expect({archetype, spent: built.spent}).toEqual({archetype, spent: LOW_POWERED_5E.total});
                    expect(powersCost(document)).toBe(built.budget.powers);
                    expect(skillsCost(document)).toBe(built.budget.skills);
                    expect(complicationsCost(document)).toBe(LOW_POWERED_5E.limit);
                }
            }
        });

        it('carries an edited name onto the sheet', () => {
            const recipe = renameRecipe(rollRecipe(seededRng(12)), 'Ember');

            expect((documentOf(recipe).characterInfo as Obj).characterName).toBe('Ember');
        });
    });

    /**
     * The prose's `Lang:` and `SS[INT]:` named no language and no science, so the data says
     * "Player Defined" and only the player can fill it in. The answers live on the recipe because a
     * rebuild regenerates the skills bucket from the tables — kept anywhere else, the next re-roll
     * would erase them.
     */
    describe('player-defined skills', () => {
        const soldier = (): CharacterRecipe => changeProfession(rollRecipe(seededRng(5)), 'Soldier');
        const scientist = (): CharacterRecipe => changeProfession(rollRecipe(seededRng(5)), 'Scientist');

        const inputs = (recipe: CharacterRecipe, xmlid: string): string[] =>
            (documentOf(recipe).skills as Obj[]).filter((skill) => skill.xmlid === xmlid).map((skill) => String(skill.input));

        it('finds the slots a profession leaves to the player', () => {
            expect(namedSkillSlots(soldier()).map((slot) => slot.slot)).toEqual(['LANGUAGES#0']);
            // The Scientist's three Science Skills are identical in the data, so they need the ordinal.
            expect(namedSkillSlots(scientist()).map((slot) => slot.slot)).toEqual(['SCIENCE_SKILL#0', 'SCIENCE_SKILL#1', 'SCIENCE_SKILL#2']);
            // Warrior asks nothing of the player.
            expect(namedSkillSlots(changeProfession(rollRecipe(seededRng(5)), 'Warrior'))).toEqual([]);
        });

        it('leaves an unanswered slot reading Player Defined', () => {
            expect(inputs(soldier(), 'LANGUAGES')).toEqual(['Player Defined']);
        });

        it('puts the answer on the sheet', () => {
            const named = nameSkill(soldier(), 'LANGUAGES#0', 'French');

            expect(inputs(named, 'LANGUAGES')).toEqual(['French']);
        });

        it('tells three identical science skills apart', () => {
            let recipe = scientist();
            recipe = nameSkill(recipe, 'SCIENCE_SKILL#0', 'Chemistry');
            recipe = nameSkill(recipe, 'SCIENCE_SKILL#2', 'Biology');

            // The unanswered middle one stays blank rather than shifting up.
            expect(inputs(recipe, 'SCIENCE_SKILL')).toEqual(['Chemistry', 'Player Defined', 'Biology']);
        });

        /**
         * The load-bearing one. An answer replaces the `input` string, which feeds the sheet's label
         * and nothing else — so naming a skill must not be able to unbalance a legal build.
         */
        it('cannot move a single point', () => {
            const before = scientist();
            const after = nameSkill(nameSkill(before, 'SCIENCE_SKILL#0', 'Chemistry'), 'SCIENCE_SKILL#1', 'Xenobiology');

            expect(skillsCost(documentOf(after))).toBe(skillsCost(documentOf(before)));
            expect(skillsCost(documentOf(after))).toBe(25);
            expect(buildRecipe(after).spent).toBe(LOW_POWERED_5E.total);
        });

        it('survives a re-roll — the whole reason it lives on the recipe', () => {
            const named = nameSkill(soldier(), 'LANGUAGES#0', 'French');
            const rerolled = rerollArchetype(seededRng(2), named, 'Brick');

            expect(inputs(rerolled, 'LANGUAGES')).toEqual(['French']);
        });

        it('carries a language across a profession change — the player still speaks it', () => {
            // Keyed by xmlid, not by the data row's id: every set's LANGUAGES#0 asks the same
            // question, so a Soldier who speaks French is a Spy who speaks French.
            const named = nameSkill(soldier(), 'LANGUAGES#0', 'French');

            expect(inputs(changeProfession(named, 'Spy'), 'LANGUAGES')).toEqual(['French']);
        });

        it('keeps an answer through a profession that does not ask, and back', () => {
            const named = nameSkill(soldier(), 'LANGUAGES#0', 'French');
            const viaWarrior = changeProfession(changeProfession(named, 'Warrior'), 'Soldier');

            expect(inputs(viaWarrior, 'LANGUAGES')).toEqual(['French']);
        });

        it('clears back to Player Defined on a blank answer', () => {
            const named = nameSkill(soldier(), 'LANGUAGES#0', 'French');

            expect(inputs(nameSkill(named, 'LANGUAGES#0', '   '), 'LANGUAGES')).toEqual(['Player Defined']);
            expect(nameSkill(named, 'LANGUAGES#0', '').skills).toEqual({});
        });

        it('trims what the player typed', () => {
            expect(nameSkill(soldier(), 'LANGUAGES#0', '  French  ').skills).toEqual({'LANGUAGES#0': 'French'});
        });

        it('never renames the character', () => {
            const recipe = soldier();

            expect(nameSkill(recipe, 'LANGUAGES#0', 'French').name).toBe(recipe.name);
        });

        it('round-trips through storage, and tolerates a recipe written before answers existed', () => {
            const named = nameSkill(soldier(), 'LANGUAGES#0', 'French');
            expect(parseRecipe(JSON.parse(JSON.stringify(named)))?.skills).toEqual({'LANGUAGES#0': 'French'});

            // Recipes already on a player's phone have no `skills` key at all.
            const older: Record<string, unknown> = {...named};
            delete older.skills;

            expect(parseRecipe(older)?.skills).toEqual({});
        });

        it('rejects malformed answers rather than building with them', () => {
            const recipe = soldier();

            expect(parseRecipe({...recipe, skills: 'French'})).toBeNull();
            expect(parseRecipe({...recipe, skills: ['French']})).toBeNull();
            expect(parseRecipe({...recipe, skills: {'LANGUAGES#0': 42}})).toBeNull();
            expect(parseRecipe({...recipe, skills: {'LANGUAGES#0': ''}})).toBeNull();
        });
    });
});
