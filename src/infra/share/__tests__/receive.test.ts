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
 * Receiving, end to end on real SQLite: what lands in the library for each answer to the
 * replace/copy prompt — and, as importantly, that nothing lands when the answer is no.
 */
import {readFileSync} from 'fs';
import {join} from 'path';
import type {Character} from 'core/ports';
import type {LibraryEntry, SharedCharacterBody} from 'core/share';
import {createBetterSqlite3Database} from '../../persistence/driver/betterSqlite3Database';
import {createRepositories, type Repositories} from '../../persistence/repositories';
import {FileImageStore} from '../../files/fileImageStore';
import {inMemoryFileSystem, type FileSystem} from '../../files/fileSystem';
import {importHdc} from '../../import';
import {packCharacter} from '../shareFile';
import {isZip, receiveCharacter, type ConflictChoice, type ReceiveOptions} from '../receive';

const RAW_DIR = join(__dirname, '../../../../fixtures/characters');
const bytesOf = (source: string): Uint8Array => new Uint8Array(readFileSync(join(RAW_DIR, source)));

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

const context = {appVersion: '2.9.1', schemaVersion: 8, exportedAt: '2026-11-07T12:00:00.000Z'};

/** A `.hsm` of Defensor, as the sender's phone would produce it. */
const defensorShare = async (): Promise<Uint8Array> => {
    const sender = phone('a');
    const {id} = await importHdc(bytesOf('Defensor.hdc'), 'Defensor.hdc', sender.repos);
    const character = (await sender.repos.characters.get(id)) as Character;

    return (await packCharacter(character, sender.fs, context)).bytes;
};

/** Options that accept everything and answer the prompt with `choice`, recording whether it was asked. */
const answering = (choice: ConflictChoice) => {
    const asked: Array<{existing: LibraryEntry; incoming: SharedCharacterBody}> = [];
    const options: ReceiveOptions = {
        canDisplay: () => true,
        resolveConflict: async (existing, incoming) => {
            asked.push({existing, incoming});

            return choice;
        },
    };

    return {asked, options};
};

describe('isZip', () => {
    it('tells a .hsm from a .hdc by content', async () => {
        expect(isZip(await defensorShare())).toBe(true);
        expect(isZip(bytesOf('Defensor.hdc'))).toBe(false);
        expect(isZip(new Uint8Array([0x50, 0x4b]))).toBe(false);
        expect(isZip(new Uint8Array())).toBe(false);
    });
});

describe('receiveCharacter', () => {
    it('a character not yet in the library imports without asking', async () => {
        const receiver = phone('b');
        const {asked, options} = answering('cancel');

        expect(await receiveCharacter(await defensorShare(), receiver.repos, options)).toEqual({
            status: 'imported',
            id: 'Defensor.hsmc',
            name: 'Defensor',
            replaced: false,
        });
        expect(asked).toHaveLength(0);
        expect(await receiver.repos.characters.get('Defensor.hsmc')).toMatchObject({name: 'Defensor', origin: 'imported'});
    });

    it('a clash asks, naming what would be overwritten', async () => {
        const receiver = phone('b');
        await importHdc(bytesOf('Defensor.hdc'), 'Defensor.hdc', receiver.repos);
        const {asked, options} = answering('cancel');

        await receiveCharacter(await defensorShare(), receiver.repos, options);

        expect(asked).toEqual([
            {existing: expect.objectContaining({id: 'Defensor.hsmc', name: 'Defensor'}), incoming: expect.objectContaining({id: 'Defensor.hsmc'})},
        ]);
    });

    it('"cancel" writes nothing', async () => {
        const receiver = phone('b');
        await importHdc(bytesOf('Defensor.hdc'), 'Defensor.hdc', receiver.repos);
        await receiver.repos.characters.save({id: 'Defensor.hsmc', name: 'Mine', player: null, edition: '6E', document: {}});

        expect(await receiveCharacter(await defensorShare(), receiver.repos, answering('cancel').options)).toEqual({status: 'cancelled'});
        expect(await receiver.repos.characters.list()).toHaveLength(1);
        expect((await receiver.repos.characters.get('Defensor.hsmc'))?.name).toBe('Mine');
    });

    it('"copy" lands beside the original', async () => {
        const receiver = phone('b');
        await importHdc(bytesOf('Defensor.hdc'), 'Defensor.hdc', receiver.repos);

        expect(await receiveCharacter(await defensorShare(), receiver.repos, answering('copy').options)).toEqual({
            status: 'imported',
            id: 'Defensor-2.hsmc',
            name: 'Defensor (2)',
            replaced: false,
        });
        expect((await receiver.repos.characters.list()).map((entry) => entry.name).sort()).toEqual(['Defensor', 'Defensor (2)']);
    });

    it('"replace" overwrites in place', async () => {
        const receiver = phone('b');
        await receiver.repos.characters.save({id: 'Defensor.hsmc', name: 'Mine', player: null, edition: '6E', document: {}});

        expect(await receiveCharacter(await defensorShare(), receiver.repos, answering('replace').options)).toEqual({
            status: 'imported',
            id: 'Defensor.hsmc',
            name: 'Defensor',
            replaced: true,
        });
        expect(await receiver.repos.characters.list()).toHaveLength(1);
        expect((await receiver.repos.characters.get('Defensor.hsmc'))?.name).toBe('Defensor');
    });

    it('a character this phone cannot show is refused before anything is written — and before anyone is asked', async () => {
        const receiver = phone('b');
        const {asked} = answering('replace');

        const result = await receiveCharacter(await defensorShare(), receiver.repos, {canDisplay: () => false, resolveConflict: async () => 'replace'});

        expect(result).toEqual({ok: false, reason: 'undisplayable'});
        expect(asked).toHaveLength(0);
        expect(await receiver.repos.characters.list()).toHaveLength(0);
    });

    it('the display check sees the incoming character', async () => {
        const seen: SharedCharacterBody[] = [];

        await receiveCharacter(await defensorShare(), phone('b').repos, {
            canDisplay: (incoming) => {
                seen.push(incoming);

                return true;
            },
            resolveConflict: async () => 'cancel',
        });

        expect(seen).toEqual([expect.objectContaining({name: 'Defensor', edition: '6E'})]);
    });

    it('a file that is not ours is reported, and writes nothing', async () => {
        const receiver = phone('b');

        expect(await receiveCharacter(bytesOf('Defensor.hdc'), receiver.repos, answering('copy').options)).toEqual({ok: false, reason: 'not-a-share'});
        expect(await receiver.repos.characters.list()).toHaveLength(0);
    });
});
