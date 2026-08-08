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
 * Skills, perks and talents (Phase B of docs/CHARACTER_AUTHORING.md).
 *
 * Costs and rolls are derived from the HERO rules and stated in the comments; neither legacy nor
 * `core/random` is an oracle here. What makes these worth writing is that a skill has three ways to
 * be priced — by characteristic, by familiarity, by a chosen option — and picking the wrong one
 * does not fail, it just costs nothing.
 */
import {authorable, build, catalogue, emptyDraft, isSaveable, parseSource, spendOf, toSource, trait, validate, withheld, type AuthoredCharacter} from 'core/authoring';
import {characterTraitDecorator} from 'core/traits';

type Obj = Record<string, any>;

const draft = (over: Partial<AuthoredCharacter> = {}): AuthoredCharacter => ({...emptyDraft('6E'), name: 'Probe', ...over});
const errors = (subject: AuthoredCharacter): string[] =>
    validate(subject)
        .filter((problem) => problem.severity === 'error')
        .map((problem) => problem.message);

/** Every trait in a category, decorated the way the sheet decorates it. */
const rows = (character: Obj, key: string): Array<{label: string; cost: number; roll: string | null}> =>
    ((character[key] ?? []) as Obj[]).map((entry) => {
        const decorated = characterTraitDecorator.decorate(entry, key, () => character);

        return {label: decorated.label(), cost: decorated.realCost(), roll: (decorated.roll()?.roll as string) ?? null};
    });

describe('the catalogue is what the engine will match against', () => {
    it('de-duplicates: normalization concatenates entries onto the array they came from', () => {
        const skills = catalogue('skills', '6E');
        const ids = skills.map((entry) => entry.xmlid);

        expect(ids.length).toBe(new Set(ids).size);
    });

    it('derives the xmlid of an entry that sits under its own sub-key', () => {
        // `knowledgeSkill` in the template, `KNOWLEDGE_SKILL` to the engine. Getting this wrong
        // produces a catalogue entry no character can ever match.
        expect(trait('KNOWLEDGE_SKILL', 'skills', '6E')).not.toBeNull();
        expect(trait('COMBAT_LUCK', 'talents', '6E')).not.toBeNull();
        expect(trait('CONTACT', 'perks', '6E')).not.toBeNull();
    });

    it('offers each edition only its own entries', () => {
        // 6E folded 5E's separate single-action Lightning Reflexes into an option of the one talent.
        expect(trait('MENTAL_COMBAT_LEVELS', 'skills', '6E')).not.toBeNull();
        expect(trait('MENTAL_COMBAT_LEVELS', 'skills', '5E')).toBeNull();
    });

    it('withholds the traits whose decorators read fields no template declares, and says so', () => {
        const bespoke = withheld('skills', '6E').map((entry) => entry.xmlid);

        expect(bespoke).toContain('WEAPON_FAMILIARITY');
        expect(bespoke).toContain('TRANSPORT_FAMILIARITY');
        // Withheld, not hidden: a caller can count them rather than quietly show a shorter list.
        expect(withheld('skills', '6E').every((entry) => entry.unsupported !== null)).toBe(true);
        expect(authorable('skills', '6E').every((entry) => entry.unsupported === null)).toBe(true);
        expect(authorable('skills', '6E').length).toBeGreaterThan(50);
    });
});

