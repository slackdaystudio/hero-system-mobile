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
 * The manifest is the contract between two phones running possibly different builds, so these
 * tests pin two things: that a real character survives the trip with its edit rights intact, and
 * that every way a file can be wrong lands in the bucket the player can act on.
 */
import {emptyDraft, parseSource, toSource, build} from 'core/authoring';
import type {Character} from 'core/ports';
import {buildRecipe, parseRecipe, rollRecipe, LOW_POWERED_5E} from 'core/random';
import {heroDesignerCharacter} from 'core/hero';
import {
    MANIFEST_ENTRY,
    SHARE_FORMAT,
    SHARE_FORMAT_VERSION,
    parseSharedCharacter,
    portraitEntry,
    toSharedCharacter,
    type ExportContext,
    type SharedCharacter,
} from 'core/share';
import {seededRng} from '../../dice/__tests__/support/seededRng';

type Obj = Record<string, any>;

const context: ExportContext = {appVersion: '2.9.1', schemaVersion: 8, exportedAt: '2026-11-06T12:00:00.000Z'};

const row = (over: Partial<Character> = {}): Character => ({
    id: 'brick.hsmc',
    name: 'Brick',
    player: 'Phil',
    edition: '5E',
    isActive: true,
    portraitUri: 'file:///data/user/0/com.herogmtools/files/portraits/abc.jpg',
    portraitFocus: {x: 0.5, y: 0.2, scale: 1.5},
    filename: 'brick.hsmc',
    updatedAt: '2026-11-01T00:00:00.000Z',
    document: {characterInfo: {characterName: 'Brick'}},
    origin: 'imported',
    recipe: null,
    source: null,
    ...over,
});

/** What the receiving phone actually sees: the manifest after a JSON round trip. */
const overTheWire = (shared: SharedCharacter): unknown => JSON.parse(JSON.stringify(shared));

const readBack = (shared: unknown): SharedCharacter => {
    const result = parseSharedCharacter(shared);

    if (!result.ok) {
        throw new Error(`expected a readable manifest, got ${JSON.stringify(result)}`);
    }

    return result.shared;
};

/** A valid manifest with one field replaced, for the rejection cases. */
const tampered = (patch: (manifest: Obj) => void): unknown => {
    const manifest = overTheWire(toSharedCharacter(row(), 'image/jpeg', context)) as Obj;
    patch(manifest);

    return manifest;
};

describe('round trip — a character keeps what it had', () => {
    it('a generated character still re-rolls on the other phone', () => {
        const generated = buildRecipe(rollRecipe(seededRng(7), LOW_POWERED_5E));
        const document = heroDesignerCharacter.getCharacter(generated.parsed as never) as unknown as Obj;
        const sent = row({id: 'generated-brick-1', origin: 'generated', recipe: generated.recipe as unknown as Obj, document});

        const received = readBack(overTheWire(toSharedCharacter(sent, null, context))).character;

        expect(received.origin).toBe('generated');
        expect(parseRecipe(received.recipe)).toEqual(generated.recipe);
        expect(received.document).toEqual(JSON.parse(JSON.stringify(document)));
    });

    it('an authored character still opens in the editor on the other phone', () => {
        const draft = {...emptyDraft('6E'), name: 'Sparrow'};
        const sent = row({id: 'authored-sparrow', edition: '6E', origin: 'authored', source: toSource(draft), document: build(draft)});

        const received = readBack(overTheWire(toSharedCharacter(sent, null, context))).character;

        expect(received.origin).toBe('authored');
        expect(parseSource(received.source)).toEqual(parseSource(toSource(draft)));
    });

    it('an imported character arrives read-only — no recipe or source, even if the row somehow had one', () => {
        const sent = row({recipe: {level: 'stray'}, source: {stray: true}});

        const received = readBack(overTheWire(toSharedCharacter(sent, null, context))).character;

        expect(received).toMatchObject({origin: 'imported', recipe: null, source: null});
    });

    it('carries the portrait framing and names the entry the bytes go in', () => {
        const received = readBack(overTheWire(toSharedCharacter(row(), 'image/jpeg', context))).character;

        expect(received.portrait).toEqual({entry: 'portrait.jpg', mime: 'image/jpeg', focus: {x: 0.5, y: 0.2, scale: 1.5}});
    });

    it('leaves device-local fields behind', () => {
        const manifest = overTheWire(toSharedCharacter(row(), 'image/jpeg', context)) as Obj;

        for (const local of ['portraitUri', 'isActive', 'filename', 'updatedAt', 'portraitFocus']) {
            expect(manifest.character).not.toHaveProperty(local);
        }

        expect(JSON.stringify(manifest)).not.toContain('file://');
    });

    it('stamps the envelope', () => {
        const manifest = toSharedCharacter(row(), null, context);

        expect(manifest).toMatchObject({
            format: SHARE_FORMAT,
            formatVersion: SHARE_FORMAT_VERSION,
            exportedAt: context.exportedAt,
            exportedBy: {appVersion: '2.9.1', schemaVersion: 8},
        });
        expect(MANIFEST_ENTRY).toBe('character.json');
    });
});

