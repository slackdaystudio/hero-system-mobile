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
 * Powers, and the advantages and limitations that price them (Phase C of
 * docs/CHARACTER_AUTHORING.md).
 *
 * Every number is derived from the HERO rules and the arithmetic is in the comment. The three
 * costs a power has are all pinned, because they answer different questions and only the middle
 * one moves with an advantage: `cost` is what the dice are worth, `activeCost` is that times the
 * advantages, `realCost` is that divided by the limitations.
 */
import {authorable, build, emptyDraft, modifier, modifiers, parseSource, spendOf, toSource, trait, validate, withheld, type AuthoredCharacter, type AuthoredPower} from 'core/authoring';
import {heroDesignerCharacter} from 'core/hero';
import {characterTraitDecorator} from 'core/traits';

type Obj = Record<string, any>;

const draft = (over: Partial<AuthoredCharacter> = {}): AuthoredCharacter => ({...emptyDraft('6E'), name: 'Probe', ...over});
const errors = (subject: AuthoredCharacter): string[] =>
    validate(subject)
        .filter((problem) => problem.severity === 'error')
        .map((problem) => problem.message);

/** The three costs of every power, in the order the sheet thinks about them. */
const priced = (character: Obj): Array<{label: string; base: number; active: number; real: number}> =>
    (character.powers as Obj[]).map((power) => {
        const decorated = characterTraitDecorator.decorate(power, 'powers', () => character);

        return {label: decorated.label(), base: decorated.cost(), active: decorated.activeCost(), real: decorated.realCost()};
    });

const blast = (over: Partial<AuthoredPower> = {}): AuthoredPower => ({xmlid: 'ENERGYBLAST', name: 'Bolt', input: 'ED', adders: [], levels: 10, modifiers: [], ...over});

describe('powers price by their dice', () => {
    it('prices a Blast at 5 points a die, and names it', () => {
        const character = build(draft({powers: [blast()]}));

        // 6E Blast is 5 points per 1d6. Ten dice, no modifiers: all three costs agree.
        expect(priced(character)).toEqual([{label: 'Bolt', base: 50, active: 50, real: 50}]);
    });

    it('prices Resistant Protection by its defences, and grants them', () => {
        const character = build(
            draft({powers: [{xmlid: 'FORCEFIELD', name: 'Dense Body', input: '', adders: [], levels: 0, modifiers: [], defense: {pd: 17, ed: 17, mental: 0, power: 0}}]}),
        );

        // 6E Resistant Protection is 3 points per 2 points of defence: 34 total → 51.
        expect(priced(character)[0]).toMatchObject({base: 51, real: 51});
        // And the point of the field group: it actually defends. 2 base PD + 17 resistant.
        expect(heroDesignerCharacter.getTotalDefense(character, 'PD')).toBe('19/17');
        expect(heroDesignerCharacter.getTotalDefense(character, 'ED')).toBe('19/17');
    });
});

describe('advantages multiply, limitations divide', () => {
    it('raises the active cost with an advantage', () => {
        const character = build(draft({powers: [blast({name: 'Burst', modifiers: [{xmlid: 'AOE', option: 'RADIUS', levels: 8, adders: []}]})]}));

        // Area Of Effect (8m Radius) is +1/2. 50 x 1.5 = 75 active, and with no limitation the
        // real cost is the same.
        expect(priced(character)).toEqual([{label: 'Burst', base: 50, active: 75, real: 75}]);
    });

    it('lowers the real cost with a limitation, leaving the active cost alone', () => {
        const character = build(draft({powers: [blast({name: 'Wand', modifiers: [{xmlid: 'FOCUS', option: 'OAF', adders: []}]})]}));

        // Obvious Accessible Focus is -1. The dice are unchanged and so is the active cost —
        // 50 / (1 + 1) = 25 real. A limitation never makes a power weaker, only cheaper.
        expect(priced(character)).toEqual([{label: 'Wand', base: 50, active: 50, real: 25}]);
    });

    it('applies both at once, in the right order', () => {
        const character = build(
            draft({
                powers: [
                    blast({
                        name: 'Grenade',
                        modifiers: [
                            {xmlid: 'AOE', option: 'RADIUS', levels: 8, adders: []},
                            {xmlid: 'FOCUS', option: 'OAF', adders: []},
                        ],
                    }),
                ],
            }),
        );

        // Advantages apply to the base, limitations to the active: (50 x 1.5) / 2 = 37.5 → 37,
        // rounded in the player's favour. Doing it the other way round would give 38.
        expect(priced(character)).toEqual([{label: 'Grenade', base: 50, active: 75, real: 37}]);
    });

    it("prices a modifier's own adders, which are easy to miss", () => {
        const bare = build(draft({powers: [blast({modifiers: [{xmlid: 'AOE', option: 'RADIUS', levels: 8, adders: []}]})]}));
        const selective = build(
            draft({powers: [blast({modifiers: [{xmlid: 'AOE', option: 'RADIUS', levels: 8, adders: [{xmlid: 'SELECTIVETARGET'}]}]})]}),
        );

        // Selective is +1/4 on top of the +1/2: 50 x 1.75 = 87.5 → 87. Without nested adders in
        // the catalogue this would silently stay at 75.
        expect(bare.powers[0] && priced(bare)[0].active).toBe(75);
        expect(priced(selective)[0].active).toBe(87);
    });

    it('reads an advantage and a limitation apart by the sign of the cost, not by a flag', () => {
        // Nothing in the draft says which is which — `ModifierCalculator` splits on the computed
        // cost, so a modifier whose option flips its sign lands in the right bucket by itself.
        expect(modifier('AOE', '6E')?.basecost).toBeGreaterThanOrEqual(0);
        expect(modifier('FOCUS', '6E')?.options.some((option) => option.basecost < 0)).toBe(true);
    });
});

