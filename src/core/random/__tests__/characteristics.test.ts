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
import {buildCharacteristics, characteristicsCost, SUPERHEROIC_5E, type CharacteristicSpread} from '../characteristics';

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
