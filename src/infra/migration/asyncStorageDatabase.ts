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

import type {SqlDatabase} from '../persistence/driver/sqlDatabase';
import type {LegacyKeyValueStore} from './legacySourceImpl';

/** Opens a SQLite file by name from the platform database directory; null when unopenable. */
export type OpenDatabase = (name: string) => SqlDatabase | null;

/**
 * The two shapes `@react-native-async-storage/async-storage` has stored on Android.
 * The classic backend is `RKStorage`/`catalystLocalStorage`; the opt-in
 * `AsyncStorage_useNextStorage` backend copies it into a Room database with the
 * same two columns under a different file and table name.
 */
const STORES = [
    {database: 'RKStorage', table: 'catalystLocalStorage'},
    {database: 'AsyncStorage', table: 'Storage'},
] as const;

/** A direct, read-only view of AsyncStorage's own database. */
export interface AsyncStorageDatabase {
    getItem(key: string): string | null;
    close(): void;
}

const hasTable = (db: SqlDatabase, table: string): boolean => {
    try {
        return db.execute('SELECT name FROM sqlite_master WHERE type = ? AND name = ?', ['table', table]).rows.length > 0;
    } catch {
        return false;
    }
};

/**
 * Reads AsyncStorage's SQLite file directly, sidestepping the native module.
 *
 * Android hands a query's rows back through a `CursorWindow` capped at 2 MB, so
 * `AsyncStorage.getItem` cannot return a value larger than that — it fails with
 * "Row too big to fit into CursorWindow". The legacy app stored whole characters
 * with their base64 portraits inlined under the `characters` key, which clears
 * 2 MB easily. op-sqlite's JSI path has no window, so the same row reads fine.
 *
 * Read-only, opened lazily on first use: a device whose AsyncStorage is healthy
 * never touches the file.
 */
export function openAsyncStorageDatabase(open: OpenDatabase): AsyncStorageDatabase {
    let store: {db: SqlDatabase; table: string} | null = null;
    let resolved = false;

    const resolve = (): typeof store => {
        if (resolved) {
            return store;
        }
        resolved = true;

        for (const {database, table} of STORES) {
            const db = open(database);
            if (db === null) {
                continue;
            }
            if (hasTable(db, table)) {
                store = {db, table};
                break;
            }
            db.close();
        }

        return store;
    };

    return {
        getItem: (key) => {
            const opened = resolve();
            if (opened === null) {
                return null;
            }

            try {
                // The table name is one of our own constants, never user input.
                const value = opened.db.execute(`SELECT value FROM "${opened.table}" WHERE key = ?`, [key]).rows[0]?.value;
                return typeof value === 'string' ? value : null;
            } catch {
                return null;
            }
        },
        close: () => {
            store?.db.close();
            store = null;
            resolved = true;
        },
    };
}

/** {@link LegacyKeyValueStore} plus the handle the database fallback may have opened. */
export interface LegacyKeyValueSource extends LegacyKeyValueStore {
    close(): void;
}

/**
 * Wraps a {@link LegacyKeyValueStore} so a read the native module cannot satisfy
 * falls back to {@link openAsyncStorageDatabase}. The original error is rethrown
 * when the database has nothing either — recovering the value is this layer's only
 * job, and deciding what a lost key costs belongs to the caller (`readKey`).
 */
export function withDatabaseFallback(primary: LegacyKeyValueStore, open: OpenDatabase): LegacyKeyValueSource {
    let fallback: AsyncStorageDatabase | null = null;

    return {
        getItem: async (key) => {
            try {
                return await primary.getItem(key);
            } catch (error) {
                fallback = fallback ?? openAsyncStorageDatabase(open);

                const value = fallback.getItem(key);
                if (value === null) {
                    throw error;
                }

                return value;
            }
        },
        multiRemove: (keys) => primary.multiRemove(keys),
        close: () => {
            fallback?.close();
            fallback = null;
        },
    };
}