describe('skills — the three ways one can be priced', () => {
    it('prices by characteristic, and rolls against it', () => {
        const character = build(
            draft({
                characteristics: {dex: 18},
                skills: [
                    {xmlid: 'ACROBATICS', input: '', adders: [], characteristic: 'DEX', levels: 0},
                    {xmlid: 'ACROBATICS', input: '', adders: [], characteristic: 'DEX', levels: 2},
                ],
            }),
        );

        // 6E Acrobatics is 3 points on DEX, +2 a level. The roll is 9 + DEX/5 = 9 + 3.6 → 13-.
        expect(rows(character, 'skills')).toEqual([
            {label: 'Acrobatics', cost: 3, roll: '13-'},
            {label: 'Acrobatics', cost: 7, roll: '15-'},
        ]);
    });

    it('prices a familiarity at a point, rolling a flat 8-', () => {
        const character = build(draft({characteristics: {dex: 18}, skills: [{xmlid: 'ACROBATICS', input: '', adders: [], familiarity: true}]}));

        // A familiarity is its own purchase, not "the skill with no levels": 1 point, 8- flat,
        // and deliberately *not* affected by the 18 DEX above.
        expect(rows(character, 'skills')).toEqual([{label: 'Acrobatics', cost: 1, roll: '8-'}]);
    });

    it('prices a Language by its fluency, which is an option not a characteristic', () => {
        const character = build(
            draft({
                skills: [
                    {xmlid: 'LANGUAGES', input: 'French', adders: [], option: 'FLUENT', levels: 0},
                    {xmlid: 'LANGUAGES', input: 'Mandarin', adders: [], option: 'IDIOMATIC', levels: 0},
                ],
            }),
        );

        // fluent conversation 2, idiomatic 4 — straight off the template's option list.
        expect(rows(character, 'skills')).toEqual([
            {label: 'Language: French', cost: 2, roll: null},
            {label: 'Language: Mandarin', cost: 4, roll: null},
        ]);
    });

    it('prices Skill Levels by the breadth chosen, which changes the per-level price', () => {
        const character = build(
            draft({
                skills: [
                    {xmlid: 'SKILL_LEVELS', input: '', adders: [], option: 'CHARACTERISTIC', levels: 3},
                    {xmlid: 'SKILL_LEVELS', input: '', adders: [], option: 'RELATED', levels: 3},
                ],
            }),
        );

        // "with a single Skill or Characteristic Roll" is 2/level; "with any three pre-defined
        // Skills" is 3. Same three levels, different price — which is the whole point of the option.
        expect(rows(character, 'skills').map((row) => row.cost)).toEqual([6, 9]);
    });

    it('carries the free text through to the label', () => {
        const character = build(draft({characteristics: {int: 15}, skills: [{xmlid: 'KNOWLEDGE_SKILL', input: 'The Underworld', adders: [], characteristic: 'INT', levels: 0}]}));

        expect(rows(character, 'skills')).toEqual([{label: 'Knowledge Skill: The Underworld', cost: 3, roll: '12-'}]);
    });
});

describe('perks and talents', () => {
    it("prices a flat perk and talent at the template's own basecost", () => {
        const character = build(
            draft({
                perks: [{xmlid: 'ANONYMITY', input: '', adders: [], levels: 0}],
                talents: [{xmlid: 'ABSOLUTE_TIME_SENSE', input: '', adders: [], levels: 0}],
            }),
        );

        // Both are 3-point buys. They price at 0 unless the trait carries its own basecost —
        // `CharacterTrait.cost()` reads the trait, never the template.
        expect(rows(character, 'perks')).toEqual([{label: 'Anonymity', cost: 3, roll: null}]);
        expect(rows(character, 'talents')).toEqual([{label: 'Absolute Time Sense', cost: 3, roll: null}]);
    });

    it('prices a levelled perk and talent per level', () => {
        const character = build(
            draft({
                perks: [{xmlid: 'CONTACT', input: 'Police Chief', adders: [], levels: 3}],
                talents: [{xmlid: 'COMBAT_LUCK', input: '', adders: [], levels: 2}],
            }),
        );

        expect(rows(character, 'perks')[0].cost).toBe(3); // Contact: 1 a level
        expect(rows(character, 'talents')[0].cost).toBe(12); // Combat Luck: 6 a level
    });

    it('prices a perk with adders through the same adder machinery complications use', () => {
        const bare = build(draft({perks: [{xmlid: 'CONTACT', input: 'Police Chief', adders: [], levels: 2}]}));
        const withAdder = build(
            draft({perks: [{xmlid: 'CONTACT', input: 'Police Chief', adders: [{xmlid: 'USEFUL', option: 'USEFUL'}], levels: 2}]}),
        );

        // "Contact has useful Skills or resources" is +1. The adder path is shared, so this is the
        // same code that prices a Psychological Complication's Situation.
        expect(rows(withAdder, 'perks')[0].cost - rows(bare, 'perks')[0].cost).toBe(1);
    });
});

