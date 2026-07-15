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
 * Phase 3 of docs/RANDOM_CHARACTER.md — the first structured powerset, end to end.
 *
 * The check that matters: the powerset's real cost, as priced by the engine, equals the balance
 * the allocator computes (`total − characteristics − skills`). Nothing here states a cost;
 * every number below is derived from the template data through the decorator stack.
 */
import {heroDesignerCharacter} from 'core/hero';
import {characterTraitDecorator} from 'core/traits';
import {allocate, ARCHETYPES_5E, SKILLSETS} from '../allocate';
import {buildCharacteristics} from '../characteristics';
import {approximations, attachPowerset, powersetsFor} from '../powerset';
import {LOW_POWERED_5E} from '../powerLevel';

type Obj = Record<string, any>;

const archetype = ARCHETYPES_5E.find((candidate) => candidate.name === 'Energy Projector')!;
const scientist = SKILLSETS.find((skillset) => skillset.profession === 'Scientist')!;

const build = (index: number): Obj => {
    const parsed = attachPowerset(buildCharacteristics(archetype.characteristics, LOW_POWERED_5E.template, 'Energy Projector'), powersetsFor('Energy Projector')[index]);

    return heroDesignerCharacter.getCharacter(parsed) as unknown as Obj;
};

/** Costed through `core/traits` rather than the app's sheet — `core` must not reach into `app`. */
const powerRows = (character: Obj): Array<{label: string; realCost: number; active: number}> =>
    (character.powers as Obj[]).map((power) => {
        const decorated = characterTraitDecorator.decorate(power, 'powers', () => character);

        return {label: String(power.name), realCost: decorated.realCost(), active: decorated.activeCost()};
    });

/** Archetypes with structured powersets so far. The rest are still legacy prose. */
const AUTHORED = ['Energy Projector', 'Gadgeteer', 'Mentalist', 'Metamorph', 'Mystic', 'Patriot', 'Powered Armor', 'Speedster', 'Weapons Master', 'Brick'];

/**
 * The check that makes authoring safe: whatever a powerset is, the engine's price for it must
 * equal the balance the allocator leaves. Every powerset, automatically — so adding data is all
 * that a new archetype costs, and a mis-shaped power fails here rather than shipping quietly.
 */
describe('every authored powerset costs exactly its balance', () => {
    const cases = ARCHETYPES_5E.flatMap((candidate) =>
        powersetsFor(candidate.name).map((powerset, index) => [candidate.name, index, powerset.label] as [string, number, string]),
    );

    it.each(cases)('%s [%i] %s', (name, index) => {
        const candidate = ARCHETYPES_5E.find((a) => a.name === name)!;
        const budget = allocate(LOW_POWERED_5E, candidate, scientist);
        const parsed = attachPowerset(buildCharacteristics(candidate.characteristics, LOW_POWERED_5E.template, name), powersetsFor(name)[index]);
        const character = heroDesignerCharacter.getCharacter(parsed) as unknown as Obj;
        const spent = powerRows(character).reduce((total, row) => total + row.realCost, 0);

        expect({archetype: name, spent}).toEqual({archetype: name, spent: budget.powers});
    });
});

