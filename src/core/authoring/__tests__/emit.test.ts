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
 * The emitter produces something the engine prices correctly.
 *
 * Values are derived from the HERO rules, not from legacy and not from the generator —
 * `core/random` is no more an oracle for authoring than legacy is for `core/random`. Where a
 * number is asserted, the arithmetic behind it is in the comment.
 *
 * The four `.hdc` habits `emit` exists to satisfy each get a test, because each of them fails
 * *quietly*: a missing category throws deep in the engine, a missing `name` renders the literal
 * string "undefined", a missing alias prints an xmlid, and unstable ids break re-opening.
 */
import {build, declaredFor, emit, emptyDraft, parseSource, remaining, spendOf, toSource, type AuthoredCharacter} from 'core/authoring';
import {powerTier} from 'core/hero';
import {characterTraitDecorator} from 'core/traits';

type Obj = Record<string, any>;

const draft = (over: Partial<AuthoredCharacter> = {}): AuthoredCharacter => ({...emptyDraft('6E'), name: 'Probe', ...over});

const characteristic = (character: Obj, key: string): Obj =>
    (character.characteristics as Obj[]).find((entry) => String(entry.shortName).toLowerCase() === key)!;

describe('emit — the .hdc habits the engine relies on', () => {
    it('emits all seven trait categories, so populateTrait never sees undefined', () => {
        const parsed = emit(draft()) as unknown as Obj;

        for (const key of ['skills', 'perks', 'talents', 'martialarts', 'powers', 'equipment', 'disadvantages']) {
            expect({[key]: parsed[key] === undefined}).toEqual({[key]: false});
        }
    });

    it('sets name to null rather than leaving it absent', () => {
        const parsed = emit(draft({complications: [{xmlid: 'UNLUCK', input: '', adders: [], levels: 2}]})) as unknown as Obj;
        const [complication] = parsed.disadvantages.disad as Obj[];

        // Absent (not null) is what renders "undefined (…)" in a label.
        expect(Object.prototype.hasOwnProperty.call(complication, 'name')).toBe(true);
        expect(complication.name).toBeNull();
        expect(Object.prototype.hasOwnProperty.call(parsed.characteristics.str, 'name')).toBe(true);
        expect(parsed.characteristics.str.name).toBeNull();
    });

    it('copies the template display into alias, which the engine prints but never derives', () => {
        const parsed = emit(
            draft({
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
            }),
        ) as unknown as Obj;
        const [complication] = parsed.disadvantages.disad as Obj[];

        expect(complication.alias).toBe('Psychological Complication');
        expect((complication.adder as Obj[]).map((adder) => adder.alias)).toEqual(['Situation Is', 'Intensity Is']);
        // optionAlias is read by the writeup, and by RIVALRY's label, which slices it.
        expect((complication.adder as Obj[]).map((adder) => adder.optionAlias)).toEqual(['Common', 'Strong']);
    });

    it('is pure — the same draft emits the same document, ids and all', () => {
        const subject = draft({
            characteristics: {str: 20, dex: 18},
            complications: [{xmlid: 'HUNTED', input: 'Arch Enemy', adders: [{xmlid: 'APPEARANCE', option: 'EIGHT'}]}],
        });

        expect(emit(subject)).toEqual(emit(subject));
    });
});

describe('emit — characteristics are stated as totals', () => {
    it('lands 6E characteristics exactly on their targets, and prices them per the rules', () => {
        const character = build(draft({characteristics: {str: 20, dex: 18, con: 20}}));

        expect(characteristic(character, 'str').value).toBe(20);
        expect(characteristic(character, 'dex').value).toBe(18);
        expect(characteristic(character, 'con').value).toBe(20);

        // 6E sells STR at 1/point over a base of 10, DEX at 2/point over 10, CON at 1/point over 10.
        expect(characteristic(character, 'str').cost).toBe(10);
        expect(characteristic(character, 'dex').cost).toBe(16);
        expect(characteristic(character, 'con').cost).toBe(10);
    });

    it("lands 5E's figured characteristics on their targets too, without knowing how they're figured", () => {
        // 5E figures ED from CON/5 and STUN from BODY + STR/2 + CON/2, so the levels needed to
        // reach a stated total depend on other characteristics. The emitter probes rather than
        // reimplements — the point of this test is that it arrives, not how.
        const character = build(draft({edition: '5E', characteristics: {str: 30, con: 25, body: 12, ed: 10, stun: 50}}));

        expect(characteristic(character, 'str').value).toBe(30);
        expect(characteristic(character, 'ed').value).toBe(10);
        expect(characteristic(character, 'stun').value).toBe(50);
    });

    it('leaves an unstated characteristic at its base', () => {
        const character = build(draft({characteristics: {str: 20}}));

        expect(characteristic(character, 'dex').value).toBe(10); // 6E DEX base
        expect(characteristic(character, 'dex').cost).toBe(0);
    });

    it('omits COM in 6E and OCV in 5E, because the template does', () => {
        const sixth = emit(draft({edition: '6E'})) as unknown as Obj;
        const fifth = emit(draft({edition: '5E'})) as unknown as Obj;

        expect(sixth.characteristics.com).toBeUndefined();
        expect(sixth.characteristics.ocv).toBeDefined();
        expect(fifth.characteristics.com).toBeDefined();
        expect(fifth.characteristics.ocv).toBeUndefined();
    });
});

