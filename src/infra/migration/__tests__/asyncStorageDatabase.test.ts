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

import {createBetterSqlite3Database} from '../../persistence/driver/betterSqlite3Database';
import type {SqlDatabase} from '../../persistence/driver/sqlDatabase';
import {openAsyncStorageDatabase, withDatabaseFallback, type OpenDatabase} from '../asyncStorageDatabase';
import type {LegacyKeyValueStore} from '../legacySourceImpl';

// The exact shape Android reports when a row exceeds the 2 MB CursorWindow; the
// native module passes the message straight through (AsyncStorageModule.multiGet).
const CURSOR_WINDOW_ERROR = new Error('Row too big to fit into CursorWindow requiredPos=0, totalRows=1');

/** A real SQLite file in the shape AsyncStorage stores on Android. */
const storageDb = (table: string, rows: Record<string, string>): SqlDatabase => {
    const db = createBetterSqlite3Database();
    db.execute(`CREATE TABLE "${table}" (key TEXT PRIMARY KEY, value TEXT NOT NULL)`);
    for (const [key, value] of Object.entries(rows)) {
        db.execute(`INSERT INTO "${table}" VALUES (?, ?)`, [key, value]);
    }
    return db;
};

/** `open` over a fixed set of database files, counting opens and closes. */
const opener = (files: Record<string, SqlDatabase>) => {
    const opened: string[] = [];
    const closed: string[] = [];

    const open: OpenDatabase = (name) => {
        opened.push(name);
        const db = files[name];
        if (db === undefined) {
            // op-sqlite creates an empty file for an unknown name; model that.
            const empty = createBetterSqlite3Database();
            return {...empty, close: () => closed.push(name)};
        }
        return {...db, close: () => closed.push(name)};
    };

    return {open, opened, closed};
};

const throwingStore = (error: Error): LegacyKeyValueStore => ({
    getItem: () => Promise.reject(error),
    multiRemove: () => Promise.resolve(),
});

describe('openAsyncStorageDatabase', () => {
    it('reads a value straight out of the classic RKStorage database', () => {
        const {open} = opener({RKStorage: storageDb('catalystLocalStorage', {characters: '{"0":{"filename":"defensor.hsmc"}}'})});

        expect(openAsyncStorageDatabase(open).getItem('characters')).toBe('{"0":{"filename":"defensor.hsmc"}}');
    });

    it('falls through to the next-storage Room database when RKStorage has no table', () => {
        const {open, opened, closed} = opener({
            RKStorage: createBetterSqlite3Database(), // the file exists but was never populated
            AsyncStorage: storageDb('Storage', {version: '2.1.13'}),
        });

        expect(openAsyncStorageDatabase(open).getItem('version')).toBe('2.1.13');
        expect(opened).toEqual(['RKStorage', 'AsyncStorage']);
        expect(closed).toEqual(['RKStorage']); // the empty candidate is not left open
    });

    it('returns null for a key it does not hold, and when no database has the table', () => {
        const present = openAsyncStorageDatabase(opener({RKStorage: storageDb('catalystLocalStorage', {version: '2.1.13'})}).open);
        expect(present.getItem('characters')).toBeNull();

        expect(openAsyncStorageDatabase(opener({}).open).getItem('characters')).toBeNull();
    });

    it('opens the file once across many reads, and closes what it opened', () => {
        const {open, opened, closed} = opener({RKStorage: storageDb('catalystLocalStorage', {a: '1', b: '2'})});
        const db = openAsyncStorageDatabase(open);

        expect([db.getItem('a'), db.getItem('b'), db.getItem('c')]).toEqual(['1', '2', null]);
        expect(opened).toEqual(['RKStorage']);

        db.close();
        expect(closed).toEqual(['RKStorage']);
    });
});

describe('withDatabaseFallback', () => {
    it('recovers a value too big for the CursorWindow by reading the database directly', async () => {
        // The real shape of the bug: five characters with base64 portraits inlined.
        const oversized = JSON.stringify({'0': {filename: 'defensor.hsmc', portrait: 'data:image/png;base64,AAAA'}});
        const {open} = opener({RKStorage: storageDb('catalystLocalStorage', {characters: oversized})});

        const store = withDatabaseFallback(throwingStore(CURSOR_WINDOW_ERROR), open);

        await expect(store.getItem('characters')).resolves.toBe(oversized);
    });

    it('rethrows the original failure when the database cannot supply the key either', async () => {
        const store = withDatabaseFallback(throwingStore(CURSOR_WINDOW_ERROR), opener({}).open);

        // Never swallow: migrateV1 must not stamp itself done over a key it never read.
        await expect(store.getItem('characters')).rejects.toThrow('Row too big to fit into CursorWindow');
    });

    it('never touches the database while the native module is working', async () => {
        const {open, opened} = opener({RKStorage: storageDb('catalystLocalStorage', {version: '9.9.9'})});
        const primary: LegacyKeyValueStore = {getItem: async (key) => (key === 'version' ? '2.1.13' : null), multiRemove: async () => {}};

        const store = withDatabaseFallback(primary, open);

        await expect(store.getItem('version')).resolves.toBe('2.1.13');
        expect(opened).toEqual([]);

        store.close(); // nothing opened, nothing to close
        expect(opened).toEqual([]);
    });

    it('opens the fallback once across repeated failures and closes it', async () => {
        const {open, opened, closed} = opener({RKStorage: storageDb('catalystLocalStorage', {a: '1', b: '2'})});
        const store = withDatabaseFallback(throwingStore(CURSOR_WINDOW_ERROR), open);

        await store.getItem('a');
        await store.getItem('b');
        expect(opened).toEqual(['RKStorage']);

        store.close();
        expect(closed).toEqual(['RKStorage']);
    });

    it('passes multiRemove through untouched', async () => {
        const removed: string[][] = [];
        const primary: LegacyKeyValueStore = {
            getItem: async () => null,
            multiRemove: async (keys) => {
                removed.push(keys);
            },
        };

        await withDatabaseFallback(primary, opener({}).open).multiRemove(['characters', 'character']);

        expect(removed).toEqual([['characters', 'character']]);
    });
});
