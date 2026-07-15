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
 * Phase 1 of docs/RANDOM_CHARACTER.md — the characteristics slice.
 *
 * The legacy archetype spreads state a `characteristicsCost` (100 / 125 / 150) that was
 * **hand-computed** and has never met a rules engine. This asserts the engine agrees, for all
 * 11 archetypes, which is what tells us the 250-point data is safe to build on.
 */
import {heroDesignerCharacter} from 'core/hero';
import archetypeData from '../../data/random/archetypes.5e.json';
import {ARCHETYPES_5E, ARCHETYPES_6E} from '../allocate';
import {buildCharacteristics, characteristicsCost, SUPERHEROIC_5E, SUPERHEROIC_6E, type CharacteristicSpread} from '../characteristics';

type Obj = Record<string, any>;

interface Archetype {
    name: string;
    characteristics: CharacteristicSpread;
}

const archetypes = (archetypeData as unknown as {archtypes: Archetype[]}).archtypes;
const build = (archetype: Archetype): Obj =>
    heroDesignerCharacter.getCharacter(buildCharacteristics(archetype.characteristics, SUPERHEROIC_5E, archetype.name)) as unknown as Obj;

describe('random character — characteristics (5E)', () => {
    it('lifted all 11 legacy archetypes', () => {
        expect(archetypes).toHaveLength(11);
        expect(archetypes.map((a) => a.name)).toContain('Energy Projector');
        expect(archetypes.map((a) => a.name)).toContain('Brick');
    });

    it.each(archetypes.map((a) => [a.name, a] as const))('%s hits every characteristic in its spread', (_name, archetype) => {
        const character = build(archetype);

        for (const [key, target] of Object.entries(archetype.characteristics)) {
            expect({[key]: heroDesignerCharacter.getCharacteristicTotal(key.toUpperCase(), character)}).toEqual({[key]: target});
        }
    });

    /**
     * What each archetype's spread actually buys, per the engine. The legacy data carried a
     * hand-summed `characteristicsCost` label alongside the spread; two of the eleven were
     * wrong, so the label was dropped — the spread *is* the character, and its cost is derived,
     * not declared. This table is the pin: it documents each archetype's characteristics budget
     * (which the allocator will spend against) and fails loudly if a spread is edited.
     *
     * Not flat by design — the "attribute line" moves per archetype, as it did in the original.
     * Gadgeteer's 93 is the post-fix value: its INT and EGO were transposed in the legacy data
     * (int 13 / ego 18 on a *gadgeteer*), and un-swapping them costs 5 more INT but 10 less EGO.
     */
    const CHARACTERISTICS_BUDGET: Record<string, number> = {
        'Energy Projector': 100,
        Gadgeteer: 93,
        'Martial Artist': 100,
        Mentalist: 100,
        Metamorph: 100,
        Mystic: 100,
        Patriot: 125,
        'Powered Armor': 103,
        Speedster: 125,
        'Weapons Master': 100,
        Brick: 150,
    };

    it.each(archetypes.map((a) => [a.name, a] as const))('%s spends what its spread buys', (name, archetype) => {
        expect(characteristicsCost(build(archetype))).toBe(CHARACTERISTICS_BUDGET[name]);
    });

    it('carries no declared cost — the spread is the source of truth', () => {
        expect(archetypes.every((archetype) => !Object.prototype.hasOwnProperty.call(archetype, 'characteristicsCost'))).toBe(true);
        expect(Object.keys(CHARACTERISTICS_BUDGET).sort()).toEqual(archetypes.map((a) => a.name).sort());
    });

    it('gives the Gadgeteer the INT its archetype implies', () => {
        // Legacy had int 13 / ego 18 — the mirror of Energy Projector's int 18 / ego 11, and a
        // strange build for a gadgeteer. Un-swapped here; this guards the fix.
        const gadgeteer = archetypes.find((archetype) => archetype.name === 'Gadgeteer')!;

        expect(gadgeteer.characteristics.int).toBe(18);
        expect(gadgeteer.characteristics.ego).toBe(13);
    });

    it('produces a 5E character the rest of the engine accepts', () => {
        const character = build(archetypes[0]);

        expect(heroDesignerCharacter.isFifth(character)).toBe(true);
        expect(character.characteristics.length).toBeGreaterThan(0);
        expect(character.movement.length).toBeGreaterThan(0);
        expect((character.characteristics as Obj[]).every((c) => Number.isFinite(c.value) && Number.isFinite(c.cost))).toBe(true);
    });
});

/**
 * The 6E half of the generator (docs/RANDOM_CHARACTER.md: 400 is 6E, and it's an edition fork).
 *
 * The editions differ in **both** directions, which is why a 5E spread can't simply be reused:
 * COM is gone, OCV/DCV/OMCV/DMCV are bought outright, and nothing is figured.
 */
