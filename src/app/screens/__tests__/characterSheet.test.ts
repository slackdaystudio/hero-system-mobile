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

import {heroDesignerCharacter, type ParsedCharacter} from 'core/hero';
import type {CharacterDocument} from 'core/ports';
import sample from '../../composition/sampleCharacter.json';
import {asHeroCharacter, buildCharacterSheet} from '../characterSheet';

const processed = (): CharacterDocument => heroDesignerCharacter.getCharacter(sample as unknown as ParsedCharacter) as unknown as CharacterDocument;

describe('characterSheet', () => {
    it('recognises a processed character and rejects a thin document', () => {
        expect(asHeroCharacter(processed())).not.toBeNull();
        expect(asHeroCharacter({characteristics: [{definition: '(6E)'}]} as unknown as CharacterDocument)).toBeNull();
        expect(asHeroCharacter({powers: [{name: 'X'}]} as unknown as CharacterDocument)).toBeNull();
    });

    it('builds characteristics with numeric totals and skill-style rolls', () => {
        const hero = asHeroCharacter(processed());
        const sheet = buildCharacterSheet(hero!);

        expect(sheet.characteristics.length).toBeGreaterThan(0);
        expect(sheet.characteristics.every((c) => Number.isFinite(c.total))).toBe(true);
        // At least one characteristic (STR/DEX/...) yields a roll like "13-".
        expect(sheet.characteristics.some((c) => typeof c.roll === 'string' && c.roll.endsWith('-'))).toBe(true);
        expect(sheet.characteristics.some((c) => /strength/i.test(c.name))).toBe(true);
    });

    it('builds decorated trait sections with labels and costs', () => {
        const sheet = buildCharacterSheet(asHeroCharacter(processed())!);

        expect(sheet.sections.length).toBeGreaterThan(0);
        const allTraits = sheet.sections.flatMap((section) => section.traits);
        expect(allTraits.length).toBeGreaterThan(0);
        expect(allTraits.every((t) => typeof t.label === 'string' && t.label.length > 0)).toBe(true);
        expect(allTraits.every((t) => Number.isFinite(t.realCost))).toBe(true);
    });
});