describe('portraits', () => {
    it.each([
        ['image/jpeg', 'portrait.jpg'],
        ['image/jpg', 'portrait.jpg'],
        ['IMAGE/PNG', 'portrait.png'],
        ['image/gif', 'portrait.gif'],
        ['image/webp', 'portrait.webp'],
    ])('%s is stored as %s', (mime, entry) => {
        expect(portraitEntry(mime)).toBe(entry);
    });

    it('drops a portrait the format cannot carry rather than failing the share', () => {
        expect(toSharedCharacter(row(), 'image/heic', context).character.portrait).toBeNull();
    });

    it('sharing without the portrait sends none', () => {
        expect(toSharedCharacter(row(), null, context).character.portrait).toBeNull();
    });

    it('an unframed portrait travels as unframed, not as centred', () => {
        expect(toSharedCharacter(row({portraitFocus: null}), 'image/png', context).character.portrait?.focus).toBeNull();
    });
});

describe('reading — every failure lands where the player can act on it', () => {
    describe('not-a-share: the wrong file was picked', () => {
        it.each([
            ['null', null],
            ['an array', []],
            ['a string', 'character'],
            ['some other JSON', {name: 'Brick'}],
            ['a near miss on the format tag', {format: 'hero-system-mobile/characters', formatVersion: 1}],
        ])('%s', (_, value) => {
            expect(parseSharedCharacter(value)).toEqual({ok: false, reason: 'not-a-share'});
        });
    });

    describe('newer-format: update the app', () => {
        it('reports the version it could not read', () => {
            expect(parseSharedCharacter({format: SHARE_FORMAT, formatVersion: SHARE_FORMAT_VERSION + 1})).toEqual({
                ok: false,
                reason: 'newer-format',
                formatVersion: SHARE_FORMAT_VERSION + 1,
            });
        });

        it('says so even when the rest of the shape is unrecognisable — a newer shape is expected to differ', () => {
            expect(parseSharedCharacter({format: SHARE_FORMAT, formatVersion: 9, entirely: 'different'})).toMatchObject({reason: 'newer-format'});
        });
    });

    describe('malformed: damaged or hand-edited', () => {
        it.each<[string, (manifest: Obj) => void]>([
            ['formatVersion is missing', (m) => delete m.formatVersion],
            ['formatVersion is zero', (m) => (m.formatVersion = 0)],
            ['formatVersion is fractional', (m) => (m.formatVersion = 1.5)],
            ['exportedAt is missing', (m) => delete m.exportedAt],
            ['exportedBy is missing', (m) => delete m.exportedBy],
            ['schemaVersion is not an integer', (m) => (m.exportedBy.schemaVersion = '8')],
            ['character is missing', (m) => delete m.character],
            ['id is blank', (m) => (m.character.id = '  ')],
            ['name is missing', (m) => delete m.character.name],
            ['player is a number', (m) => (m.character.player = 7)],
            ['edition is unknown', (m) => (m.character.edition = '4E')],
            ['origin is unknown', (m) => (m.character.origin = 'stolen')],
            ['document is missing', (m) => delete m.character.document],
            ['document is an array', (m) => (m.character.document = [])],
            [
                'recipe is a string',
                (m) => {
                    m.character.origin = 'generated';
                    m.character.recipe = 'brick';
                },
            ],
            [
                'source is an array',
                (m) => {
                    m.character.origin = 'authored';
                    m.character.source = [];
                },
            ],
            ['an import claims a recipe', (m) => (m.character.recipe = {level: '5e-low'})],
            ['an import claims a source', (m) => (m.character.source = {name: 'x'})],
            ['portrait type is unsupported', (m) => (m.character.portrait.mime = 'image/svg+xml')],
            ['portrait entry escapes the zip', (m) => (m.character.portrait.entry = '../../databases/hsm.db')],
            ['portrait entry disagrees with its type', (m) => (m.character.portrait.entry = 'portrait.png')],
            ['portrait focus is off the image', (m) => (m.character.portrait.focus.x = 1.5)],
            ['portrait focus zooms out past cover', (m) => (m.character.portrait.focus.scale = 0.5)],
            ['portrait focus is not a number', (m) => (m.character.portrait.focus.y = 'top')],
        ])('%s', (_, patch) => {
            expect(parseSharedCharacter(tampered(patch))).toMatchObject({ok: false, reason: 'malformed', detail: expect.any(String)});
        });
    });

    it('accepts what it should: a share with no portrait key at all reads as no portrait', () => {
        const value = tampered((m) => delete m.character.portrait);

        expect(readBack(value).character.portrait).toBeNull();
    });

    it('accepts an unframed portrait', () => {
        const value = tampered((m) => (m.character.portrait.focus = null));

        expect(readBack(value).character.portrait?.focus).toBeNull();
    });

    it('accepts a null player', () => {
        expect(readBack(tampered((m) => (m.character.player = null))).character.player).toBeNull();
    });

    it('does not echo unknown fields — what comes out is only what the format defines', () => {
        const value = tampered((m) => {
            m.extra = 'ignored';
            m.character.isActive = true;
        });

        const shared = readBack(value) as unknown as Obj;

        expect(shared).not.toHaveProperty('extra');
        expect(shared.character).not.toHaveProperty('isActive');
    });

    it('never throws, whatever it is handed', () => {
        const hostile: unknown[] = [undefined, 0, NaN, true, Symbol.for('x'), () => 1, {format: SHARE_FORMAT, formatVersion: 1, character: null}];

        for (const value of hostile) {
            expect(() => parseSharedCharacter(value)).not.toThrow();
        }
    });
});
