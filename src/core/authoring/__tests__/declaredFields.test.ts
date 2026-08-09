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
 * Barrier and Duplication — the two powers that came off the withheld list by declaring the fields
 * their decorators read.
 *
 * **The oracle for Barrier is the corpus itself.** Five fixtures carry a `FORCEWALL`, so an
 * authored one can be checked against the same Barrier imported from a real `.hdc` — if the two
 * disagree, the emitter is wrong, and no amount of agreeing with my own arithmetic would say so.
 * Duplication has no fixture anywhere, so it is pinned from the template instead, with the
 * arithmetic named.
 *
 * Both priced **NaN** before this: `Barrier.cost()` sums eight fields off the trait and
 * `Duplication.cost()` reads two, all unguarded. NaN is the worst shape the failure can take — it
 * is not an exception, so `characterSheet.ts:333` never catches it and the row renders blank.
 */
import {build, emit, emptyDraft, parseSource, spendOf, toSource, trait as catalogueTrait, validate, type AuthoredCharacter, type AuthoredPower} from '../index';
import {heroDesignerCharacter} from 'core/hero';
import {characterTraitDecorator, type Obj} from 'core/traits';
import {flatten, withDescendants} from 'core/util';

const clone = (name: string): unknown => JSON.parse(JSON.stringify(require(`../../hero/__tests__/fixtures/${name}.json`)));

/** What one authored power costs, on a character that has nothing else. */
const authored = (edition: '5E' | '6E', power: AuthoredPower): number => {
    const character = build({...emptyDraft(edition), name: 'Probe', powers: [power]} as AuthoredCharacter) as unknown as Obj;

    return (character.powers as Obj[]).reduce((total, entry) => total + characterTraitDecorator.decorate(entry, 'powers', () => character).realCost(), 0);
};

/** The same power as a real `.hdc` carries it — the fixture's own `cost()`, before any framework divisor. */
const imported = (fixture: string, name: string): number => {
    const character = heroDesignerCharacter.getCharacter(clone(fixture) as never) as unknown as Obj;
    const found = flatten(character.powers as Obj[], 'powers').find((power: Obj) => String(power.xmlid) === 'FORCEWALL' && String(power.name) === name);

    return characterTraitDecorator.decorate(found!, 'powers', () => character).cost();
};

const barrier = (fields: Record<string, number>, defense: {pd: number; ed: number; mental: number; power: number}, adders: {xmlid: string}[] = []): AuthoredPower => ({
    xmlid: 'FORCEWALL',
    name: 'Probe',
    input: '',
    adders,
    levels: 0,
    modifiers: [],
    defense,
    fields,
});

