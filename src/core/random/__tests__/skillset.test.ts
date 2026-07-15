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

/** Phase 3 of docs/RANDOM_CHARACTER.md — the structured skillsets. */
import {heroDesignerCharacter} from 'core/hero';
import {characterTraitDecorator} from 'core/traits';
import {ARCHETYPES_5E, SKILLSETS} from '../allocate';
import {buildCharacteristics} from '../characteristics';
import {attachSkillset, SKILLSETS_5E, structuredSkillset, type StructuredSkillset} from '../skillset';
import {LOW_POWERED_5E} from '../powerLevel';

type Obj = Record<string, any>;

/** Professions with a structured skillset. The other ten are still legacy name strings. */
const AUTHORED = ['Actor/Actress'];

const build = (skillset: StructuredSkillset): Obj => {
    const archetype = ARCHETYPES_5E.find((candidate) => candidate.name === 'Energy Projector')!;
    const parsed = attachSkillset(buildCharacteristics(archetype.characteristics, LOW_POWERED_5E.template, 'Test'), skillset);

    return heroDesignerCharacter.getCharacter(parsed) as unknown as Obj;
};

const rows = (character: Obj): Array<{xmlid: string; cost: number; roll: string | null}> =>
    (character.skills as Obj[]).map((skill) => {
        const decorated = characterTraitDecorator.decorate(skill, 'skills', () => character);

        return {xmlid: String(skill.xmlid), cost: decorated.cost(), roll: (decorated.roll()?.roll as string) ?? null};
    });

const total = (character: Obj): number => rows(character).reduce((sum, row) => sum + row.cost, 0);

describe('structured skillsets — 5E Low Powered', () => {
    it('tracks which professions are authored', () => {
        expect(SKILLSETS_5E.map((skillset) => skillset.profession)).toEqual(AUTHORED);
        expect(structuredSkillset('Warrior')).toBeUndefined();
    });

    /**
     * The check that matters: the skills bucket is 25, and every powerset is sized against that.
     * A set that misses it leaves the character short by exactly the difference.
     */
    it.each(SKILLSETS_5E.map((skillset) => [skillset.profession, skillset] as const))('%s costs exactly 25', (profession, skillset) => {
        expect(total(build(skillset))).toBe(25);
        expect(SKILLSETS.find((candidate) => candidate.profession === profession)!.cost).toBe(25);
    });

    it('prices the Proficiency lever the way the rules do', () => {
        // Phil's levers: Familiarity 1 (flat 8-), Proficiency 2 (flat 10-), full skill 3. They are
        // what makes an ODD remainder closable — `levels` on a skill moves in 2s.
        const byXmlid = new Map(rows(build(SKILLSETS_5E[0])).map((row) => [row.xmlid, row]));

        // Actor/Actress is 26 as listed (7 skills at 3, plus a SIMILAR group level at 5), so
        // Seduction drops to a Proficiency: 2 points, and the roll goes flat.
        expect(byXmlid.get('SEDUCTION')).toEqual({xmlid: 'SEDUCTION', cost: 2, roll: '10-'});

        // The full skills keep their real rolls, off their own characteristic.
        expect(byXmlid.get('ACTING')).toEqual({xmlid: 'ACTING', cost: 3, roll: '12-'});
        expect(byXmlid.get('NAVIGATION')).toEqual({xmlid: 'NAVIGATION', cost: 3, roll: '13-'});

        // "SL: Interactive Skills +1" is a group level — SIMILAR, 5 — not a level in one skill.
        expect(byXmlid.get('SKILL_LEVELS')?.cost).toBe(5);
    });

    it('gives every skill a roll — a missing `characteristic` silently blanks it', () => {
        // Without `characteristic` the engine returns no roll rather than erroring, so the sheet
        // would show the skill with an empty roll column.
        const rolled = rows(build(SKILLSETS_5E[0])).filter((row) => row.xmlid !== 'SKILL_LEVELS');

        expect(rolled.every((row) => typeof row.roll === 'string' && row.roll.endsWith('-'))).toBe(true);
    });

    it('states no cost anywhere in the data — every price is derived', () => {
        expect(JSON.stringify(SKILLSETS_5E)).not.toContain('"cost"');
    });
});
