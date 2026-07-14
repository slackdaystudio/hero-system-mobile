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

import {readFileSync} from 'fs';
import {join} from 'path';
import {createBetterSqlite3Database} from '../../persistence/driver/betterSqlite3Database';
import {createRepositories, type Repositories} from '../../persistence/repositories';
import {FileImageStore} from '../../files/fileImageStore';
import {inMemoryFileSystem} from '../../files/fileSystem';
import {decodeCharacterXml} from '../decodeCharacterXml';
import {parseHdc} from '../hdcParser';
import {characterId, importHdc} from '../importCharacter';
import manifest from '../../../core/hero/__tests__/fixtures/manifest.json';

const RAW_DIR = join(__dirname, '../../../../fixtures/characters');
const bytesOf = (source: string): Uint8Array => new Uint8Array(readFileSync(join(RAW_DIR, source)));

const setup = (): Repositories => {
    const fs = inMemoryFileSystem();
    let n = 0;
    return createRepositories(createBetterSqlite3Database(), new FileImageStore(fs, '/images', () => `p${n++}`), () => '2026-01-01T00:00:00.000Z');
};

const portraitSource = (): string => {
    for (const entry of manifest as Array<{source: string}>) {
        const parsed = parseHdc(decodeCharacterXml(bytesOf(entry.source))) as {image?: unknown};
        if (parsed.image !== undefined) {
            return entry.source;
        }
    }
    throw new Error('no portrait fixture found');
};

describe('importHdc', () => {
    it('derives a safe .hsmc id from the file name', () => {
        expect(characterId('Defensor.hdc')).toBe('Defensor.hsmc');
        expect(characterId('My Guy (v2).xml')).toBe('My_Guy_v2.hsmc');
        expect(characterId('...')).toBe('character.hsmc');
    });

    it('imports a .hdc into the library as a processed character', async () => {
        const repos = setup();

        const result = await importHdc(bytesOf('Defensor.hdc'), 'Defensor.hdc', repos);
        expect(result).toEqual({id: 'Defensor.hsmc', name: 'Defensor'});

        const saved = await repos.characters.get('Defensor.hsmc');
        expect(saved?.name).toBe('Defensor');
        expect(saved?.edition).toBe('6E');
        // Stored document is the engine output (flat characteristic array with shortNames).
        const characteristics = (saved?.document.characteristics ?? []) as Array<{shortName?: string}>;
        expect(Array.isArray(characteristics)).toBe(true);
        expect(typeof characteristics[0]?.shortName).toBe('string');
        expect(saved?.document).not.toHaveProperty('portrait');
        expect(saved?.document).not.toHaveProperty('image');
    });

    it('re-importing the same file updates in place (upsert), not duplicates', async () => {
        const repos = setup();

        await importHdc(bytesOf('Defensor.hdc'), 'Defensor.hdc', repos);
        await importHdc(bytesOf('Defensor.hdc'), 'Defensor.hdc', repos);

        expect(await repos.characters.list()).toHaveLength(1);
    });

    it('lifts an embedded portrait to the image store', async () => {
        const repos = setup();
        const source = portraitSource();

        const result = await importHdc(bytesOf(source), source, repos);

        const saved = await repos.characters.get(result.id);
        expect(saved?.portraitUri).toMatch(/^file:\/\/\/images\//);
    });
});
