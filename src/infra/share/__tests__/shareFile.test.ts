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
 * Two phones, end to end: each test builds a sender library and a receiver library — real SQLite,
 * real migrations, an image store over its own file system — and moves a character between them
 * through the actual bytes of a `.hsm`. Nothing is mocked but the disk.
 */
import {readFileSync} from 'fs';
import {join} from 'path';
import {strToU8, zipSync} from 'fflate';
import {heroDesignerCharacter} from 'core/hero';
import type {Character} from 'core/ports';
import {buildRecipe, parseRecipe, rollRecipe, LOW_POWERED_5E} from 'core/random';
import {MANIFEST_ENTRY, copyIdentity, toSharedCharacter, type ExportContext} from 'core/share';
import {createBetterSqlite3Database} from '../../persistence/driver/betterSqlite3Database';
import {createRepositories, type Repositories} from '../../persistence/repositories';
import {FileImageStore} from '../../files/fileImageStore';
import {inMemoryFileSystem, type FileSystem} from '../../files/fileSystem';
import {filePathFromUri} from '../../files/fileUri';
import {importHdc} from '../../import';
import {decodeCharacterXml} from '../../import/decodeCharacterXml';
import {parseHdc} from '../../import/hdcParser';
import manifest from '../../../core/hero/__tests__/fixtures/manifest.json';
import {seededRng} from '../../../core/dice/__tests__/support/seededRng';
import {MAX_MANIFEST_BYTES, packCharacter, saveReceivedCharacter, shareFileName, unpackCharacter, type ReceivedCharacter} from '../shareFile';

type Obj = Record<string, any>;

const RAW_DIR = join(__dirname, '../../../../fixtures/characters');
const bytesOf = (source: string): Uint8Array => new Uint8Array(readFileSync(join(RAW_DIR, source)));

const context: ExportContext = {appVersion: '2.9.1', schemaVersion: 8, exportedAt: '2026-11-06T12:00:00.000Z'};

interface Phone {
    repos: Repositories;
    fs: FileSystem;
}

const phone = (name: string): Phone => {
    const fs = inMemoryFileSystem();
    let n = 0;

    return {
        fs,
        repos: createRepositories(createBetterSqlite3Database(), new FileImageStore(fs, `/${name}/images`, () => `p${n++}`), () => '2026-01-01T00:00:00.000Z'),
    };
};

const portraitSource = (): string => {
    for (const entry of manifest as Array<{source: string}>) {
        if ((parseHdc(decodeCharacterXml(bytesOf(entry.source))) as {image?: unknown}).image !== undefined) {
            return entry.source;
        }
    }

    throw new Error('no portrait fixture found');
};

const stored = async (on: Phone, id: string): Promise<Character> => {
    const character = await on.repos.characters.get(id);

    if (character === null) {
        throw new Error(`${id} is not in the library`);
    }

    return character;
};

const portraitBytes = async (on: Phone, character: Character): Promise<Uint8Array> => on.fs.readFile(filePathFromUri(character.portraitUri ?? ''));

const received = (bytes: Uint8Array): ReceivedCharacter => {
    const result = unpackCharacter(bytes);

    if (!result.ok) {
        throw new Error(`expected a readable .hsm, got ${JSON.stringify(result)}`);
    }

    return result.received;
};

/** Pack on one phone, unpack and save on the other under the sender's id. */
const send = async (from: Phone, id: string, to: Phone, includePortrait = true): Promise<Character> => {
    const packed = await packCharacter(await stored(from, id), from.fs, context, includePortrait);
    const incoming = received(packed.bytes);

    await saveReceivedCharacter(incoming, {id: incoming.shared.character.id, name: incoming.shared.character.name}, to.repos);

    return stored(to, id);
};

const saveGenerated = async (on: Phone, id: string, seed: number): Promise<Character> => {
    const generated = buildRecipe(rollRecipe(seededRng(seed), LOW_POWERED_5E));

    await on.repos.characters.save({
        id,
        name: generated.recipe.name,
        player: null,
        edition: '5E',
        document: heroDesignerCharacter.getCharacter(generated.parsed as never) as unknown as Obj,
        origin: 'generated',
        recipe: generated.recipe as unknown as Obj,
    });

    return stored(on, id);
};

