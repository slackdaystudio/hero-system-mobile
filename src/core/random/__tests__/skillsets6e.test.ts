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
 * The 6E skillsets — the profession half of a 400-point build.
 *
 * 50 points, not the 5E sets' 25: that is a 250-point hero's skill list. The number comes from the
 * corpus, where the five real 400-point characters spend 30–69 (median 59).
 *
 * The guards here exist because a skill this edition doesn't have **prices at zero, silently**.
 * That trap has now caught Lack Of Weakness in the Brick's powerset and Seduction here, and neither
 * threw: the budget only notices if the total drifts, and nothing else looks.
 */
import {heroDesignerCharacter} from 'core/hero';
import {getTemplate} from 'core/templates';
import {characterTraitDecorator, type Obj} from 'core/traits';
import {ARCHETYPES_6E} from '../allocate';
import {ruleOfXStats} from '../ruleOfXStats';
import {SKILLSETS_5E} from '../skillset';
import {buildCharacteristics} from '../characteristics';
import {STANDARD_6E} from '../powerLevel';
import {attachSkillset, type StructuredSkillset} from '../skillset';
import skillsetData from '../../data/random/skillPackages.6e.json';

const SKILLSETS_6E = (skillsetData as unknown as {skillsets: StructuredSkillset[]}).skillsets;

const BUDGET = 50;

const BUCKETS = ['skills', 'perks', 'talents'] as const;

const cases = SKILLSETS_6E.map((set) => [set.profession, set] as const);

/** Priced against a middling spread — a skill's cost doesn't depend on the archetype carrying it. */
const build = (set: StructuredSkillset): Obj => {
    const archetype = ARCHETYPES_6E.find((candidate) => candidate.name === 'Patriot')!;

    return heroDesignerCharacter.getCharacter(attachSkillset(buildCharacteristics(archetype.characteristics, STANDARD_6E.template, 'T'), set)) as unknown as Obj;
};

const spent = (character: Obj): number =>
    BUCKETS.reduce(
        (total, key) =>
            total +
            ((character[key] ?? []) as Obj[]).reduce((sum, trait) => {
                try {
                    return sum + characterTraitDecorator.decorate(trait, key, () => character).realCost();
                } catch {
                    return sum;
                }
            }, 0),
        0,
    );

describe('6E skillsets', () => {
    it.each(cases)('%s costs exactly 50', (_profession, set) => {
        expect(spent(build(set))).toBe(BUDGET);
    });

    /**
     * 6E's generic skill list is not 5E's, and the differences are silent. **Seduction is gone** —
     * folded into Charm — and **Area Knowledge is gone** as a generic skill; an area is a Knowledge
     * Skill now. Both sat in the first draft of the Actor/Actress costing nothing at all.
     */
    it.each(cases)('%s uses only skills this edition actually has', (_profession, set) => {
        const character = build(set);
        const template = getTemplate(STANDARD_6E.template) as unknown as {skills?: Record<string, unknown>};
        const skills = template.skills ?? {};

        // Generic skills live in `skills.skill`; the specialised ones (Language, KS, PS…) each have
        // their own sub-key, and the sub-key IS the xmlid's home.
        const generic = new Set(((skills.skill ?? []) as Obj[]).map((entry) => String(entry.xmlid).toUpperCase()));
        const special = new Set(Object.keys(skills).map((key) => key.toUpperCase()));
        const known = (id: string): boolean => generic.has(id) || special.has(id) || special.has(id.replace(/_/g, ''));

        const unknown = ((character.skills ?? []) as Obj[]).map((skill) => String(skill.xmlid).toUpperCase()).filter((id) => !known(id));

        expect(unknown).toEqual([]);
    });

    it.each(cases)('%s buys nothing for free', (_profession, set) => {
        const character = build(set);
        const free = BUCKETS.flatMap((key) =>
            ((character[key] ?? []) as Obj[])
                .filter((trait) => {
                    try {
                        return characterTraitDecorator.decorate(trait, key, () => character).realCost() === 0;
                    } catch {
                        return true;
                    }
                })
                .map((trait) => `${key}:${trait.xmlid}`),
        );

        expect(free).toEqual([]);
    });

    /**
     * Phil's rule: no CSLs at character creation. "A CSL is a thing you must remember to apply; an
     * OCV is just your OCV." The 5E Investigator, Soldier and Warrior each carry one; none of these
     * may. Where a profession wants to fight, it buys the skill, not the level.
     */
    it.each(cases)('%s gives nobody a combat skill level', (_profession, set) => {
        const levels = ((build(set).skills ?? []) as Obj[]).filter((skill) => /COMBAT_LEVELS|MENTAL_COMBAT_LEVELS/i.test(String(skill.xmlid)));

        expect(levels).toEqual([]);
    });

    it('gives every skill a roll — a missing `characteristic` silently blanks it', () => {
        for (const [profession, set] of cases) {
            const character = build(set);
            const blank = ((character.skills ?? []) as Obj[])
                .filter((skill) => {
                    // Levels, languages and knowledge-style skills legitimately have no roll.
                    if (/LEVELS|LANGUAGES|_SKILL$/i.test(String(skill.xmlid))) {
                        return false;
                    }
                    try {
                        return characterTraitDecorator.decorate(skill, 'skills', () => character).roll() === null;
                    } catch {
                        return true;
                    }
                })
                .map((skill) => String(skill.alias ?? skill.xmlid));

            expect({profession, blank}).toEqual({profession, blank: []});
        }
    });

    it('names all eleven professions, matching 5E', () => {
        // The professions are the same in both editions — only the budget and the content differ.
        expect(SKILLSETS_6E.map((set) => set.profession).sort()).toEqual(SKILLSETS_5E.map((set) => set.profession).sort());
    });

    /**
     * Lightning Reflexes lives on the Warrior, and only there.
     *
     * It's a PROFESSION, so any archetype can be one — a Martial Artist gets First Strike by being a
     * Warrior, not by being a Martial Artist. It also matters to the Rule of X, which folds it into
     * DEX ("include Lightning Reflexes").
     *
     * Its xmlid is `LIGHTNING_REFLEXES_ALL` even for a single-action buy: 5E had a separate
     * `_SINGLE` xmlid and 6E folded that into an *option*. The 5E spelling resolves to nothing here,
     * and the decorator reads `trait.option`, so without it the talent throws rather than prices.
     */
    it('gives the Warrior its Lightning Reflexes, priced and counted', () => {
        const warrior = SKILLSETS_6E.find((set) => set.profession === 'Warrior')!;
        const character = build(warrior);
        const talent = ((character.talents ?? []) as Obj[]).find((entry) => String(entry.xmlid).startsWith('LIGHTNING_REFLEXES'))!;

        expect(talent).toBeDefined();
        expect(talent.option).toBe('ALL');
        expect(characterTraitDecorator.decorate(talent, 'talents', () => character).realCost()).toBeGreaterThan(0);

        // ...and the Rule of X sees it, which it did not when matching on a bare LIGHTNING_REFLEXES.
        expect(ruleOfXStats(character).dex).toBeGreaterThan(heroDesignerCharacter.getCharacteristicTotal('DEX', character));
    });

    it('states no cost anywhere in the data — every price is the engine’s', () => {
        expect(JSON.stringify(SKILLSETS_6E)).not.toContain('"cost"');
    });
});