describe('validate — what a skill gets wrong that the engine will not complain about', () => {
    it('rejects a skill with no characteristic, which would otherwise price at 0', () => {
        const missing = draft({skills: [{xmlid: 'ACROBATICS', input: '', adders: [], levels: 0}]});

        expect(errors(missing)).toEqual([expect.stringContaining('which characteristic')]);

        // The demonstration: the engine builds it happily and charges nothing for it.
        const character = build(missing);
        expect(rows(character, 'skills')).toEqual([{label: 'Acrobatics', cost: 0, roll: null}]);
    });

    it('rejects a characteristic the skill cannot be based on', () => {
        expect(errors(draft({skills: [{xmlid: 'ACROBATICS', input: '', adders: [], characteristic: 'INT', levels: 0}]}))).toEqual([
            expect.stringContaining('cannot be based on INT'),
        ]);
    });

    it('does not demand a characteristic for a familiarity, which rolls a flat 8-', () => {
        expect(errors(draft({skills: [{xmlid: 'ACROBATICS', input: '', adders: [], familiarity: true}]}))).toEqual([]);
    });

    it('rejects a Language with no fluency chosen', () => {
        expect(errors(draft({skills: [{xmlid: 'LANGUAGES', input: 'French', adders: [], levels: 0}]}))).toEqual([expect.stringContaining('needs one of')]);
    });

    it('rejects a trait this build cannot render a form for, rather than offering a broken one', () => {
        expect(errors(draft({skills: [{xmlid: 'WEAPON_FAMILIARITY', input: '', adders: [], levels: 0}]}))).toEqual([expect.stringContaining('form of its own')]);
    });

    it('rejects familiarity on something that does not offer it', () => {
        expect(errors(draft({talents: [{xmlid: 'ABSOLUTE_TIME_SENSE', input: '', adders: [], familiarity: true}]}))).toEqual([
            expect.stringContaining('cannot be taken at familiarity'),
        ]);
    });

    it('names the category in the message, so a player knows which list to look in', () => {
        expect(errors(draft({perks: [{xmlid: 'NOPE', input: '', adders: [], levels: 0}]}))).toEqual([expect.stringContaining('has no perk')]);
        expect(errors(draft({talents: [{xmlid: 'NOPE', input: '', adders: [], levels: 0}]}))).toEqual([expect.stringContaining('has no talent')]);
    });
});

describe('a whole character', () => {
    const complete = draft({
        characteristics: {str: 20, dex: 18, int: 15},
        skills: [
            {xmlid: 'ACROBATICS', input: '', adders: [], characteristic: 'DEX', levels: 0},
            {xmlid: 'LANGUAGES', input: 'French', adders: [], option: 'FLUENT', levels: 0},
        ],
        perks: [{xmlid: 'ANONYMITY', input: '', adders: [], levels: 0}],
        talents: [{xmlid: 'COMBAT_LUCK', input: '', adders: [], levels: 2}],
        complications: [
            {
                xmlid: 'PSYCHOLOGICALLIMITATION',
                input: 'Code Of The Hero',
                adders: [
                    {xmlid: 'SITUATION', option: 'COMMON'},
                    {xmlid: 'INTENSITY', option: 'STRONG'},
                ],
            },
        ],
    });

    it('validates clean', () => {
        expect(isSaveable(validate(complete))).toBe(true);
        expect(errors(complete)).toEqual([]);
    });

    it('totals what the engine says each part costs', () => {
        const spend = spendOf(build(complete));

        // STR 10 + DEX 16 + INT 5 = 31 characteristics.
        expect(spend.characteristics).toBe(31);
        // Acrobatics 3 + French 2 + Anonymity 3 + Combat Luck 12 = 20.
        expect(spend.traits).toBe(20);
        expect(spend.spent).toBe(51);
        // Complications fund the build rather than being part of it.
        expect(spend.complications).toBe(15);
    });

    it('round-trips through storage and rebuilds identically', () => {
        const reopened = parseSource(JSON.parse(JSON.stringify(toSource(complete))))!;

        expect(reopened).toEqual(complete);
        expect(build(reopened)).toEqual(build(complete));
    });

    it('reads a Phase A source, which had no skills/perks/talents keys, as empty', () => {
        // A schema addition must not lock players out of characters they already saved.
        const phaseA = {edition: '6E', name: 'Old', player: '', characteristics: {str: 20}, complications: []};

        expect(parseSource(phaseA)).toEqual({...emptyDraft('6E'), name: 'Old', characteristics: {str: 20}});
    });
});
