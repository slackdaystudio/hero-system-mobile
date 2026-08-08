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
 * Power frameworks (Phase D of docs/CHARACTER_AUTHORING.md).
 *
 * The three kinds exist because they price slots differently, so that is what these pin. Each
 * number's arithmetic is in the comment and comes from the HERO rules, not from legacy.
 *
 * This is also the first thing in the app that depends on H2 being fixed. Before it, a container
 * was processed *after* its own slots and never adopted them — every framework came out empty with
 * its slots loose beside it. The nesting assertions below are the regression test for that.
 */
import {build, emptyDraft, parseSource, spendOf, toSource, validate, type AuthoredCharacter, type AuthoredPower} from 'core/authoring';
import {heroDesignerCharacter} from 'core/hero';
import {characterTraitDecorator} from 'core/traits';

type Obj = Record<string, any>;

const draft = (over: Partial<AuthoredCharacter> = {}): AuthoredCharacter => ({...emptyDraft('6E'), name: 'Probe', ...over});
const blast = (over: Partial<AuthoredPower> = {}): AuthoredPower => ({xmlid: 'ENERGYBLAST', name: 'Bolt', input: 'ED', adders: [], levels: 10, modifiers: [], ...over});
const errors = (subject: AuthoredCharacter): string[] =>
    validate(subject)
        .filter((problem) => problem.severity === 'error')
        .map((problem) => problem.message);

const container = (character: Obj): Obj => (character.powers as Obj[]).find((power) => power.type === 'list')!;
const cost = (trait: Obj, character: Obj): number => characterTraitDecorator.decorate(trait, 'powers', () => character).realCost();
const slotCosts = (character: Obj): number[] => ((container(character).powers ?? []) as Obj[]).map((slot) => cost(slot, character));

describe('a framework adopts its slots', () => {
    const multipower = draft({
        frameworks: [{kind: 'multipower', name: 'Fire Tricks', reserve: 60, modifiers: [], slots: [blast({name: 'Flame Bolt', levels: 12}), blast({name: 'Fire Blast', levels: 10})]}],
    });

    it('nests them, rather than leaving them loose beside it', () => {
        const character = build(multipower);

        // One top-level power: the container. Both slots are inside it. This is precisely what H2
        // made possible — before the fix this read 3 and 0.
        expect((character.powers as Obj[]).length).toBe(1);
        expect((container(character).powers as Obj[]).map((slot) => slot.name)).toEqual(['Flame Bolt', 'Fire Blast']);
        expect((character.powers as Obj[]).filter((power) => power.parentid !== undefined)).toEqual([]);
    });

    it('marks the container as the framework it is', () => {
        const character = build(multipower);

        // The identity is the sub-key it was emitted under, not the xmlid — which is GENERIC_OBJECT
        // for all three kinds.
        expect(container(character).xmlid).toBe('GENERIC_OBJECT');
        expect(container(character).originalType).toBe('multipower');
        expect(heroDesignerCharacter.isPowerFrameworkItem((container(character).powers as Obj[])[0], character, 'multipower')).toBe(true);
    });
});

describe('the three kinds price their slots differently', () => {
    it('a Multipower slot costs a tenth of what the power would cost alone', () => {
        const character = build(
            draft({frameworks: [{kind: 'multipower', name: 'MP', reserve: 60, modifiers: [], slots: [blast({levels: 12}), blast({levels: 10})]}]}),
        );

        // Reserve 60. A 12d6 Blast is 60 alone, so its fixed slot is 6; a 10d6 is 50, so 5.
        expect(cost(container(character), character)).toBe(60);
        expect(slotCosts(character)).toEqual([6, 5]);
    });

    it('an Elemental Control slot costs whatever it exceeds the pool by', () => {
        const character = build(
            draft({frameworks: [{kind: 'elementalControl', name: 'Psychic Powers', reserve: 22, modifiers: [], slots: [blast({levels: 12})]}]}),
        );

        // The pool pays for the first 22 points of every slot: 60 active - 22 = 38.
        expect(cost(container(character), character)).toBe(22);
        expect(slotCosts(character)).toEqual([38]);
    });

    it('a Variable Power Pool costs its pool plus the control that steers it', () => {
        const character = build(draft({frameworks: [{kind: 'vpp', name: 'Cosmic', reserve: 50, modifiers: [], slots: []}]}));

        // 50 points of pool, plus a control cost of half that: 75. The size lives in `levels` for a
        // VPP where the other two kinds put it in `basecost`, and the decorator reads accordingly.
        expect(cost(container(character), character)).toBe(75);
    });

    it('counts the container and every slot toward the total', () => {
        const spend = spendOf(build(draft({frameworks: [{kind: 'multipower', name: 'MP', reserve: 60, modifiers: [], slots: [blast({levels: 12}), blast({levels: 10})]}]})));

        // 60 + 6 + 5. A sum that walked only the top level would say 60 — which is what
        // `withDescendants` exists to prevent.
        expect(spend.traits).toBe(71);
    });
});

