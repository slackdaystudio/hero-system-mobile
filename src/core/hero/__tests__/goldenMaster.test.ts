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
 * Golden master for the character model: the ported `core/hero.getCharacter`
 * must reproduce the legacy `HeroDesignerCharacter.getCharacter` byte-for-byte
 * over every real character in the corpus. The legacy engine is loaded in pure
 * node with its non-pure dependencies stubbed (see notes on the virtual mocks).
 * `getCharacter` mutates its input, so each side gets a fresh clone.
 */
import manifest from './fixtures/manifest.json';
import {heroDesignerCharacter as core, TRAIT_CHILD_KEYS} from 'core/hero';

// react-native + the toast module are stubbed project-wide via moduleNameMapper
// (see jest.config.js). The App/Statistics reach-ins that Common→DieRoller drags
// in are stubbed here so the legacy engine loads with no native dependencies.
jest.mock('../../../../../hero-system-mobile/App', () => ({getRandomNumber: () => 1}));
jest.mock('../../../../../hero-system-mobile/src/lib/Statistics', () => ({statistics: {add: () => Promise.resolve()}}));

const legacy = require('../../../../../hero-system-mobile/src/lib/HeroDesignerCharacter') as {
    heroDesignerCharacter: {getCharacter(parsed: unknown): unknown};
};

const fixtures = manifest.map((entry) => entry.fixture).sort();
const clone = (name: string): unknown => JSON.parse(JSON.stringify(require(`./fixtures/${name}.json`)));

type Obj = Record<string, any>;

/**
 * H2 (docs/KNOWN_DEVIATIONS.md) — the one intentional divergence in this file, and it is a
 * divergence of **arrangement only**.
 *
 * Legacy's boolean sort comparator could never move a trait earlier, so a framework container —
 * which `normalizeCharacterItems` always appends last — was processed after its own slots, and
 * every slot ended up beside its container instead of inside it. Sorting numerically puts the
 * container back in front, and the slots nest.
 *
 * So for 27 of the 37 fixtures the two engines now build the same traits in a different *shape*.
 * Rather than skip those characters wholesale — which would drop two thirds of the corpus out of
 * the golden master — both sides are flattened to the same canonical arrangement and then compared
 * in full. Every field of every trait, every attached template, every cost input is still pinned
 * against legacy. The only thing this normalization forgives is which array a trait sits in and
 * what order it appears in, which is exactly what H2 changes and nothing else.
 *
 * Costs are unaffected by the reshaping and are *not* forgiven anywhere: `getParent` resolves a
 * container by scanning `character[listKey]` for the id, and the container is present either way.
 * `traitSort.test.ts` pins that directly, and the decorator/query golden masters — which compare
 * every cost in the corpus — were never re-based for H2 because nothing in them moved.
 */
const canonical = (character: Obj): Obj => {
    const normalized: Obj = {...character};

    for (const [key, childKeys] of Object.entries(TRAIT_CHILD_KEYS)) {
        if (!Array.isArray(character[key])) {
            continue;
        }

        const flat: Obj[] = [];
        const hoist = (traits: Obj[]): void => {
            for (const trait of traits) {
                const copy: Obj = {...trait};

                for (const childKey of childKeys) {
                    if (Array.isArray(trait[childKey])) {
                        hoist(trait[childKey] as Obj[]);
                        copy[childKey] = []; // emptied on both sides, so a nested and a loose slot read alike
                    }
                }

                flat.push(copy);
            }
        };

        hoist(character[key] as Obj[]);

        // Sorted by id, so "which array it was in" and "what order it came out in" both stop
        // mattering. Ids are unique per character — HERO Designer stamps one on every element.
        normalized[key] = flat.sort((a, b) => String(a.id).localeCompare(String(b.id)));
    }

    return normalized;
};

describe('golden master: core/hero getCharacter reproduces legacy', () => {
    it('covers the whole corpus', () => {
        expect(fixtures.length).toBe(37);
    });

    it.each(fixtures)('%s matches legacy', (name) => {
        const legacyCharacter = legacy.heroDesignerCharacter.getCharacter(clone(name)) as Obj;
        const coreCharacter = core.getCharacter(clone(name) as never) as unknown as Obj;

        expect(canonical(coreCharacter)).toEqual(canonical(legacyCharacter));
    });
});