describe('emit — complications price and label through the engine', () => {
    const psych = draft({
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

    it('prices a complication as the sum of its adders', () => {
        const character = build(psych);
        const [complication] = character.disadvantages as Obj[];

        // 6E: Situation Common 10 + Intensity Strong 5. The engine sums the adders; nothing here does.
        expect(characterTraitDecorator.decorate(complication, 'disadvantages', () => character).cost()).toBe(15);
    });

    it('labels it from its type and its input', () => {
        const character = build(psych);
        const [complication] = character.disadvantages as Obj[];

        expect(characterTraitDecorator.decorate(complication, 'disadvantages', () => character).label()).toBe('Psychological: Code Of The Hero');
    });

    it("emits Rivalry's free-text description behind the bracket the reader slices off", () => {
        const subject = draft({
            complications: [
                {
                    xmlid: 'RIVALRY',
                    input: '',
                    adders: [
                        {xmlid: 'SITUATION', option: 'PROFESSIONAL'},
                        {xmlid: 'DESCRIPTION', text: 'Doctor Destroyer'},
                        {xmlid: 'POWER', option: 'AS'},
                        {xmlid: 'FIERCENESS', option: 'OUTDO'},
                        {xmlid: 'KNOWLEDGE', option: 'AWARE'},
                    ],
                },
            ],
        });
        const parsed = emit(subject) as unknown as Obj;
        const description = ((parsed.disadvantages.disad as Obj[])[0].adder as Obj[]).find((adder) => adder.xmlid === 'DESCRIPTION')!;

        // The bracket is the format's, not ours: `Complication.label()` does `.slice(1)`.
        expect(description.optionAlias).toBe('(Doctor Destroyer');

        const character = build(subject);
        const [complication] = character.disadvantages as Obj[];
        expect(characterTraitDecorator.decorate(complication, 'disadvantages', () => character).label()).toBe('Rivalry: Doctor Destroyer');

        // Situation 5 + Description 0 + Power 0 + Fierceness 0 + Knowledge 0 = 5.
        expect(characterTraitDecorator.decorate(complication, 'disadvantages', () => character).cost()).toBe(5);
    });
});

describe('spend — the running total the app shows', () => {
    it("sums the engine's own characteristic costs", () => {
        const spend = spendOf(build(draft({characteristics: {str: 20, dex: 18}})));

        expect(spend.characteristics).toBe(26); // STR 10 + DEX 16
        expect(spend.traits).toBe(0);
        expect(spend.spent).toBe(26);
    });

    it('counts complications apart from what is spent', () => {
        const spend = spendOf(
            build(
                draft({
                    characteristics: {str: 20},
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
                }),
            ),
        );

        expect(spend.complications).toBe(15);
        expect(spend.spent).toBe(10); // complications fund a build; they are not part of it
    });

    it('gives 6E complications no points, and 5E disadvantages their full worth', () => {
        const spend = {characteristics: 100, traits: 50, complications: 60, spent: 150};

        // 6E: the 400 is the whole allowance, complications buy nothing.
        expect(remaining(spend, {base: 400, complicationLimit: 75}, '6E')).toMatchObject({total: 400, left: 250});
        // 5E: disadvantages buy points, so the same character has 200 + 60 to spend.
        expect(remaining(spend, {base: 200, complicationLimit: 150}, '5E')).toMatchObject({total: 260, left: 110});
    });

    it('counts anything past the allowance as experience rather than an overspend', () => {
        const spend = {characteristics: 300, traits: 125, complications: 75, spent: 425};
        const over = remaining(spend, {base: 400, complicationLimit: 75}, '6E');

        // In HERO a character costing more than their starting points has *earned* the difference.
        expect(over).toMatchObject({total: 400, spent: 425, left: 0, experience: 25});
        // `left` never goes negative — past the allowance there is nothing left, only experience.
        expect(over.left).toBe(0);
    });

    it('declares that experience, which is what the nameplate prints beside the base', () => {
        // The sheet renders "400 + 25 pts" from exactly these two numbers.
        expect(declaredFor({base: 400, complicationLimit: 75}, 25)).toEqual({basePoints: 400, disadPoints: 75, experience: 25});
        // And a character inside its allowance has earned nothing.
        expect(declaredFor({base: 400, complicationLimit: 75})).toEqual({basePoints: 400, disadPoints: 75, experience: 0});
    });

    it('keeps the campaign tier keyed on base, so earning points does not promote a character', () => {
        const config = declaredFor({base: 400, complicationLimit: 75}, 250);

        // 650 would be Very High-Powered on the 6E ladder; 400 is Standard, and that is what it is.
        expect(powerTier(config.basePoints, false)).toBe('Standard Superheroic');
    });

    it('stops counting 5E disadvantages past the limit', () => {
        const spend = {characteristics: 0, traits: 0, complications: 200, spent: 0};

        expect(remaining(spend, {base: 200, complicationLimit: 150}, '5E').total).toBe(350);
    });
});

describe('source — a draft survives storage', () => {
    it('round-trips through the source column', () => {
        const subject = draft({
            characteristics: {str: 20, dex: 18},
            player: 'Phil',
            complications: [{xmlid: 'HUNTED', input: 'Arch Enemy', adders: [{xmlid: 'APPEARANCE', option: 'EIGHT'}]}],
        });

        expect(parseSource(JSON.parse(JSON.stringify(toSource(subject))))).toEqual(subject);
    });

    it('rebuilds the identical document from a stored draft', () => {
        const subject = draft({characteristics: {str: 25, con: 20}, complications: [{xmlid: 'UNLUCK', input: '', adders: [], levels: 2}]});

        const reopened = parseSource(JSON.parse(JSON.stringify(toSource(subject))))!;

        expect(emit(reopened)).toEqual(emit(subject));
    });
});
