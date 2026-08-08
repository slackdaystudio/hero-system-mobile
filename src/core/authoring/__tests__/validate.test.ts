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
 * The validator earns its place by catching what the engine will *not* complain about.
 *
 * Each error case below is paired with a demonstration of the silent failure it prevents — the
 * point is not that `validate` returns a string, it is that without it the character would save
 * looking correct and costing less than it should.
 */
import {build, emit, emptyDraft, isSaveable, validate, type AuthoredCharacter} from 'core/authoring';
import {characterTraitDecorator} from 'core/traits';

type Obj = Record<string, any>;

const draft = (over: Partial<AuthoredCharacter> = {}): AuthoredCharacter => ({...emptyDraft('6E'), name: 'Probe', ...over});
const errors = (subject: AuthoredCharacter): string[] => validate(subject).filter((problem) => problem.severity === 'error').map((problem) => problem.message);

describe('validate — the silent-zero trap', () => {
    const unknownComplication = draft({complications: [{xmlid: 'NOT_A_REAL_COMPLICATION', input: 'Whatever', adders: []}]});

    it('rejects a complication this edition does not define', () => {
        expect(errors(unknownComplication)).toEqual([expect.stringContaining('has no complication')]);
        expect(isSaveable(validate(unknownComplication))).toBe(false);
    });

    it('demonstrates why: the engine prices the same thing at 0 without complaint', () => {
        const character = build(unknownComplication);
        const [complication] = character.disadvantages as Obj[];

        // No template resolved...
        expect(complication.template).toBeUndefined();
        // ...so it is worth nothing, and nothing threw on the way here. On the sheet this reads as
        // a complication the player took, funding a 5E build with points that do not exist.
        expect(characterTraitDecorator.decorate(complication, 'disadvantages', () => character).cost()).toBe(0);
    });

    it('rejects a characteristic the edition abolished, which would otherwise throw on build', () => {
        // 6E deleted COM. `getCharacteristicFields` reads the template entry's definition with no
        // guard, so this is one of the few inputs that does not fail quietly.
        expect(errors(draft({characteristics: {com: 20}}))).toEqual([expect.stringContaining('6E has no "COM"')]);
        expect(errors(draft({edition: '5E', characteristics: {ocv: 8}}))).toEqual([expect.stringContaining('5E has no "OCV"')]);
    });

    it("accepts each edition's own characteristics", () => {
        expect(errors(draft({edition: '5E', characteristics: {com: 20, str: 15}})).length).toBe(0);
        expect(errors(draft({edition: '6E', characteristics: {ocv: 8, str: 15}})).length).toBe(0);
    });
});

describe('validate — required adders', () => {
    it('rejects a Psychological Complication with no Situation or Intensity', () => {
        // Both are `required: true` in the template. Without them it prices at 0 — legal-looking,
        // and free.
        expect(errors(draft({complications: [{xmlid: 'PSYCHOLOGICALLIMITATION', input: 'Code', adders: []}]}))).toEqual([
            expect.stringContaining('Situation'),
            expect.stringContaining('Intensity'),
        ]);
    });

    it('rejects an option that is not one of the offered ones', () => {
        expect(
            errors(
                draft({
                    complications: [
                        {
                            xmlid: 'PSYCHOLOGICALLIMITATION',
                            input: 'Code',
                            adders: [
                                {xmlid: 'SITUATION', option: 'CATASTROPHIC'},
                                {xmlid: 'INTENSITY', option: 'STRONG'},
                            ],
                        },
                    ],
                }),
            ),
        ).toEqual([expect.stringContaining('needs one of')]);
    });

    it('accepts a complete one', () => {
        expect(
            errors(
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
            ),
        ).toEqual([]);
    });
});

