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
import {build, emit, emptyDraft, parseSource, toSource, trait as catalogueTrait, validate, type AuthoredCharacter, type AuthoredPower} from '../index';
import {heroDesignerCharacter} from 'core/hero';
import {characterTraitDecorator, type Obj} from 'core/traits';
import {flatten} from 'core/util';

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