describe('Barrier prices as the same Barrier read from a .hdc', () => {
    it('matches m-championsmush "General" — the widest one in the corpus', () => {
        // PD 6 / ED 6, 15 long, 7 high, 12 BODY, 1.5 wide, Non-Anchored.
        // 6E: 3 base + (12/2)x3 + 15 + 7 + 12 + (1.5x4)/2 + 10 = 68.
        const mine = authored('6E', barrier({lengthlevels: 15, heightlevels: 7, bodylevels: 12, widthlevels: 1.5}, {pd: 6, ed: 6, mental: 0, power: 0}, [{xmlid: 'NONANCHORED'}]));

        expect(mine).toBe(68);
        expect(mine).toBe(imported('m-championsmush', 'General'));
    });

    it('matches junkyard "Force Wall"', () => {
        // 3 base + (20/2)x3 + 11 + 5 + 1 + 0 = 50. Junkyard's sits in a Multipower, so its *real*
        // cost is a tenth of this — `cost()` is the comparison that isolates the power itself.
        const mine = authored('6E', barrier({lengthlevels: 11, heightlevels: 5, bodylevels: 1, widthlevels: 0}, {pd: 10, ed: 10, mental: 0, power: 0}));

        expect(mine).toBe(50);
        expect(mine).toBe(imported('junkyard', 'Force Wall'));
    });

    it('matches the 5E one, which is a different formula rather than different numbers', () => {
        // 5E: no base, (24/2)x5 = 60, and length and height cost *2 each* — 3x2 + 3x2 = 12. 72.
        // It reads no BODY and no width at all, which is why neither is offered in 5E.
        expect(authored('5E', barrier({lengthlevels: 3, heightlevels: 3}, {pd: 12, ed: 12, mental: 0, power: 0}))).toBe(72);
    });

    it('offers BODY and width in 6E only, because 5E prices neither', () => {
        const keys = (edition: '5E' | '6E'): string[] =>
            catalogueTrait('FORCEWALL', 'powers', edition)!
                .fieldGroups.filter((group) => group.kind === 'levels')
                .flatMap((group) => group.fields.map((field) => field.key));

        expect(keys('6E')).toEqual(['lengthlevels', 'heightlevels', 'bodylevels', 'widthlevels']);
        // A control that changed no number is exactly what H13's variable slot was.
        expect(keys('5E')).toEqual(['lengthlevels', 'heightlevels']);
    });

    it('takes a fractional width, which a whole-number field would have rounded away', () => {
        // `WIDTHLEVELS="1.5"` is what m-championsmush actually carries. At 2 points a metre that is
        // 3 points, and truncating it to 1 would quietly cost the player 2.
        const half = authored('6E', barrier({lengthlevels: 0, heightlevels: 0, bodylevels: 0, widthlevels: 1.5}, {pd: 2, ed: 2, mental: 0, power: 0}));
        const whole = authored('6E', barrier({lengthlevels: 0, heightlevels: 0, bodylevels: 0, widthlevels: 1}, {pd: 2, ed: 2, mental: 0, power: 0}));

        expect(half - whole).toBe(1);
    });
});

describe('Duplication, which has no fixture anywhere and is pinned from the template', () => {
    const duplication = (fields: Record<string, number>): AuthoredPower => ({
        xmlid: 'DUPLICATION',
        name: 'Twin',
        input: '',
        adders: [],
        levels: 0,
        modifiers: [],
        fields,
    });

    it('charges a fifth of what the duplicate is built on', () => {
        // `lvlval: 5` — one point per 5 points of the duplicate. A 200-point twin is 40.
        expect(authored('6E', duplication({points: 200, number: 1}))).toBe(40);
        expect(authored('6E', duplication({points: 100, number: 1}))).toBe(20);
    });

    it('charges 5 for each DOUBLING of the number, not for each duplicate', () => {
        // `multiplierval: 2`, `multipliercost: 5`, via `getMultiplierCost` — so the count is priced
        // logarithmically. Two twins is one doubling, four is two. Reading it as 5-per-head would
        // have made four cost 55 rather than 50, and nothing else would have flagged it.
        expect(authored('6E', duplication({points: 200, number: 2}))).toBe(45);
        expect(authored('6E', duplication({points: 200, number: 4}))).toBe(50);
        expect(authored('6E', duplication({points: 200, number: 8}))).toBe(55);
    });

    it('floors at 1 rather than at 0, as its decorator does', () => {
        expect(authored('6E', duplication({points: 0, number: 1}))).toBe(1);
    });
});

/**
 * Endurance Reserve — the one trait in the catalogue whose cost depends on a **child trait**.
 *
 * A `.hdc` writes it as `<POWER XMLID="ENDURANCERESERVE" LEVELS="100">` wrapping
 * `<POWER XMLID="ENDURANCERESERVEREC" LEVELS="10">`, which the parser turns into `trait.power` —
 * and `EnduranceReserve.cost()` reads `trait.power.levels`. Nothing else needs a sub-power, so the
 * mechanism is capped at one carrying one number rather than generalised into a shape the data
 * does not have.
 *
 * Five corpus fixtures carry one, all 5E, and every one is compared against its authored twin
 * below. There is no 6E Endurance Reserve in the corpus at all, so the 6E numbers are derived from
 * the template with the arithmetic named.
 */