describe('random character — characteristics (6E)', () => {
    const buildFor = (spread: CharacteristicSpread, template: string): Obj =>
        heroDesignerCharacter.getCharacter(buildCharacteristics(spread, template, 'T')) as unknown as Obj;

    const shortNames = (character: Obj): string[] => (character.characteristics as Obj[]).map((row) => String(row.shortName).toUpperCase());
    const valueOf = (character: Obj, name: string): number =>
        (character.characteristics as Obj[]).find((row) => String(row.shortName).toUpperCase() === name)?.value as number;

    /**
     * The regression. `parsedCharacterFrom` emitted a fixed 5E list, so a 6E template got a COM it
     * has no entry for — and `getCharacteristicFields` reads `templateCharacteristic.definition`
     * with no guard. The 6E path threw on the first character it was ever asked to build; a comment
     * claiming COM "is skipped" had been sitting there untested the whole time.
     */
    it('builds at all — a 5E-shaped characteristic list throws on a 6E template', () => {
        expect(() => buildFor({str: 20}, SUPERHEROIC_6E)).not.toThrow();
        expect(heroDesignerCharacter.isFifth(buildFor({str: 20}, SUPERHEROIC_6E))).toBe(false);
    });

    it('drops COM and sells OCV/DCV/OMCV/DMCV instead', () => {
        const sixth = shortNames(buildFor({str: 20}, SUPERHEROIC_6E));
        const fifth = shortNames(buildFor({str: 20}, SUPERHEROIC_5E));

        expect(sixth).not.toContain('COM'); // deleted in 6E
        expect(sixth).toEqual(expect.arrayContaining(['OCV', 'DCV', 'OMCV', 'DMCV']));

        expect(fifth).toContain('COM'); // ...and 5E must not grow them
        expect(fifth).not.toEqual(expect.arrayContaining(['OCV']));
    });

    it('lands every characteristic on its target, combat values included', () => {
        const spread: CharacteristicSpread = {str: 40, dex: 18, con: 25, body: 14, ocv: 8, dcv: 8, spd: 5, pd: 15, ed: 12, stun: 45};
        const character = buildFor(spread, SUPERHEROIC_6E);

        for (const [key, target] of Object.entries(spread)) {
            expect({key, value: valueOf(character, key.toUpperCase())}).toEqual({key, value: target});
        }
    });

    /**
     * The fact that forces 6E archetypes to be authored rather than ported: in 5E, PD/ED/SPD/REC/
     * END/STUN are *figured* from the primaries and come free. In 6E they start at their base and
     * stay there. A 5E Brick's spread dropped into 6E is a Brick with PD 2 and SPD 2.
     */
    it('figures nothing — defences and speed stay at base unless bought', () => {
        const brickish: CharacteristicSpread = {str: 60, con: 30, dex: 20};
        const figured = (character: Obj) => ({
            pd: valueOf(character, 'PD'),
            spd: valueOf(character, 'SPD'),
            rec: valueOf(character, 'REC'),
            end: valueOf(character, 'END'),
            stun: valueOf(character, 'STUN'),
        });

        // 5E hands all of this to the Brick for free, off STR/CON/DEX.
        expect(figured(buildFor(brickish, SUPERHEROIC_5E))).toEqual({pd: 12, spd: 3, rec: 18, end: 60, stun: 55});

        // The identical spread in 6E: base values, untouched. It has to buy every one of them.
        expect(figured(buildFor(brickish, SUPERHEROIC_6E))).toEqual({pd: 2, spd: 2, rec: 4, end: 20, stun: 20});
    });

    it('prices the same spread differently per edition — it is a ruleset, not a scale', () => {
        // DEX is 3/point in 5E and 2 in 6E; CON 2 and 1. Same numbers, different bill.
        expect(characteristicsCost(buildFor({str: 20, dex: 20, con: 20}, SUPERHEROIC_5E))).toBe(60);
        expect(characteristicsCost(buildFor({str: 20, dex: 20, con: 20}, SUPERHEROIC_6E))).toBe(40);
    });

    it('charges 6E the template price for a combat value', () => {
        // OCV base 3, 5 points per +1 — the engine's number, not one restated here.
        expect(characteristicsCost(buildFor({ocv: 8}, SUPERHEROIC_6E))).toBe(25);
    });
});

/**
 * The 6E archetype spreads, against the tier they're written for.
 *
 * These are authored, so they need a check the lifted 5E ones don't: nothing stops a spread from
 * being written by feel. The corpus's five real 400-point characters are the reality, and Phil's
 * Rule of X weights are what say which numbers are expensive.
 */
describe('random character — 6E archetype spreads', () => {
    /**
     * **SPD is not flavour.** It carries weight 20 in the Rule of X — tied heaviest — so a SPD 4
     * archetype is -4 of X before anything else happens. The Gadgeteer was authored at SPD 4 and
     * scored -10.7% with a powerset already dead on the campaign baseline; the Mentalist and Mystic
     * had the same problem waiting.
     *
     * And the corpus agrees: not one real 400-point 6E character runs below SPD 5 (jack-diamond and
     * jane-fawn are SPD 6). SPD 4 is a 250-point 5E habit — the legacy templates are SPD 4 — and it
     * does not belong at this tier.
     */
    it('gives every archetype the SPD a 400-point hero has', () => {
        const slow = ARCHETYPES_6E.filter((archetype) => archetype.characteristics.spd < 5).map((archetype) => archetype.name);

        expect(slow).toEqual([]);
    });

    it('keeps every archetype in the shape the corpus shows', () => {
        // The five real ones run SPD 5-6, DCV 6-8, CON 18-20. Nothing here should sit outside what
        // a human actually built at 400 points.
        for (const {name, characteristics} of ARCHETYPES_6E) {
            expect({name, ok: characteristics.spd >= 5 && characteristics.spd <= 7}).toEqual({name, ok: true});
            expect({name, ok: characteristics.dcv >= 6 && characteristics.dcv <= 9}).toEqual({name, ok: true});
        }
    });

    it('buys the combat values 6E sells, and no COM', () => {
        for (const {name, characteristics} of ARCHETYPES_6E) {
            expect({name, ocv: typeof characteristics.ocv}).toEqual({name, ocv: 'number'});
            expect({name, com: characteristics.com}).toEqual({name, com: undefined}); // deleted in 6E
        }
    });

    it('names all eleven archetypes, matching 5E', () => {
        expect(ARCHETYPES_6E.map((archetype) => archetype.name).sort()).toEqual(ARCHETYPES_5E.map((archetype) => archetype.name).sort());
    });
});


