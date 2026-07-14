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

import {inMemoryFileSystem} from '../../files/fileSystem';
import {FileImageStore} from '../../files/fileImageStore';
import {createBetterSqlite3Database} from '../driver/betterSqlite3Database';
import {createRepositories} from '../repositories';

// The composition root over real SQLite + the real FileImageStore (on an
// in-memory fs). Verifies the wiring end-to-end, not just the parts.
const setup = () => {
    const db = createBetterSqlite3Database();
    const fs = inMemoryFileSystem();
    let counter = 0;
    const images = new FileImageStore(fs, '/Documents/images', () => `p${++counter}`);
    const repos = createRepositories(db, images, () => '2026-01-01T00:00:00.000Z');
    return {repos, fs};
};

describe('createRepositories (composition root)', () => {
    it('runs migrations so every repository is usable immediately', async () => {
        const {repos} = setup();

        expect(await repos.characters.list()).toEqual([]);
        expect((await repos.settings.get()).showAnimations).toBe(true);
        expect(await repos.appState.get('missing')).toBeNull();
    });

    it('saves a character with a portrait: bytes on disk, file:// uri resolved through the store', async () => {
        const {repos, fs} = setup();

        await repos.characters.save({
            id: 'c1',
            name: 'Defensor',
            player: 'Phil',
            edition: '6E',
            document: {characterInfo: {characterName: 'Defensor'}},
            portrait: {bytes: new Uint8Array([1, 2, 3]), mime: 'image/png'},
        });

        expect(await fs.readFile('/Documents/images/p1.png')).toEqual(new Uint8Array([1, 2, 3]));

        const [summary] = await repos.characters.list();
        expect(summary.portraitUri).toBe('file:///Documents/images/p1.png');
    });

    it('deletes a character and its portrait file through the wired store', async () => {
        const {repos, fs} = setup();
        await repos.characters.save({
            id: 'c1',
            name: 'Defensor',
            player: null,
            edition: '6E',
            document: {},
            portrait: {bytes: new Uint8Array([7]), mime: 'image/jpeg'},
        });
        expect(fs.size()).toBe(1);

        await repos.characters.delete('c1');

        expect(await repos.characters.get('c1')).toBeNull();
        expect(fs.size()).toBe(0);
    });
});