describe('Endurance Reserve, whose Recovery is a nested power', () => {
    const reserve = (edition: '5E' | '6E', end: number, rec: number): number =>
        authored(edition, {xmlid: 'ENDURANCERESERVE', name: 'Battery', input: '', adders: [], levels: end, modifiers: [], fields: {rec}});

    const fixtureReserve = (fixture: string): {imported: number; end: number; rec: number} => {
        const character = heroDesignerCharacter.getCharacter(clone(fixture) as never) as unknown as Obj;
        const found = flatten(character.powers as Obj[], 'powers').find((power: Obj) => String(power.xmlid) === 'ENDURANCERESERVE')!;

        return {
            imported: characterTraitDecorator.decorate(found, 'powers', () => character).cost(),
            end: Number(found.levels),
            rec: Number((found.power as Obj)?.levels ?? 0),
        };
    };

    it.each(['fifth', 'mikayla-priestess', 'psi-blade6'])('prices %s exactly as importing it does', (fixture) => {
        const {imported: cost, end, rec} = fixtureReserve(fixture);

        expect(reserve('5E', end, rec)).toBe(cost);
    });

    it('prices 5E at 1 point per 10 END and 1 per REC', () => {
        // `fifth` buys 100 END and 10 REC: 10 + 10 = 20.
        expect(reserve('5E', 100, 10)).toBe(20);
    });

    it('prices 6E at 1 point per 4 END and 2 per 3 REC, each rounded UP on its own', () => {
        // The two halves are ceilinged separately, which is not the same as ceiling the total:
        // 100 END is 25, and 5 REC is ceil(5/3 x 2) = ceil(3.33) = 4. So 29, not 28.
        expect(reserve('6E', 100, 5)).toBe(29);
        expect(reserve('6E', 100, 10)).toBe(32);
        expect(reserve('6E', 40, 4)).toBe(13);
    });

    it('counts the Recovery once, as part of the reserve rather than as a power of its own', () => {
        const character = build({
            ...emptyDraft('6E'),
            name: 'Probe',
            powers: [{xmlid: 'ENDURANCERESERVE', name: 'Battery', input: '', adders: [], levels: 100, modifiers: [], fields: {rec: 5}}],
        } as AuthoredCharacter) as unknown as Obj;

        // The sub-power sits under `power`, and a power's child key is `powers` — so nothing that
        // walks the tree treats it as a second row. If it did, the meter would double-count it.
        expect((character.powers as Obj[]).length).toBe(1);
        expect(((character.powers as Obj[])[0].power as Obj).levels).toBe(5);
    });

    it('gives the Recovery its own id, since ids have to be unique document-wide', () => {
        const power = ((emit({
            ...emptyDraft('6E'),
            name: 'Probe',
            powers: [{xmlid: 'ENDURANCERESERVE', input: '', adders: [], levels: 20, modifiers: [], fields: {rec: 4}}],
        } as AuthoredCharacter) as unknown as Obj).powers as Obj).power[0] as Obj;

        // `populateTrait` keys parent lookups on ids, so a sub-power sharing its parent's would be
        // a collision waiting for a second one.
        expect((power.power as Obj).id).not.toBe(power.id);
        expect((power.power as Obj).xmlid).toBe('ENDURANCERESERVEREC');
    });

    it('prices an unanswered Recovery as zero rather than NaN', () => {
        const bare = authored('6E', {xmlid: 'ENDURANCERESERVE', name: 'Battery', input: '', adders: [], levels: 20, modifiers: []});

        expect(Number.isNaN(bare)).toBe(false);
        expect(bare).toBe(5); // 20 END at 1 per 4, and a reserve that never refills
    });
});

/**
 * Flash — the one trait built from data that is not a template at all.
 *
 * Its `optionid` names a sense group and any adder that *is* a sense adds another, but the
 * templates declare no options for `FLASH`. The senses live in `Senses.json`, so a form built from
 * the template alone offered nothing to pick and the decorator read `undefined` off a missing
 * `optionid` — it did not even price wrongly, it threw.
 *
 * The fix injects the senses as ordinary options and adders rather than giving Flash a bespoke
 * form, so the picker, the emitter and the validator all work untouched. **The data was missing,
 * not the mechanism.**
 */
