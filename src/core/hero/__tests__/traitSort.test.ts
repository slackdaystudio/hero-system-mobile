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
 * Correctness test for H2 (docs/KNOWN_DEVIATIONS.md) — legacy sorted traits with
 * `(a, b) => a.position > b.position`, a comparator that returns a boolean. V8 coerces it to 0/1
 * and never sees a negative, so no element can move earlier in the array: on anything already out
 * of order the sort does nothing at all.
 *
 * **Legacy is not the oracle here**, and the correct behaviour is not a matter of HERO rules but of
 * the `.hdc` format's own two statements about structure:
 *
 *   - `POSITION` is HERO Designer's document order. A list sorted by it must be ascending.
 *   - `PARENTID` names a trait's container. A slot belongs *inside* its framework.
 *
 * The two are connected, which is why this was never only a display-order bug.
 * `normalizeCharacterItems` moves every non-`power` sub-key — `<MULTIPOWER>`, `<ELEMENTALCONTROL>`,
 * `<LINGUIST>` — onto the end of the category's list, so the container always arrives last no
 * matter what its `POSITION` says. `populateTrait` then attaches each slot by looking its parent up
 * in `character[traitKey]`, which has not been pushed yet; the lookup misses and the slot is
 * appended at the top level. Sorting by position first is what puts the container back in front of
 * its own slots.
 *
 * Costs are deliberately pinned here too. They must **not** move: `getParent` resolves a parent by
 * scanning `character[listKey]` for the id, and the container sits there either way — which is why
 * the Skill Enhancer discount (H12) went on working for years while the nesting was broken.
 */
import {heroDesignerCharacter, type ParsedCharacter} from 'core/hero';
import {characterTraitDecorator} from 'core/traits';

type Obj = Record<string, any>;

const clone = (name: string): ParsedCharacter => JSON.parse(JSON.stringify(require(`./fixtures/${name}.json`))) as ParsedCharacter;
const heroOf = (name: string): Obj => heroDesignerCharacter.getCharacter(clone(name)) as unknown as Obj;

/** Every trait in a category, containers and nested slots alike. */
const walk = (items: Obj[], key: string): Obj[] => items.flatMap((item) => [item, ...(Array.isArray(item[key]) ? walk(item[key] as Obj[], key) : [])]);

describe('H2 — traits sort by position, so frameworks keep their slots', () => {
    describe('the comparator orders ascending', () => {
        it('sorts a shuffled category into position order', () => {
            const character = heroOf('greyman');

            const positions = (character.powers as Obj[]).map((power) => power.position as number);

            expect(positions).toEqual([...positions].sort((a, b) => a - b));
        });

        it('sorts every category of every corpus character', () => {
            for (const name of ['adamantinerebuild210109', 'm-championsmush', 'mikayla-priestess', 'indigo-bunting', 'psi-blade6']) {
                const character = heroOf(name);

                for (const key of ['skills', 'perks', 'talents', 'martialArts', 'powers', 'equipment', 'disadvantages']) {
                    const positions = ((character[key] ?? []) as Obj[]).map((trait) => trait.position as number).filter((p) => typeof p === 'number');

                    expect({[`${name}.${key}`]: positions}).toEqual({[`${name}.${key}`]: [...positions].sort((a, b) => a - b)});
                }
            }
        });
    });

    describe('a framework contains its slots', () => {
        it("greyman's Multipower holds its four slots, and they are not also loose at the top level", () => {
            const powers = heroOf('greyman').powers as Obj[];
            const multipower = powers.find((power) => power.originalType === 'multipower')!;

            expect(multipower).toBeDefined();
            expect((multipower.powers as Obj[]).map((slot) => slot.xmlid)).toEqual(['DISPEL', 'EGOATTACK', 'EGOATTACK', 'TELEPATHY']);

            // Legacy left all four here, beside the container rather than inside it.
            expect(powers.filter((power) => power.parentid !== undefined)).toEqual([]);
        });

        it("greyman's Linguist holds its languages — a Skill Enhancer nests under `skills`, not `powers`", () => {
            const skills = heroOf('greyman').skills as Obj[];
            const linguist = skills.find((skill) => String(skill.xmlid).toUpperCase() === 'LINGUIST')!;

            expect(linguist).toBeDefined();
            expect((linguist.skills as Obj[]).every((skill) => skill.xmlid === 'LANGUAGES')).toBe(true);
            expect((linguist.skills as Obj[]).length).toBe(4);
            expect(skills.filter((skill) => skill.parentid !== undefined)).toEqual([]);
        });

        it('leaves no orphaned slot in any category, in any corpus character', () => {
            const orphans: string[] = [];

            for (const name of ['adamantinerebuild210109', 'aoe', 'champions-9-11-teen-supers-blank', 'gravity-girl', 'greyman', 'indigo-bunting', 'jane-fawn', 'kizza-emberward', 'm-championsmush', 'mikayla-priestess', 'psi-blade6', 'spyder2022']) {
                const character = heroOf(name);

                for (const key of ['skills', 'perks', 'talents', 'martialArts', 'powers', 'equipment', 'disadvantages']) {
                    const loose = ((character[key] ?? []) as Obj[]).filter((trait) => trait.parentid !== undefined);

                    if (loose.length > 0) {
                        orphans.push(`${name}.${key}: ${loose.length}`);
                    }
                }
            }

            expect(orphans).toEqual([]);
        });
    });

    describe('nesting does not move a single cost', () => {
        it("prices greyman's Multipower exactly as before — the pool and every slot", () => {
            const character = heroOf('greyman');
            const multipower = (character.powers as Obj[]).find((power) => power.originalType === 'multipower')!;
            const costOf = (trait: Obj): number => characterTraitDecorator.decorate(trait, 'powers', () => character).realCost();

            // Both values measured against the pre-fix engine and unchanged by it. The pool is its
            // 60-point reserve less Unified Power (−¼): 60 / 1.25 = 48.
            expect(costOf(multipower)).toBe(48);
            expect((multipower.powers as Obj[]).map(costOf)).toEqual([5, 4, 5, 5]);
        });

        it('still gives greyman a free native tongue and a discounted paid one (H12) from inside the enhancer', () => {
            const character = heroOf('greyman');
            const languages = walk(character.skills as Obj[], 'skills').filter((skill) => skill.xmlid === 'LANGUAGES');
            const priced = (label: string): number => {
                const skill = languages.find((s) => [s.name, s.input, s.alias].includes(label))!;

                return characterTraitDecorator.decorate(skill, 'skills', () => character).realCost();
            };

            expect(priced('Mandaarian')).toBe(0); // native, free — stays free under the enhancer
            expect(priced('English')).toBe(2); // base 3, less the enhancer's 1
        });
    });
});
