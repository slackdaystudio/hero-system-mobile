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
 * The gate a received `.hsm` passes before it is saved. Its failure mode that matters is a *false
 * refusal* — turning away a real character — so the positive half runs every fixture in the corpus,
 * and every generated archetype, through exactly what a recipient gets: the document after a JSON
 * round trip.
 */
import {readdirSync} from 'fs';
import {join} from 'path';
import {heroDesignerCharacter, type ParsedCharacter} from 'core/hero';
import type {CharacterDocument, Edition} from 'core/ports';
import {LOW_POWERED_5E, STANDARD_6E, buildRecipe, generatableArchetypes, rollRecipeFor} from 'core/random';
import {canDisplayCharacter} from '../characterSheet';
import {seededRng} from '../../../core/dice/__tests__/support/seededRng';

type Obj = Record<string, any>;

const FIXTURE_DIR = join(__dirname, '../../../core/hero/__tests__/fixtures');
const FIXTURES = readdirSync(FIXTURE_DIR)
    .filter((file) => file.endsWith('.json') && file !== 'manifest.json')
    .map((file) => file.replace(/\.json$/, ''));

/** What arrives on the other phone: the engine's output, serialised and parsed back. */
const overTheWire = (parsed: ParsedCharacter): CharacterDocument => JSON.parse(JSON.stringify(heroDesignerCharacter.getCharacter(parsed)));

const fixture = (name: string): CharacterDocument => overTheWire(JSON.parse(JSON.stringify(require(join(FIXTURE_DIR, `${name}.json`)))) as ParsedCharacter);

const editionOf = (document: CharacterDocument): Edition => (heroDesignerCharacter.isFifth(document as never) ? '5E' : '6E');

describe('canDisplayCharacter — never refuses a real character', () => {
    it('the corpus is all there', () => {
        expect(FIXTURES.length).toBeGreaterThanOrEqual(37);
    });

    it.each(FIXTURES)('%s', (name) => {
        const document = fixture(name);

        expect(canDisplayCharacter(document, editionOf(document))).toBe(true);
    });

    it.each([
        ['5E', LOW_POWERED_5E],
        ['6E', STANDARD_6E],
    ] as const)('every %s archetype the generator can roll', (edition, level) => {
        for (const archetype of generatableArchetypes(level.edition)) {
            const document = overTheWire(buildRecipe(rollRecipeFor(seededRng(11), level, archetype)).parsed);

            expect([archetype.name, canDisplayCharacter(document, edition)]).toEqual([archetype.name, true]);
        }
    });

    it('a thin, unprocessed document is shown by the basic fallback, so it is accepted', () => {
        expect(canDisplayCharacter({}, '6E')).toBe(true);
        expect(canDisplayCharacter({characteristics: [{definition: '(6E)'}]}, '6E')).toBe(true);
    });
});

describe('canDisplayCharacter — refuses what the screen could not walk', () => {
    const damaged = (patch: (document: Obj) => void): CharacterDocument => {
        const document = fixture('defensor') as Obj;
        patch(document);

        return document;
    };

    it.each<[string, (document: Obj) => void]>([
        ['a null in the powers list', (d) => d.powers.push(null)],
        ['a null among the characteristics', (d) => d.characteristics.push(null)],
    ])('%s', (_, patch) => {
        expect(canDisplayCharacter(damaged(patch), '6E')).toBe(false);
    });
});