describe('Flash, whose choices come from the senses rather than the templates', () => {
    const flash = (edition: '5E' | '6E', levels: number, option: string, adders: {xmlid: string}[] = []): number =>
        authored(edition, {xmlid: 'FLASH', name: 'Dazzle', input: '', adders, levels, modifiers: [], option});

    const corpusFlashes = (fixture: string): Array<{cost: number; option: string; levels: number}> => {
        const character = heroDesignerCharacter.getCharacter(clone(fixture) as never) as unknown as Obj;

        return withDescendants((character.powers ?? []) as Obj[], ['powers'])
            .filter((power: Obj) => String(power.xmlid) === 'FLASH')
            .map((power: Obj) => ({
                cost: characterTraitDecorator.decorate(power, 'powers', () => character).cost(),
                option: String(power.optionid),
                levels: Number(power.levels),
            }));
    };

    it.each([
        ['aoe', '6E'],
        ['starborne', '6E'],
        ['twilight', '6E'],
        ['adamantinerebuild210109', '5E'],
        ['spyder2022', '5E'],
    ] as const)('prices every Flash in %s exactly as importing it does', (fixture, edition) => {
        const found = corpusFlashes(fixture);

        expect(found.length).toBeGreaterThan(0);
        for (const {cost, option, levels} of found) {
            expect(flash(edition, levels, option)).toBe(cost);
        }
    });

    it('charges more to blind a targeting sense than a non-targeting one', () => {
        // Sight is the only targeting group, at 5 a level against 3. That distinction is the whole
        // reason the decorator has to look the option up in the senses at all.
        expect(flash('6E', 4, 'SIGHTGROUP')).toBe(20);
        expect(flash('6E', 4, 'HEARINGGROUP')).toBe(12);
    });

    it('charges for each extra sense, and a group by more than one of its senses', () => {
        // On top of a 20-point Sight Flash: another whole group is 5 (`nontargetinggroupcost`),
        // one sense of one is 3 (`nontargetingsensecost`). Nothing else in the catalogue prices an
        // adder from the *parent's* template like this.
        expect(flash('6E', 4, 'SIGHTGROUP', [{xmlid: 'HEARINGGROUP'}])).toBe(25);
        expect(flash('6E', 4, 'SIGHTGROUP', [{xmlid: 'NORMALHEARING'}])).toBe(23);
    });

    it('offers the six sense groups to blind, and groups plus senses as extras', () => {
        const entry = catalogueTrait('FLASH', 'powers', '6E')!;

        expect(entry.options.map((option) => option.xmlid)).toEqual(['HEARINGGROUP', 'MENTALGROUP', 'RADIOGROUP', 'SIGHTGROUP', 'SMELLGROUP', 'TOUCHGROUP']);
        expect(entry.adders.map((adder) => adder.xmlid)).toEqual(expect.arrayContaining(['SIGHTGROUP', 'NORMALSIGHT', 'DANGER_SENSE']));
    });

    it("does not offer the template's own adders, which cost nothing on a Flash", () => {
        // `Flash.cost()` overrides `cost()` outright and never calls `totalAdders`, so Alterable
        // Origin (+5 anywhere else) contributes zero here. Offering it would be a control that
        // changed no number — the fault H13's variable slot had.
        expect(flash('6E', 4, 'SIGHTGROUP', [{xmlid: 'ALTERABLEORIGIN'}])).toBe(flash('6E', 4, 'SIGHTGROUP'));
        expect(catalogueTrait('FLASH', 'powers', '6E')!.adders.map((adder) => adder.xmlid)).not.toContain('ALTERABLEORIGIN');
    });

    it('blocks a save with no sense chosen, which used to throw rather than mis-price', () => {
        const draft = {...emptyDraft('6E'), name: 'Probe', powers: [{xmlid: 'FLASH', name: 'Dazzle', input: '', adders: [], levels: 4, modifiers: []}]} as AuthoredCharacter;

        // `isGroup(undefined)` calls `.endsWith` on nothing. The row degrades to a cost-0 stub, so
        // the validator is the only thing that can say what is wrong.
        expect(validate(draft).filter((problem) => problem.severity === 'error').map((problem) => problem.message)).toEqual([
            expect.stringContaining('Flash needs one of'),
        ]);
    });
});

