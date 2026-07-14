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

import {strToU8, zipSync} from 'fflate';
import {DEFAULT_STATISTICS} from 'core/ports';
import {inMemoryFileSystem, type FileSystem} from '../../files/fileSystem';
import {FileImageStore} from '../../files/fileImageStore';
import {createBetterSqlite3Database} from '../../persistence/driver/betterSqlite3Database';
import type {SqlDatabase} from '../../persistence/driver/sqlDatabase';
import {createRepositories, type Repositories} from '../../persistence/repositories';
import {fflateUnzip} from '../fflateUnzip';
import {createLegacySource} from '../legacySourceImpl';
import type {LegacyKeyValueStore} from '../legacySourceImpl';
import {migrateV1} from '../migrateV1';

const CHAR_DIR = '/Documents/character';
const IMAGES_DIR = '/Documents/images';
const PORTRAIT = 'data:image/png;base64,AQID'; // decodes to bytes [1, 2, 3]

const hsmc = (basename: string, document: unknown): Uint8Array => zipSync({[`${basename}.json`]: strToU8(JSON.stringify(document))});

const defensorDoc = {
    characterInfo: {characterName: 'Defensor', playerName: 'Phil'},
    characteristics: [{definition: '(Hero System 6th Edition)'}],
    powers: [{name: 'Force Field'}],
    portrait: PORTRAIT,
    filename: 'defensor.hsmc',
};

const grondDoc = {
    characterInfo: {characterName: 'Grond', playerName: 'GM'},
    characteristics: [{definition: '(Hero System Fifth Edition Revised)'}],
    filename: 'grond.hsmc',
};

const fakeKeyValue = (data: Record<string, string>): LegacyKeyValueStore & {remaining: () => string[]} => ({
    getItem: async (key) => data[key] ?? null,
    multiRemove: async (keys) => {
        for (const key of keys) {
            delete data[key];
        }
    },
    remaining: () => Object.keys(data),
});

const legacyHsmDb = (): SqlDatabase => {
    const db = createBetterSqlite3Database();
    db.execute('CREATE TABLE settings (loadout TEXT PRIMARY KEY, useFifthEdition INTEGER, playSounds INTEGER, onlyDiceSounds INTEGER, showAnimations INTEGER, increaseEntropy INTEGER, colorScheme TEXT)');
    db.execute('INSERT INTO settings VALUES (?, ?, ?, ?, ?, ?, ?)', ['default', 1, 0, 0, 0, 1, 'dark']);
    db.execute('CREATE TABLE statistics (loadout TEXT PRIMARY KEY, stats TEXT)');
    db.execute('INSERT INTO statistics VALUES (?, ?)', ['default', JSON.stringify({...DEFAULT_STATISTICS, sum: 99})]);
    return db;
};

const repositoriesOver = (fs: FileSystem): Repositories =>
    createRepositories(createBetterSqlite3Database(), new FileImageStore(fs, IMAGES_DIR, () => 'p1'), () => '2026-01-01T00:00:00.000Z');

describe('createLegacySource + migrateV1 (real zip + real legacy SQLite)', () => {
    it('imports .hsmc characters, hsm.db settings/statistics, hero and version end to end', async () => {
        const fs = inMemoryFileSystem();
        await fs.writeFile(`${CHAR_DIR}/defensor.hsmc`, hsmc('defensor', defensorDoc));
        await fs.writeFile(`${CHAR_DIR}/grond.hsmc`, hsmc('grond', grondDoc));

        const data: Record<string, string> = {
            characters: JSON.stringify({'0': {filename: 'defensor.hsmc'}, '2': {filename: 'grond.hsmc'}}),
            character: JSON.stringify({filename: 'defensor.hsmc'}),
            hero: JSON.stringify({name: 'Random Guy'}),
            version: '2.3.0',
        };
        const keyValue = fakeKeyValue(data);
        const repos = repositoriesOver(fs);

        const source = createLegacySource({keyValue, fileSystem: fs, unzip: fflateUnzip, characterDir: CHAR_DIR, legacyDb: legacyHsmDb()});
        const result = await migrateV1(repos, source);

        expect(result).toEqual({migrated: true, characters: 2, portraits: 1});

        // Characters, with edition derived from the real .hsmc document.
        const list = await repos.characters.list();
        expect(list.map((c) => [c.name, c.edition])).toEqual([
            ['Defensor', '6E'],
            ['Grond', '5E'],
        ]);
        expect((await repos.characters.getActive())?.name).toBe('Defensor');

        // Portrait lifted out of the .hsmc data URI to a file on disk.
        expect(await fs.readFile(`${IMAGES_DIR}/p1.png`)).toEqual(new Uint8Array([1, 2, 3]));
        const defensor = await repos.characters.get('defensor.hsmc');
        expect(defensor?.portraitUri).toBe(`file://${IMAGES_DIR}/p1.png`);
        expect(defensor?.document).not.toHaveProperty('portrait');

        // Settings from the columnar hsm.db (0/1 -> bool), statistics from its JSON.
        const settings = await repos.settings.get();
        expect(settings.useFifthEdition).toBe(true);
        expect(settings.showAnimations).toBe(false);
        expect(settings.colorScheme).toBe('dark');
        expect((await repos.statistics.get()).sum).toBe(99);

        // Random hero + version, then the legacy AsyncStorage keys are cleared.
        expect((await repos.randomHero.get())?.name).toBe('Random Guy');
        expect(await repos.appState.get('version')).toBe('2.3.0');
        expect(keyValue.remaining()).not.toContain('characters');
        expect(keyValue.remaining()).not.toContain('character');
    });

    it('recovers a character from AsyncStorage when its .hsmc is missing on disk', async () => {
        const fs = inMemoryFileSystem(); // no .hsmc files
        const data: Record<string, string> = {
            characters: JSON.stringify({'0': {filename: 'orphan.hsmc', characterInfo: {characterName: 'Orphan'}, characteristics: [{definition: '(6E)'}]}}),
            character: JSON.stringify({filename: 'orphan.hsmc'}),
        };
        const repos = repositoriesOver(fs);

        const source = createLegacySource({keyValue: fakeKeyValue(data), fileSystem: fs, unzip: fflateUnzip, characterDir: CHAR_DIR, legacyDb: null});
        await migrateV1(repos, source);

        const list = await repos.characters.list();
        expect(list.map((c) => c.name)).toEqual(['Orphan']);
        expect(list[0].isActive).toBe(true);
    });

    it('is a clean no-op when there is no legacy data at all', async () => {
        const fs = inMemoryFileSystem();
        const repos = repositoriesOver(fs);

        const source = createLegacySource({keyValue: fakeKeyValue({}), fileSystem: fs, unzip: fflateUnzip, characterDir: CHAR_DIR, legacyDb: null});
        const result = await migrateV1(repos, source);

        expect(result.characters).toBe(0);
        expect(await repos.characters.list()).toEqual([]);
        expect((await repos.settings.get()).showAnimations).toBe(true); // untouched defaults
    });
});