describe('a character survives the trip', () => {
    it('an imported .hdc arrives with its document, portrait and framing — and still read-only', async () => {
        const sender = phone('a');
        const receiver = phone('b');
        const source = portraitSource();
        const {id} = await importHdc(bytesOf(source), source, sender.repos);
        await sender.repos.characters.setPortraitFocus(id, {x: 0.25, y: 0.75, scale: 2});
        const original = await stored(sender, id);

        const arrived = await send(sender, id, receiver);

        expect(arrived).toMatchObject({
            id,
            name: original.name,
            player: original.player,
            edition: original.edition,
            origin: 'imported',
            recipe: null,
            source: null,
        });
        expect(arrived.document).toEqual(original.document);
        expect(arrived.portraitFocus).toEqual({x: 0.25, y: 0.75, scale: 2});
        expect(arrived.portraitUri).toMatch(/^file:\/\/\/b\/images\//);
        expect(await portraitBytes(receiver, arrived)).toEqual(await portraitBytes(sender, original));
    });

    it('a generated character arrives still re-rollable', async () => {
        const sender = phone('a');
        const receiver = phone('b');
        const original = await saveGenerated(sender, 'generated-brick-1', 7);

        const arrived = await send(sender, 'generated-brick-1', receiver);

        expect(arrived.origin).toBe('generated');
        expect(parseRecipe(arrived.recipe)).toEqual(parseRecipe(original.recipe));
        expect(arrived.document).toEqual(original.document);
        expect(arrived.portraitUri).toBeNull();
    });

    it('sharing without the portrait sends none', async () => {
        const sender = phone('a');
        const source = portraitSource();
        const {id} = await importHdc(bytesOf(source), source, sender.repos);

        const packed = await packCharacter(await stored(sender, id), sender.fs, context, false);

        expect(received(packed.bytes).portrait).toBeNull();
        expect(received(packed.bytes).shared.character.portrait).toBeNull();
        expect(packed.portraitIncluded).toBe(true);
    });

    it('a portrait missing from disk drops out of the share, and says so', async () => {
        const sender = phone('a');
        const source = portraitSource();
        const {id} = await importHdc(bytesOf(source), source, sender.repos);
        const character = await stored(sender, id);
        await sender.fs.unlink(filePathFromUri(character.portraitUri ?? ''));

        const packed = await packCharacter(character, sender.fs, context);

        expect(packed.portraitIncluded).toBe(false);
        expect(received(packed.bytes).shared.character.portrait).toBeNull();
    });

    it('a re-send is a full replace — nothing of the old character survives', async () => {
        const sender = phone('a');
        const receiver = phone('b');
        const source = portraitSource();
        // The receiver's copy is a *generated* character with a portrait; the sender's, under the
        // same id, is an import without one. A replace that leaned on save()'s keep-what's-there
        // defaults would leave the recipe and the picture behind.
        await saveGenerated(receiver, 'shared-id', 3);
        const {id: importedId} = await importHdc(bytesOf(source), source, receiver.repos);
        const donor = await stored(receiver, importedId);
        await receiver.repos.characters.save({
            id: 'shared-id',
            name: 'Old',
            player: null,
            edition: '5E',
            document: {},
            portrait: {bytes: await portraitBytes(receiver, donor), mime: 'image/jpeg'},
        });
        await receiver.repos.characters.setPortraitFocus('shared-id', {x: 0, y: 0, scale: 3});

        const {id} = await importHdc(bytesOf('Defensor.hdc'), 'shared-id.hdc', sender.repos);
        expect(id).toBe('shared-id.hsmc');
        const packed = await packCharacter({...(await stored(sender, id)), id: 'shared-id'}, sender.fs, context);
        await saveReceivedCharacter(received(packed.bytes), {id: 'shared-id', name: 'Defensor'}, receiver.repos);

        expect(await stored(receiver, 'shared-id')).toMatchObject({
            name: 'Defensor',
            origin: 'imported',
            recipe: null,
            source: null,
            portraitUri: null,
            portraitFocus: null,
        });
    });

    it('import as copy lands beside the original, not on it', async () => {
        const sender = phone('a');
        const receiver = phone('b');
        await saveGenerated(sender, 'generated-brick-1', 7);
        await saveGenerated(receiver, 'generated-brick-1', 9);
        const incoming = received((await packCharacter(await stored(sender, 'generated-brick-1'), sender.fs, context)).bytes);

        const placement = copyIdentity(incoming.shared.character, await receiver.repos.characters.list());
        await saveReceivedCharacter(incoming, placement, receiver.repos);

        expect(await receiver.repos.characters.list()).toHaveLength(2);
        expect((await stored(receiver, placement.id)).name).toBe(placement.name);
        expect(placement.id).toBe('generated-brick-1-2');
    });
});

describe('unpacking — every failure is reported, none is thrown', () => {
    const valid = (): Obj =>
        JSON.parse(
            JSON.stringify(
                toSharedCharacter(
                    {
                        id: 'x',
                        name: 'X',
                        player: null,
                        edition: '6E',
                        isActive: false,
                        portraitUri: null,
                        portraitFocus: null,
                        filename: null,
                        updatedAt: '',
                        document: {},
                        origin: 'imported',
                        recipe: null,
                        source: null,
                    },
                    null,
                    context,
                ),
            ),
        );

    const zipOf = (entries: Record<string, string | Uint8Array>): Uint8Array =>
        zipSync(Object.fromEntries(Object.entries(entries).map(([name, data]) => [name, typeof data === 'string' ? strToU8(data) : data])));

    it.each([
        ['empty bytes', new Uint8Array()],
        ['an .hdc', bytesOf('Defensor.hdc')],
        ['random bytes', new Uint8Array(512).map((_, i) => (i * 37) % 256)],
    ])('%s is not a share', (_, bytes) => {
        expect(unpackCharacter(bytes)).toEqual({ok: false, reason: 'not-a-share'});
    });

    it('a zip without our manifest is not a share', () => {
        expect(unpackCharacter(zipOf({'readme.txt': 'hello'}))).toEqual({ok: false, reason: 'not-a-share'});
    });

    it('a manifest that is not JSON is malformed', () => {
        expect(unpackCharacter(zipOf({[MANIFEST_ENTRY]: '{not json'}))).toMatchObject({reason: 'malformed'});
    });

    it('a manifest from a newer app says so', () => {
        expect(unpackCharacter(zipOf({[MANIFEST_ENTRY]: JSON.stringify({...valid(), formatVersion: 99})}))).toMatchObject({
            reason: 'newer-format',
            formatVersion: 99,
        });
    });

    it('a manifest naming a portrait the zip lacks is malformed', () => {
        const named = valid();
        named.character.portrait = {entry: 'portrait.png', mime: 'image/png', focus: null};

        expect(unpackCharacter(zipOf({[MANIFEST_ENTRY]: JSON.stringify(named)}))).toMatchObject({reason: 'malformed', detail: 'portrait.png is missing'});
    });

    it('an oversized manifest is refused before it is inflated', () => {
        expect(unpackCharacter(zipOf({[MANIFEST_ENTRY]: ' '.repeat(MAX_MANIFEST_BYTES + 1)}))).toMatchObject({
            reason: 'malformed',
            detail: expect.stringContaining('larger than'),
        });
    });

    it('stray entries are never read — only what the manifest names comes out', () => {
        const result = unpackCharacter(zipOf({[MANIFEST_ENTRY]: JSON.stringify(valid()), '../../escape.sh': 'rm -rf /', 'portrait.jpg': 'not named'}));

        expect(result).toMatchObject({ok: true, received: {portrait: null}});
    });
});

describe('shareFileName', () => {
    it.each([
        ['Fire Brick', 'Fire Brick.hsm'],
        ['AC/DC: "Live"?', 'ACDC Live.hsm'],
        ['../../etc', 'etc.hsm'],
        ['   ', 'character.hsm'],
        ['Tab\there', 'Tabhere.hsm'],
    ])('%j → %j', (name, file) => {
        expect(shareFileName(name)).toBe(file);
    });
});
