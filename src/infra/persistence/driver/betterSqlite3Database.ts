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

import Database from 'better-sqlite3';
import type {SqlDatabase, SqlResult, SqlValue} from './sqlDatabase';

/**
 * `SqlDatabase` backed by better-sqlite3 — a real, embedded, synchronous SQLite
 * for node. Used in tests (and any node tooling) so the data layer runs against
 * genuine SQLite semantics. The app uses the op-sqlite adapter over the same SQL.
 */
export const createBetterSqlite3Database = (filename = ':memory:'): SqlDatabase => {
    const db = new Database(filename);
    db.pragma('foreign_keys = ON');

    const execute = (sql: string, params: ReadonlyArray<SqlValue> = []): SqlResult => {
        const statement = db.prepare(sql);

        if (statement.reader) {
            return {rows: statement.all(...(params as SqlValue[])) as SqlResult['rows'], rowsAffected: 0};
        }

        const info = statement.run(...(params as SqlValue[]));

        return {rows: [], rowsAffected: info.changes, insertId: Number(info.lastInsertRowid)};
    };

    return {
        execute,
        transaction: <T>(work: () => T): T => db.transaction(work)(),
        close: () => db.close(),
    };
};
