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
 * Martial arts and equipment (Phase E of docs/CHARACTER_AUTHORING.md).
 *
 * Two categories with almost nothing in common. A maneuver is priced by a flat `basecost` and is
 * interesting only for its **combat line**, which the engine reads off the trait rather than the
 * template. Equipment is powers in a different bucket, so what is worth testing is that it really
 * does behave like one — same catalogue, same modifiers, same field groups.
 */
import {authorable, build, catalogue, emptyDraft, parseSource, spendOf, toSource, trait, validate, withheld, type AuthoredCharacter, type AuthoredPower} from 'core/authoring';
import {heroDesignerCharacter} from 'core/hero';
import {characterTraitDecorator} from 'core/traits';

type Obj = Record<string, any>;

const draft = (over: Partial<AuthoredCharacter> = {}): AuthoredCharacter => ({...emptyDraft('6E'), name: 'Probe', ...over});
const errors = (subject: AuthoredCharacter): string[] =>
    validate(subject)
        .filter((problem) => problem.severity === 'error')
        .map((problem) => problem.message);

const attributes = (character: Obj, key: string, index = 0): Record<string, string> => {
    const decorated = characterTraitDecorator.decorate((character[key] as Obj[])[index], key, () => character);

    return Object.fromEntries(decorated.attributes().map((attribute) => [attribute.label, String(attribute.value)]));
};

const costOf = (character: Obj, key: string, index = 0): number =>
    characterTraitDecorator.decorate((character[key] as Obj[])[index], key, () => character).realCost();

describe('martial maneuvers', () => {
    it("derives a maneuver's xmlid from its display, as the engine does", () => {
        // The template states no xmlid at all — `normalizeTemplateItem` builds one from `display`.
        // "Basic Strike" becomes BASIC_STRIKE, and the emitted trait says `xmlid: 'MANEUVER'` plus
        // a display so the engine derives it exactly once, in its own code.
        expect(trait('BASIC_STRIKE', 'martialArts', '6E')?.display).toBe('Basic Strike');
        expect(trait('CHOKE_HOLD', 'martialArts', '6E')).not.toBeNull();
    });

    it('prices a maneuver at its flat cost', () => {
        const character = build(
            draft({
                martialArts: [
                    {xmlid: 'BASIC_STRIKE', input: '', adders: [], levels: 0},
                    {xmlid: 'MARTIAL_DODGE', input: '', adders: [], levels: 0},
                ],
            }),
        );

        expect(costOf(character, 'martialArts', 0)).toBe(3); // Basic Strike
        expect(costOf(character, 'martialArts', 1)).toBe(4); // Martial Dodge
    });

    it('carries the combat line, which the engine reads off the trait and not the template', () => {
        const character = build(draft({characteristics: {str: 20}, martialArts: [{xmlid: 'BASIC_STRIKE', input: '', adders: [], levels: 0}]}));

        // A maneuver emitted without these renders with no OCV, no DCV and no effect, priced
        // correctly — the quiet failure this copying exists to prevent.
        expect(attributes(character, 'martialArts')).toMatchObject({Phase: '½', OCV: '+1', DCV: '+0'});
    });

    it('folds STR into the damage, so the same maneuver hits harder on a stronger character', () => {
        const weak = build(draft({characteristics: {str: 10}, martialArts: [{xmlid: 'BASIC_STRIKE', input: '', adders: [], levels: 0}]}));
        const strong = build(draft({characteristics: {str: 20}, martialArts: [{xmlid: 'BASIC_STRIKE', input: '', adders: [], levels: 0}]}));

        // Basic Strike is +2 DC. STR 10 gives 2 DC, so 4d6; STR 20 gives 4, so 6d6.
        expect(attributes(weak, 'martialArts').Effect).toBe('4d6 Strike');
        expect(attributes(strong, 'martialArts').Effect).toBe('6d6 Strike');
    });

    it('offers both editions their maneuvers and withholds only what needs its own form', () => {
        for (const edition of ['5E', '6E'] as const) {
            expect(authorable('martialArts', edition).length).toBe(catalogue('martialArts', edition).length - 1);
        }

        // Weapon Element wants a list of the weapons a style covers, which no template describes.
        expect(withheld('martialArts', '6E').map((entry) => entry.xmlid)).toEqual(['WEAPON_ELEMENT']);
    });

    it('rejects a maneuver this edition does not have', () => {
        expect(errors(draft({martialArts: [{xmlid: 'NOT_A_MANEUVER', input: '', adders: [], levels: 0}]}))).toEqual([expect.stringContaining('has no maneuver')]);
    });
});