describe('validate — Rivalry, whose label reads an adder', () => {
    // Rivalry declares no `inputlabel`: it is described entirely through adders, and its
    // `DESCRIPTION` is a free-text one whose optionAlias carries the player's words behind an
    // opening bracket. `Complication.label()` slices that bracket off.
    const rivalryWithout = draft({complications: [{xmlid: 'RIVALRY', input: '', adders: []}]});

    it('rejects a Rivalry missing the adders the template marks required', () => {
        // The template already says `required: true` for all five, so no special-case list is
        // needed — DESCRIPTION among them.
        expect(errors(rivalryWithout)).toEqual([
            expect.stringContaining('Rivalry Situation'),
            expect.stringContaining('Rivalry Desc.'),
            expect.stringContaining("Rival's Power"),
            expect.stringContaining('Fierceness'),
            expect.stringContaining('Knowledge'),
        ]);
    });

    it('rejects a Rivalry whose description is blank, which renders as nothing at all', () => {
        expect(
            errors(
                draft({
                    complications: [
                        {
                            xmlid: 'RIVALRY',
                            input: '',
                            adders: [
                                {xmlid: 'SITUATION', option: 'PROFESSIONAL'},
                                {xmlid: 'DESCRIPTION', text: '   '},
                                {xmlid: 'POWER', option: 'AS'},
                                {xmlid: 'FIERCENESS', option: 'OUTDO'},
                                {xmlid: 'KNOWLEDGE', option: 'AWARE'},
                            ],
                        },
                    ],
                }),
            ),
        ).toEqual([expect.stringContaining('needs some text')]);
    });

    it('demonstrates why: rendering it throws, and the sheet turns that into a 0-point row', () => {
        const character = build(rivalryWithout);
        const [complication] = character.disadvantages as Obj[];

        // `Complication.label()` does `adderMap.get('DESCRIPTION').optionAlias.slice(1)` unguarded.
        // characterSheet catches this and emits a stub row — the player sees a complication that
        // costs nothing and never sees an error.
        expect(() => characterTraitDecorator.decorate(complication, 'disadvantages', () => character).label()).toThrow();
    });

    it('labels a complete Rivalry from the description the player typed', () => {
        const character = build(
            draft({
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
            }),
        );
        const [complication] = character.disadvantages as Obj[];

        expect(characterTraitDecorator.decorate(complication, 'disadvantages', () => character).label()).toBe('Rivalry: Doctor Destroyer');
    });
});

describe('validate — advice, not obstruction', () => {
    it('warns about a nameless character but still allows the save', () => {
        const problems = validate(draft({name: '   '}));

        expect(problems).toContainEqual(expect.objectContaining({severity: 'warning', path: 'name'}));
        expect(isSaveable(problems)).toBe(true);
    });

    it('warns when a complication has no input, because the label falls back to its type', () => {
        const problems = validate(
            draft({
                complications: [
                    {
                        xmlid: 'PSYCHOLOGICALLIMITATION',
                        input: '',
                        adders: [
                            {xmlid: 'SITUATION', option: 'COMMON'},
                            {xmlid: 'INTENSITY', option: 'STRONG'},
                        ],
                    },
                ],
            }),
        );

        expect(problems.filter((problem) => problem.severity === 'error')).toEqual([]);
        expect(problems).toContainEqual(expect.objectContaining({severity: 'warning'}));

        // And the claim in that warning is true: no `input`, so no ": …" on the label.
        const character = build(draft({complications: [{xmlid: 'PSYCHOLOGICALLIMITATION', input: '', adders: [{xmlid: 'SITUATION', option: 'COMMON'}]}]}));
        const [complication] = character.disadvantages as Obj[];
        expect(characterTraitDecorator.decorate(complication, 'disadvantages', () => character).label()).not.toContain(':');
    });

    it('sorts errors ahead of warnings', () => {
        const problems = validate(draft({name: '', complications: [{xmlid: 'NOPE', input: '', adders: []}]}));

        expect(problems[0].severity).toBe('error');
        expect(problems[problems.length - 1].severity).toBe('warning');
    });
});

describe('validate — a draft it passes is one the engine can build', () => {
    it('builds every complication the edition offers, when validate is happy with it', () => {
        // The guarantee worth having: "no errors" means the sheet will render it. Anything that
        // throws here is a hole in the validator, not a bad test.
        const complete = draft({
            characteristics: {str: 20, dex: 18},
            complications: [
                {
                    xmlid: 'HUNTED',
                    input: 'Arch Enemy',
                    adders: [
                        {xmlid: 'APPEARANCE', option: 'EIGHT'},
                        {xmlid: 'CAPABILITIES', option: 'AS'},
                        {xmlid: 'MOTIVATION', option: 'HARSH'},
                    ],
                },
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
                {xmlid: 'UNLUCK', input: '', adders: [], levels: 2},
            ],
        });

        expect(errors(complete)).toEqual([]);

        const character = build(complete);
        for (const complication of character.disadvantages as Obj[]) {
            const decorated = characterTraitDecorator.decorate(complication, 'disadvantages', () => character);
            expect(() => decorated.label()).not.toThrow();
            expect(() => decorated.cost()).not.toThrow();
        }

        expect(emit(complete)).toBeDefined();
    });
});