describe('Energy Projector powerset — 5E Low Powered', () => {
    it('costs exactly the balance the allocator leaves for powers', () => {
        // 250 total − 100 characteristics − 25 skills = 125.
        const budget = allocate(LOW_POWERED_5E, archetype, scientist);
        const spent = powerRows(build(0)).reduce((total, row) => total + row.realCost, 0);

        expect(budget.powers).toBe(125);
        expect(spent).toBe(budget.powers);
    });

    it('prices each power the way the legacy prose described it', () => {
        const byName = new Map(powerRows(build(0)).map((row) => [row.label, row]));
        const cost = (name: string) => ({real: byName.get(name)!.realCost, active: byName.get(name)!.active});

        // Legacy: "Armor +5 rPD +5 rED", 15.
        expect(cost('Energy Aura')).toEqual({real: 15, active: 15});

        // Legacy: "Multipower", 50 — and three "5u" slots. The 5 is DERIVED (active / 10),
        // never written down: "EB 10d6", "Entangle 5d6 DEF 5", "Force Wall 10 rPD 10 rED".
        expect(cost('Energy Powers')).toEqual({real: 50, active: 50});
        expect(cost('Blast')).toEqual({real: 5, active: 50});
        expect(cost('Bind')).toEqual({real: 5, active: 50});
        expect(cost('Barrier')).toEqual({real: 5, active: 50});

        // Legacy: "EC [Energy]", 15, with two 15-point slots. The elemental-control discount is
        // also derived: 30 active − the 15-point reserve = 15 real, for both.
        expect(cost('Energy')).toEqual({real: 15, active: 15});
        expect(cost('Soar')).toEqual({real: 15, active: 30}); // Flight 10" (20) + x8 NCM (10)
        expect(cost('Shield')).toEqual({real: 15, active: 30}); // FF 20 × No END (+1/2)
    });

    it('builds a character the rest of the app can render', () => {
        const character = build(0);
        const rows = powerRows(character);

        expect(rows).toHaveLength(8);
        expect(rows.every((row) => Number.isFinite(row.realCost))).toBe(true);
        expect(heroDesignerCharacter.isFifth(character)).toBe(true);

        // The frameworks resolve as frameworks, not as loose powers.
        const flight = character.powers.find((power: Obj) => power.name === 'Soar');
        const blast = character.powers.find((power: Obj) => power.name === 'Blast');

        expect(heroDesignerCharacter.isPowerFrameworkItem(blast, character, 'multipower')).toBe(true);
        expect(heroDesignerCharacter.isPowerFrameworkItem(flight, character, 'elementalControl')).toBe(true);
    });

    it('tracks which archetypes are authored', () => {
        // Fails when one lands, which is the point — it forces the count below to stay honest.
        expect(ARCHETYPES_5E.filter((a) => powersetsFor(a.name).length > 0).map((a) => a.name)).toEqual(AUTHORED);
    });

    describe('a generated character has no alternate identity', () => {
        // So every power is affectsPrimary + affectsTotal: they always apply. Imported characters
        // often carry affectsPrimary: false on defences, but that marks them alternate-form only
        // — a decision a player made about their character, not a default to copy.
        it('marks every power as always-on', () => {
            expect((build(0).powers as Obj[]).every((power) => power.affectsPrimary && power.affectsTotal)).toBe(true);
        });

        it('totals the same in both forms, so there is nothing to toggle', () => {
            const character = build(0);
            const totals = (showSecondary: boolean) => {
                character.showSecondary = showSecondary;

                return ['PD', 'ED', 'STR', 'SPD'].map((shortName) => heroDesignerCharacter.getCharacteristicTotal(shortName, character));
            };

            expect(totals(false)).toEqual(totals(true));
        });

        it('carries no Only-In-Alternate-Identity trait', () => {
            // The OIHID limitation is what earns a character the sheet's Alternate Identity
            // toggle; a generated one has no second identity, so it must have none.
            expect(JSON.stringify(build(0).powers)).not.toContain('OIHID');
        });
    });

    it('declares every knowingly-loose corner of the build', () => {
        // Faithfulness to the legacy prose beats invented precision, so approximations are
        // allowed — but they must be declared, never smuggled in. Pinning the list means a new
        // one fails here until someone writes down what they fudged and why.
        expect(approximations()).toEqual([
            {
                archetype: 'Powered Armor',
                powerset: 'Battlesuit',
                power: 'Battlesuit Plating',
                note: expect.stringContaining('Flexed to 14/14'),
            },
            {
                archetype: 'Brick',
                powerset: 'Powerhouse',
                power: 'Leap',
                note: expect.stringContaining('35 is the standalone price'),
            },
            {
                archetype: 'Speedster',
                powerset: 'Blur',
                power: 'Phase',
                note: expect.stringContaining("Desolidification's basecost is 40"),
            },
            {
                archetype: 'Gadgeteer',
                powerset: 'Inventor',
                power: 'Gadget Pool',
                note: expect.stringContaining('Flexed to 57'),
            },
            {
                archetype: 'Patriot',
                powerset: 'Sentinel',
                power: 'Shield Work',
                note: expect.stringContaining('nothing in the template represents'),
            },
            {
                archetype: 'Weapons Master',
                powerset: 'Armoury',
                power: 'Arrow',
                note: expect.stringContaining('sixteen charges'),
            },
        ]);
    });

    it('leaves the Barrier at its base 2m x 2m — a real wall, deliberately', () => {
        const barrier = powersetsFor('Energy Projector')[0].powers.power.find((power: Obj) => power.name === 'Barrier');

        // These levels buy extent ABOVE the base 2m x 2m, so 0 is the base-size wall — not a
        // wall with no extent. Its 50 active points are pure defence (10 rPD + 10 rED), which is
        // what the prose priced at 5u. Adding any would move the slot's cost off the balance.
        expect(barrier).toMatchObject({lengthlevels: 0, heightlevels: 0, bodylevels: 0, widthlevels: 0});
        expect(barrier).toMatchObject({pdlevels: 10, edlevels: 10});
    });
});