describe('modifiers on a framework and on its slots', () => {
    it('applies a limitation on the pool to the pool', () => {
        const character = build(
            draft({
                frameworks: [{kind: 'multipower', name: 'Gadgets', reserve: 60, modifiers: [{xmlid: 'FOCUS', option: 'OAF', adders: []}], slots: [blast({levels: 12})]}],
            }),
        );

        // 60 / (1 + 1) = 30 for the reserve.
        expect(cost(container(character), character)).toBe(30);
    });

    it("applies a slot's own modifiers before the framework divides", () => {
        const character = build(
            draft({
                frameworks: [
                    {kind: 'multipower', name: 'MP', reserve: 60, modifiers: [], slots: [blast({levels: 10, modifiers: [{xmlid: 'AOE', option: 'RADIUS', levels: 8, adders: []}]})]},
                ],
            }),
        );

        // The Blast is 50, the Area Of Effect makes it 75 active, and the fixed slot is a tenth of
        // that: 7.5, which HERO rounds *in the player's favour* — a fraction in .50–.59 truncates
        // down, so 7 rather than 8. The advantage is not free just because the power sits in a pool.
        expect(slotCosts(character)).toEqual([7]);
    });
});

describe('validate — frameworks', () => {
    it('rejects a framework with no reserve, whose slots would cost nothing to speak of', () => {
        expect(errors(draft({frameworks: [{kind: 'multipower', name: 'Empty', reserve: 0, modifiers: [], slots: [blast()]}]}))).toEqual([
            expect.stringContaining('reserve of at least 1'),
        ]);
    });

    it('warns about a framework with nothing in it', () => {
        const lonely = draft({frameworks: [{kind: 'multipower', name: 'Empty', reserve: 60, modifiers: [], slots: []}]});

        expect(errors(lonely)).toEqual([]);
        expect(validate(lonely).some((problem) => problem.severity === 'warning' && problem.message.includes('no powers in it'))).toBe(true);
    });

    it('validates the slots too, and points at the framework they are in', () => {
        const broken = draft({frameworks: [{kind: 'multipower', name: 'MP', reserve: 60, modifiers: [], slots: [blast({modifiers: [{xmlid: 'NOT_A_MODIFIER', adders: []}]})]}]});
        const problem = validate(broken).find((entry) => entry.severity === 'error')!;

        expect(problem.message).toContain('has no modifier');
        expect(problem.path).toBe('frameworks[0]');
    });
});

describe('frameworks survive storage', () => {
    const complete = draft({
        powers: [blast({name: 'Standalone'})],
        frameworks: [
            {kind: 'multipower', name: 'Fire Tricks', reserve: 60, modifiers: [{xmlid: 'FOCUS', option: 'OAF', adders: []}], slots: [blast({name: 'Flame Bolt', levels: 12})]},
            {kind: 'vpp', name: 'Cosmic', reserve: 50, modifiers: [], slots: []},
        ],
    });

    it('round-trips, and rebuilds the identical character', () => {
        const reopened = parseSource(JSON.parse(JSON.stringify(toSource(complete))))!;

        expect(reopened).toEqual(complete);
        expect(build(reopened)).toEqual(build(complete));
    });

    it('orders frameworks after the standalone powers, not among them', () => {
        const character = build(
            draft({
                powers: [blast({name: 'Loose A'}), blast({name: 'Loose B'})],
                frameworks: [{kind: 'multipower', name: 'MP', reserve: 30, modifiers: [], slots: [blast({name: 'Slot'})]}],
            }),
        );

        // Position is the sheet's display order. Frameworks start well above the standalone
        // powers so a Multipower cannot land between two loose powers — and so its slots'
        // positions cannot collide with theirs.
        expect((character.powers as Obj[]).map((power) => power.name)).toEqual(['Loose A', 'Loose B', 'MP']);
    });

    it('keeps standalone powers apart from the frameworks', () => {
        const character = build(complete);
        const top = character.powers as Obj[];

        expect(top.filter((power) => power.type === 'list').length).toBe(2);
        expect(top.filter((power) => power.type !== 'list').map((power) => power.name)).toEqual(['Standalone']);
    });

    it('reads a Phase C source, which had no frameworks key, as empty', () => {
        const phaseC = {edition: '6E', name: 'Old', player: '', characteristics: {}, skills: [], perks: [], talents: [], powers: [], complications: []};

        expect(parseSource(phaseC)).toEqual({...emptyDraft('6E'), name: 'Old'});
    });
});
