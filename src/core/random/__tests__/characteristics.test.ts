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
    characteristicsCost: number;
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
     * Two of the eleven `characteristicsCost` labels are wrong — they were hand-summed and
     * never checked. The **spread is authoritative** (it is the character; the label is only a
     * claim about it), and the engine's arithmetic is right in both cases:
     *
     *   - `Powered Armor` is identical to `Energy Projector` except `stun: 35` vs `32`. STUN's
     *     figured value is 32, so the 3 extra points cost 3 → 103, not the stated 100.
     *   - `Gadgeteer` differs from `Energy Projector` by int 18→13, ego 11→18, rec 10→7,
     *     end 50→40: 100 − 5 + 14 − 6 − 5 = 98, not the stated 100.
     *
     * Pinned at their real costs so a later data fix has to come through here deliberately.
     */
    const STATED_COST_IS_WRONG: Record<string, number> = {
        Gadgeteer: 98,
        'Powered Armor': 103,
    };

    it.each(archetypes.map((a) => [a.name, a] as const))('%s costs what its spread actually buys', (name, archetype) => {
        expect(characteristicsCost(build(archetype))).toBe(STATED_COST_IS_WRONG[name] ?? archetype.characteristicsCost);
    });

    it('has exactly two archetypes whose stated cost is wrong', () => {
        const wrong = archetypes.filter((a) => characteristicsCost(build(a)) !== a.characteristicsCost).map((a) => a.name);

        expect(wrong.sort()).toEqual(['Gadgeteer', 'Powered Armor']);
    });

    it('produces a 5E character the rest of the engine accepts', () => {
        const character = build(archetypes[0]);

        expect(heroDesignerCharacter.isFifth(character)).toBe(true);
        expect(character.characteristics.length).toBeGreaterThan(0);
        expect(character.movement.length).toBeGreaterThan(0);
        expect((character.characteristics as Obj[]).every((c) => Number.isFinite(c.value) && Number.isFinite(c.cost))).toBe(true);
    });
});