/**
 * Compound Power — one purchase that does several things at once, priced as the plain sum of them.
 *
 * The only trait that contains other traits without being a framework, and the last thing on the
 * withheld list. What made it worth care is not the emitting but the **counting**: a container that
 * already totals its own contents is double-charged by anything that walks the tree.
 */
describe('Compound Power, which is the sum of the powers in it', () => {
    const blast = (levels: number, modifiers: AuthoredPower['modifiers'] = []): AuthoredPower => ({
        xmlid: 'ENERGYBLAST',
        name: `Bolt${levels}`,
        input: 'ED',
        adders: [],
        levels,
        modifiers,
    });

    const compound = (powers: AuthoredPower[], modifiers: AuthoredPower['modifiers'] = []): AuthoredCharacter =>
        ({
            ...emptyDraft('6E'),
            name: 'Probe',
            powers: [{xmlid: 'COMPOUNDPOWER', name: 'Combo', input: '', adders: [], levels: 0, modifiers, powers}],
        }) as AuthoredCharacter;

    it('costs what its children cost, added up', () => {
        // A 10d6 Blast is 50 and an 8d6 is 40. One purchase, 90 points.
        expect(spendOf(build(compound([blast(10)])) as unknown as Obj).spent).toBe(50);
        expect(spendOf(build(compound([blast(10), blast(8)])) as unknown as Obj).spent).toBe(90);
    });

    it('counts them ONCE — the container and its contents are the same points', () => {
        const character = build(compound([blast(10), blast(8)])) as unknown as Obj;
        const container = characterTraitDecorator.decorate((character.powers as Obj[])[0], 'powers', () => character).realCost();

        // `spendOf` walks into containers, because a Multipower's slots each cost something on top
        // of its reserve. A compound power is the opposite, and counting both charged 180 for 90.
        expect(container).toBe(90);
        expect(spendOf(character).spent).toBe(container);
    });

    it('ignores a limitation on the compound power itself, so the form does not offer one', () => {
        // `CompoundPower.realCost()` sums its children and discards its own `ModifierCalculator`.
        // Measured, not assumed: an Obvious Accessible Focus here leaves 50 where the same
        // limitation one level down halves it. Offering it would be a control that changed no
        // number — the fault H13's variable slot had.
        const onParent = compound([blast(10)], [{xmlid: 'FOCUS', option: 'OAF', adders: []}]);
        const onChild = compound([blast(10, [{xmlid: 'FOCUS', option: 'OAF', adders: []}])]);

        expect(spendOf(build(onParent) as unknown as Obj).spent).toBe(50);
        expect(spendOf(build(onChild) as unknown as Obj).spent).toBe(25);
    });

    it('emits its children under `power`, which is the key the engine renames', () => {
        const power = ((emit(compound([blast(10), blast(8)])) as unknown as Obj).powers as Obj).power[0] as Obj;

        expect((power.power as Obj[]).map((child) => child.xmlid)).toEqual(['ENERGYBLAST', 'ENERGYBLAST']);
        // Ids come from their own block: taken from the `powers` range they would collide with a
        // standalone power's, and higher up with equipment's at 11000.
        expect((power.power as Obj[]).map((child) => child.id)).toEqual([20000, 20001]);
    });

    it('warns rather than errors when it is empty, since that is a half-finished purchase', () => {
        const problems = validate(compound([]));

        expect(problems.filter((problem) => problem.severity === 'error')).toEqual([]);
        expect(problems.filter((problem) => problem.severity === 'warning').map((problem) => problem.message)).toContain(
            'Compound Power has no powers in it, so it costs nothing.',
        );
    });

    it('round-trips its children through the source column', () => {
        const draft = compound([blast(10), blast(8)]);

        expect(parseSource(JSON.parse(JSON.stringify(toSource(draft))))).toEqual(draft);
    });
});

/**
 * A Variable Power Pool's contents are **free**: the player pays for the pool and the control that
 * steers it, and the powers built out of it cost nothing further. That is why the engine has no
 * VPP-slot decorator to divide anything, where a Multipower has one.
 *
 * `spendOf` walked into it anyway and charged every slot at full price. **This shipped in 2.8.0** —
 * a VPP with two powers in it read 165 where it costs 75.
 */
