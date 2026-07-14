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

import type {ImageStore, SaveCharacter} from 'core/ports';
import {createBetterSqlite3Database} from '../driver/betterSqlite3Database';
import {runMigrations} from '../migrations';
import {SqliteCharacterRepository} from '../characterRepository';

const fakeImageStore = () => {
    const files = new Map<string, {bytes: Uint8Array; mime: string}>();
    let counter = 0;
    const store: ImageStore = {
        put: async (bytes, mime) => {
            const id = `img-${++counter}`;
            files.set(id, {bytes, mime});
            return id;
        },
        uri: (id) => `file:///images/${id}`,
        delete: async (id) => {
            files.delete(id);
        },
    };
    return {store, files};
};

const setup = () => {
    const db = createBetterSqlite3Database();
    runMigrations(db);
    const {store, files} = fakeImageStore();
    const repo = new SqliteCharacterRepository(db, store, () => '2026-01-01T00:00:00.000Z');
    return {db, repo, files};
};

const character = (over: Partial<SaveCharacter> = {}): SaveCharacter => ({
    id: 'c1',
    name: 'Defensor',
    player: 'Phil',
    edition: '6E',
    document: {characterInfo: {characterName: 'Defensor'}, powers: [{xmlid: 'FORCEFIELD'}]},
    ...over,
});

describe('SqliteCharacterRepository (real SQLite)', () => {
    it('round-trips a character: lifted fields + full document', async () => {
        const {repo} = setup();

        await repo.save(character({filename: 'defensor.hsmc'}));
        const got = await repo.get('c1');

        expect(got).toMatchObject({
            id: 'c1',
            name: 'Defensor',
            player: 'Phil',
            edition: '6E',
            isActive: false,
            filename: 'defensor.hsmc',
            portraitUri: null,
            document: {characterInfo: {characterName: 'Defensor'}, powers: [{xmlid: 'FORCEFIELD'}]},
        });
    });

    it('list() returns summaries (no document) sorted by name', async () => {
        const {repo} = setup();
        await repo.save(character({id: 'b', name: 'Zed'}));
        await repo.save(character({id: 'a', name: 'Alpha'}));

        const list = await repo.list();

        expect(list.map((c) => c.name)).toEqual(['Alpha', 'Zed']);
        expect(list[0]).not.toHaveProperty('document');
    });

    describe('portraits', () => {
        it('stores portrait bytes in the image store and exposes a file uri', async () => {
            const {repo, files} = setup();

            await repo.save(character({portrait: {bytes: new Uint8Array([1, 2, 3]), mime: 'image/jpeg'}}));

            expect(files.size).toBe(1);
            expect((await repo.get('c1'))?.portraitUri).toBe('file:///images/img-1');
        });

        it('replacing a portrait deletes the old file', async () => {
            const {repo, files} = setup();
            await repo.save(character({portrait: {bytes: new Uint8Array([1]), mime: 'image/jpeg'}}));

            await repo.save(character({portrait: {bytes: new Uint8Array([2]), mime: 'image/jpeg'}}));

            expect([...files.keys()]).toEqual(['img-2']);
            expect((await repo.get('c1'))?.portraitUri).toBe('file:///images/img-2');
        });

        it('keeps the existing portrait when save omits it, clears it on null', async () => {
            const {repo, files} = setup();
            await repo.save(character({portrait: {bytes: new Uint8Array([1]), mime: 'image/jpeg'}}));

            await repo.save(character({name: 'Renamed'})); // portrait omitted -> keep
            expect((await repo.get('c1'))?.portraitUri).toBe('file:///images/img-1');

            await repo.save(character({portrait: null})); // explicit clear
            expect((await repo.get('c1'))?.portraitUri).toBeNull();
            expect(files.size).toBe(0);
        });

        it('delete removes the row and its portrait file', async () => {
            const {repo, files} = setup();
            await repo.save(character({portrait: {bytes: new Uint8Array([1]), mime: 'image/jpeg'}}));

            await repo.delete('c1');

            expect(await repo.get('c1')).toBeNull();
            expect(files.size).toBe(0);
        });
    });

    describe('active character', () => {
        it('setActive keeps exactly one active character', async () => {
            const {repo} = setup();
            await repo.save(character({id: 'a', name: 'A'}));
            await repo.save(character({id: 'b', name: 'B'}));

            await repo.setActive('a');
            expect((await repo.getActive())?.id).toBe('a');

            await repo.setActive('b');
            expect((await repo.getActive())?.id).toBe('b');
            expect((await repo.list()).filter((c) => c.isActive)).toHaveLength(1);
        });

        it('save does not change a character’s active status', async () => {
            const {repo} = setup();
            await repo.save(character({id: 'a'}));
            await repo.setActive('a');

            await repo.save(character({id: 'a', name: 'Edited'}));

            expect((await repo.getActive())?.name).toBe('Edited');
        });
    });
});