describe('the powers catalogue', () => {
    it('offers powers and withholds the ones needing a form of their own', () => {
        const offered = authorable('powers', '6E').map((entry) => entry.xmlid);
        const notYet = withheld('powers', '6E').map((entry) => entry.xmlid);

        expect(offered).toContain('ENERGYBLAST');
        expect(offered).toContain('FORCEFIELD');
        expect(offered.length).toBeGreaterThan(60);

        // Barrier and Endurance Reserve used to stand here; both now declare their fields. Flash
        // draws its adders from Senses.json rather than the template, and Compound Power is a
        // container.
        expect(offered).toContain('FORCEWALL');
        expect(offered).toContain('ENDURANCERESERVE');
        expect(notYet).toContain('FLASH');
        expect(notYet).toContain('COMPOUNDPOWER');
        // The sense enhancements state no cost of their own — they belong to a sense, not a sheet.
        expect(notYet).toContain('TELESCOPIC');
    });

    it('marks powers as modifiable and everything else as not', () => {
        expect(trait('ENERGYBLAST', 'powers', '6E')?.modifiable).toBe(true);
        expect(trait('ACROBATICS', 'skills', '6E')?.modifiable).toBe(false);
    });

    it('offers each edition its own modifiers', () => {
        expect(modifiers('6E').length).toBeGreaterThan(100);
        expect(modifiers('6E').map((entry) => entry.xmlid)).toContain('AOE');
        // De-duplicated, like every other catalogue.
        const ids = modifiers('5E').map((entry) => entry.xmlid);
        expect(ids.length).toBe(new Set(ids).size);
    });

    it("carries a modifier's nested adders", () => {
        expect(modifier('AOE', '6E')?.adders.map((adder) => adder.xmlid)).toEqual(expect.arrayContaining(['SELECTIVETARGET', 'EXPLOSION']));
    });
});

describe('validate — powers', () => {
    it('rejects a modifier this edition does not define, which would change nothing at all', () => {
        const bogus = draft({powers: [blast({modifiers: [{xmlid: 'NOT_A_MODIFIER', adders: []}]})]});

        expect(errors(bogus)).toEqual([expect.stringContaining('has no modifier')]);

        // The demonstration: it builds, and the power costs exactly what it did unmodified.
        expect(priced(build(bogus))[0]).toMatchObject({base: 50, active: 50, real: 50});
    });

    it('rejects a modifier with no option chosen', () => {
        expect(errors(draft({powers: [blast({modifiers: [{xmlid: 'FOCUS', adders: []}]})]}))).toEqual([expect.stringContaining('needs one of')]);
    });

    it('rejects a Resistant Protection with no defences, which would cost points and defend nothing', () => {
        const naked = draft({powers: [{xmlid: 'FORCEFIELD', name: 'Hollow', input: '', adders: [], levels: 0, modifiers: []}]});

        expect(errors(naked)).toEqual([expect.stringContaining('grants no defence')]);
    });

    it('warns rather than blocks when the defences are all zero', () => {
        const zeroed = draft({powers: [{xmlid: 'FORCEFIELD', name: 'Nothing', input: '', adders: [], levels: 0, modifiers: [], defense: {pd: 0, ed: 0, mental: 0, power: 0}}]});

        expect(errors(zeroed)).toEqual([]);
        expect(validate(zeroed).some((problem) => problem.severity === 'warning' && problem.message.includes('no defence'))).toBe(true);
    });

    it('rejects a power that needs a form of its own rather than offering a broken one', () => {
        // Barrier and Endurance Reserve used to stand here and are now offered. Flash draws its
        // adders from `Senses.json` rather than from the template.
        expect(errors(draft({powers: [{xmlid: 'FLASH', name: 'Blind', input: '', adders: [], levels: 4, modifiers: []}]}))).toEqual([
            expect.stringContaining('form of its own'),
        ]);
    });
});

describe('a power survives storage', () => {
    const complete = draft({
        characteristics: {str: 20},
        powers: [
            blast({
                name: 'Grenade',
                modifiers: [
                    {xmlid: 'AOE', option: 'RADIUS', levels: 8, adders: [{xmlid: 'SELECTIVETARGET'}]},
                    {xmlid: 'FOCUS', option: 'OAF', adders: []},
                ],
            }),
            {xmlid: 'FORCEFIELD', name: 'Dense Body', input: '', adders: [], levels: 0, modifiers: [], defense: {pd: 17, ed: 17, mental: 0, power: 0}},
        ],
    });

    it('round-trips, modifiers and defences and all', () => {
        const reopened = parseSource(JSON.parse(JSON.stringify(toSource(complete))))!;

        expect(reopened).toEqual(complete);
        expect(build(reopened)).toEqual(build(complete));
    });

    it('counts every power toward the total', () => {
        const spend = spendOf(build(complete));

        // Grenade: (50 x 1.75) / 2 = 43.75 → 43. Dense Body: 51.
        expect(spend.traits).toBe(94);
    });

    it('reads a Phase B source, which had no powers key, as empty', () => {
        const phaseB = {edition: '6E', name: 'Old', player: '', characteristics: {}, skills: [], perks: [], talents: [], complications: []};

        expect(parseSource(phaseB)).toEqual({...emptyDraft('6E'), name: 'Old'});
    });
});