describe('a Variable Power Pool costs its pool, whatever is in it', () => {
    const vpp = (slots: AuthoredPower[]): AuthoredCharacter =>
        ({...emptyDraft('6E'), name: 'Probe', frameworks: [{kind: 'vpp', name: 'Cosmic', reserve: 50, modifiers: [], slots}]}) as AuthoredCharacter;

    const blast = (levels: number): AuthoredPower => ({xmlid: 'ENERGYBLAST', name: `Bolt${levels}`, input: 'ED', adders: [], levels, modifiers: []});

    it('does not grow as powers are put in it', () => {
        // 50-point pool + 25 control = 75, and it stays 75. It read 125 and then 165.
        expect(spendOf(build(vpp([])) as unknown as Obj).spent).toBe(75);
        expect(spendOf(build(vpp([blast(10)])) as unknown as Obj).spent).toBe(75);
        expect(spendOf(build(vpp([blast(10), blast(8)])) as unknown as Obj).spent).toBe(75);
    });

    it('still charges a Multipower for its slots, which is the opposite case', () => {
        const multipower = {
            ...emptyDraft('6E'),
            name: 'Probe',
            frameworks: [{kind: 'multipower' as const, name: 'MP', reserve: 50, modifiers: [], slots: [blast(10)]}],
        } as AuthoredCharacter;

        // A Multipower's container costs its reserve and each slot a fraction on top: 50 + 5.
        // The two look identical to a tree walk, which is the whole reason this needed a predicate.
        expect(spendOf(build(multipower) as unknown as Obj).spent).toBe(55);
    });
});

describe('the declared fields survive the round trip and the validator', () => {
    it("stores and re-reads a sub-power's number too", () => {
        const draft = {
            ...emptyDraft('6E'),
            name: 'Powered',
            powers: [{xmlid: 'ENDURANCERESERVE', name: 'Battery', input: '', adders: [], levels: 100, modifiers: [], fields: {rec: 5}}],
        } as AuthoredCharacter;

        expect(parseSource(JSON.parse(JSON.stringify(toSource(draft))))).toEqual(draft);
    });

    it('stores and re-reads them, fractions included', () => {
        // `toSource` is a whitelist, not a spread. A field nobody lists is dropped on save, and the
        // character comes back a different price than the player left it.
        const draft = {
            ...emptyDraft('6E'),
            name: 'Walled',
            powers: [barrier({lengthlevels: 15, heightlevels: 7, bodylevels: 12, widthlevels: 1.5}, {pd: 6, ed: 6, mental: 0, power: 0})],
        } as AuthoredCharacter;
        const reopened = parseSource(JSON.parse(JSON.stringify(toSource(draft))));

        expect(reopened).toEqual(draft);
        expect(authored('6E', reopened!.powers[0])).toBe(58);
    });

    it('rejects a fraction where the field takes whole units', () => {
        const draft = {
            ...emptyDraft('6E'),
            name: 'Walled',
            powers: [barrier({lengthlevels: 1.5, heightlevels: 0, bodylevels: 0, widthlevels: 0}, {pd: 2, ed: 2, mental: 0, power: 0})],
        } as AuthoredCharacter;

        expect(validate(draft).filter((problem) => problem.severity === 'error').map((problem) => problem.message)).toEqual([
            expect.stringContaining('"Length" must be a whole number'),
        ]);
    });

    it('prices an unanswered field as zero rather than NaN', () => {
        // The failure this whole change exists to prevent. `emit` writes every declared field even
        // when the draft has none, because `Barrier.cost()` adds all eight unguarded.
        const bare = authored('6E', {xmlid: 'FORCEWALL', name: 'Bare', input: '', adders: [], levels: 0, modifiers: [], defense: {pd: 2, ed: 2, mental: 0, power: 0}});

        expect(Number.isNaN(bare)).toBe(false);
        expect(bare).toBe(9); // 3 base + (4/2)x3, and nothing for a wall of no size
    });
});
