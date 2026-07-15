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

    describe('recent + markAccessed', () => {
        // A repo with a controllable clock so save/access timestamps are distinct.
        const clockedRepo = () => {
            const db = createBetterSqlite3Database();
            runMigrations(db);
            const {store} = fakeImageStore();
            let tick = 0;
            const repo = new SqliteCharacterRepository(db, store, () => `2026-01-01T00:00:${String(tick).padStart(2, '0')}.000Z`);
            return {repo, at: (t: number) => (tick = t)};
        };

        it('orders by last-accessed, then most-recently-updated, and respects the limit', async () => {
            const {repo, at} = clockedRepo();
            at(1);
            await repo.save(character({id: 'a', name: 'Alpha'}));
            at(2);
            await repo.save(character({id: 'b', name: 'Beta'}));
            at(3);
            await repo.save(character({id: 'c', name: 'Gamma'}));

            // Nothing accessed yet → newest-updated first.
            expect((await repo.recent(2)).map((c) => c.name)).toEqual(['Gamma', 'Beta']);

            at(9);
            await repo.markAccessed('a'); // Alpha just opened
            expect((await repo.recent(3)).map((c) => c.name)).toEqual(['Alpha', 'Gamma', 'Beta']);
        });

        it('drops a deleted character from the recent list automatically', async () => {
            const {repo} = clockedRepo();
            await repo.save(character({id: 'a', name: 'Alpha'}));
            await repo.markAccessed('a');
            await repo.delete('a');

            expect(await repo.recent()).toEqual([]);
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

    /**
     * Only a generated character is editable, so `origin` decides whether the app may rewrite a
     * row. The `generated-` id prefix nearly says this already — these pin the cases where it and
     * the column disagree.
     */
    describe('origin + recipe', () => {
        it('round-trips a generated character with its recipe', async () => {
            const {repo} = setup();
            const recipe = {archetype: 'Brick', profession: 'Soldier', specialFx: 'Fire'};

            await repo.save(character({id: 'generated-brick-1', origin: 'generated', recipe}));

            const saved = await repo.get('generated-brick-1');
            expect(saved?.origin).toBe('generated');
            expect(saved?.recipe).toEqual(recipe);
        });

        it('defaults a new row to imported — nothing is editable by accident', async () => {
            const {repo} = setup();

            await repo.save(character());

            const saved = await repo.get('c1');
            expect(saved?.origin).toBe('imported');
            expect(saved?.recipe).toBeNull();
        });

        it('keeps origin and recipe when a save omits them, so a rename cannot strip edit rights', async () => {
            const {repo} = setup();
            const recipe = {archetype: 'Brick'};
            await repo.save(character({id: 'g1', origin: 'generated', recipe}));

            // What renaming looks like: same row, new name, provenance not restated.
            await repo.save(character({id: 'g1', name: 'Ember'}));

            const saved = await repo.get('g1');
            expect(saved?.name).toBe('Ember');
            expect(saved?.origin).toBe('generated');
            expect(saved?.recipe).toEqual(recipe);
        });

        it('demotes to imported when a real .hdc lands on a generated id', async () => {
            const {repo} = setup();
            await repo.save(character({id: 'generated-brick-1', origin: 'generated', recipe: {archetype: 'Brick'}}));

            // An import of `generated-brick-1.hdc` — the id prefix still says "generated", but this
            // is the player's own file now and must not be rewritable.
            await repo.save(character({id: 'generated-brick-1', name: 'Real Character', origin: 'imported', recipe: null}));

            const saved = await repo.get('generated-brick-1');
            expect(saved?.origin).toBe('imported');
            expect(saved?.recipe).toBeNull();
        });
    });

    /**
     * Framing is two numbers and nothing else — the portrait bytes are never touched, so it is
     * always reversible and can never cost anyone their image.
     */
    describe('portrait framing', () => {
        it('starts unframed, which reads as the centre crop it always had', async () => {
            const {repo} = setup();
            await repo.save(character());

            expect((await repo.get('c1'))?.portraitFocus).toBeNull();
        });

        it('round-trips a focus, and lifts it onto the list and recent rows', async () => {
            const {repo} = setup();
            await repo.save(character());

            await repo.setPortraitFocus('c1', {x: 0.5, y: 0.2});

            // The sheet, the list and Home all draw portraits — framing that only reached `get`
            // would look broken on every other screen.
            expect((await repo.get('c1'))?.portraitFocus).toEqual({x: 0.5, y: 0.2});
            expect((await repo.list())[0].portraitFocus).toEqual({x: 0.5, y: 0.2});
            expect((await repo.recent())[0].portraitFocus).toEqual({x: 0.5, y: 0.2});
        });

        it('resets to unframed on null', async () => {
            const {repo} = setup();
            await repo.save(character());
            await repo.setPortraitFocus('c1', {x: 0.5, y: 0.2});

            await repo.setPortraitFocus('c1', null);

            expect((await repo.get('c1'))?.portraitFocus).toBeNull();
        });

        it('survives a re-save — framing is not part of the document', async () => {
            const {repo} = setup();
            await repo.save(character());
            await repo.setPortraitFocus('c1', {x: 0.5, y: 0.2});

            // Re-importing the same .hdc, or any other full save, must not un-frame it.
            await repo.save(character({name: 'Defensor Reloaded'}));

            expect((await repo.get('c1'))?.portraitFocus).toEqual({x: 0.5, y: 0.2});
        });
    });
});