describe('equipment is powers in a different bucket', () => {
    const vest: AuthoredPower = {
        xmlid: 'FORCEFIELD',
        name: 'Leather Vest',
        input: '',
        adders: [],
        levels: 0,
        modifiers: [],
        defense: {pd: 4, ed: 4, mental: 0, power: 0},
    };

    it('prices an item exactly as the same power would price', () => {
        const carried = build(draft({equipment: [vest]}));
        const innate = build(draft({powers: [vest]}));

        // 8 points of resistant defence at 3 per 2 = 12, wherever it is kept.
        expect(costOf(carried, 'equipment')).toBe(12);
        expect(costOf(innate, 'powers')).toBe(12);
    });

    it("does NOT add its defence to the character's totals, which is the engine's own limit", () => {
        const carried = build(draft({equipment: [vest]}));
        const innate = build(draft({powers: [vest]}));

        // Same item, same cost, different effect on the sheet. `powersForTotals` reads
        // `character.powers` and nothing in the engine ever reads `character.equipment`, so a vest
        // costs its points and defends nothing. The identical power bought innately defends 4.
        //
        // Pinned rather than worked around: it is faithful to legacy and the golden masters agree,
        // so changing it is a correctness-pass decision with a rules question attached, not
        // something an authoring layer should quietly paper over. `validate` warns instead.
        expect(heroDesignerCharacter.getTotalDefense(carried, 'PD')).toBe('2/0');
        expect(heroDesignerCharacter.getTotalDefense(innate, 'PD')).toBe('6/4');
    });

    it('warns that a defensive item will not count, rather than letting it surprise anyone', () => {
        const problems = validate(draft({equipment: [vest]}));

        expect(problems.filter((problem) => problem.severity === 'error')).toEqual([]);
        expect(problems.some((problem) => problem.severity === 'warning' && problem.message.includes('will not add to'))).toBe(true);
    });

    it('takes modifiers like a power', () => {
        const character = build(draft({equipment: [{...vest, modifiers: [{xmlid: 'FOCUS', option: 'OAF', adders: []}]}]}));

        expect(costOf(character, 'equipment')).toBe(6); // 12 / (1 + 1)
    });

    it('is validated by the powers rules, and says where the problem is', () => {
        const problem = validate(draft({equipment: [{xmlid: 'FORCEFIELD', name: 'Hollow', input: '', adders: [], levels: 0, modifiers: []}]})).find(
            (entry) => entry.severity === 'error',
        )!;

        expect(problem.message).toContain('grants no defence');
        expect(problem.path).toBe('equipment[0]');
    });

    it('stays a separate list from powers on the built character', () => {
        const character = build(draft({powers: [{xmlid: 'ENERGYBLAST', name: 'Bolt', input: 'ED', adders: [], levels: 10, modifiers: []}], equipment: [vest]}));

        expect((character.powers as Obj[]).map((power) => power.name)).toEqual(['Bolt']);
        expect((character.equipment as Obj[]).map((item) => item.name)).toEqual(['Leather Vest']);
    });
});

describe('a character with everything', () => {
    const everything = draft({
        characteristics: {str: 20, dex: 18},
        skills: [{xmlid: 'ACROBATICS', input: '', adders: [], characteristic: 'DEX', levels: 0}],
        martialArts: [{xmlid: 'BASIC_STRIKE', input: '', adders: [], levels: 0}],
        equipment: [{xmlid: 'FORCEFIELD', name: 'Vest', input: '', adders: [], levels: 0, modifiers: [], defense: {pd: 4, ed: 4, mental: 0, power: 0}}],
        frameworks: [{kind: 'multipower', name: 'Belt', reserve: 30, modifiers: [], slots: [{xmlid: 'ENERGYBLAST', name: 'Dart', input: 'ED', adders: [], levels: 6, modifiers: []}]}],
    });

    it('totals every bucket', () => {
        const spend = spendOf(build(everything));

        // STR 10 + DEX 16 = 26 characteristics.
        expect(spend.characteristics).toBe(26);
        // Acrobatics 3 + Basic Strike 3 + Vest 12 + Belt 30 + Dart (30 active / 10) 3 = 51.
        expect(spend.traits).toBe(51);
    });

    it('round-trips through storage and rebuilds identically', () => {
        const reopened = parseSource(JSON.parse(JSON.stringify(toSource(everything))))!;

        expect(reopened).toEqual(everything);
        expect(build(reopened)).toEqual(build(everything));
    });

    it('reads a Phase D source, which had no martialArts or equipment keys, as empty', () => {
        const phaseD = {edition: '6E', name: 'Old', player: '', characteristics: {}, skills: [], perks: [], talents: [], powers: [], frameworks: [], complications: []};

        expect(parseSource(phaseD)).toEqual({...emptyDraft('6E'), name: 'Old'});
    });
});
