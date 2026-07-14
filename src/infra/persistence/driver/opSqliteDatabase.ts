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

import {open, type DB, type Scalar} from '@op-engineering/op-sqlite';
import type {SqlDatabase, SqlResult, SqlRow, SqlValue} from './sqlDatabase';

export interface OpSqliteOptions {
    /** DB file name. Deliberately NOT `hsm.db` — that is the legacy file we read only during migration. */
    name: string;
    location?: string;
}

/**
 * `SqlDatabase` backed by op-sqlite — the on-device driver (JSI, synchronous).
 * Runs the exact SQL the node tests exercise against better-sqlite3. op-sqlite's
 * own `transaction` is async, so synchronous transactions are done here with
 * explicit BEGIN/COMMIT/ROLLBACK to satisfy the sync {@link SqlDatabase} port.
 */
export const createOpSqliteDatabase = (options: OpSqliteOptions): SqlDatabase => {
    const db: DB = open(options);
    db.executeSync('PRAGMA foreign_keys = ON');

    const execute = (sql: string, params: ReadonlyArray<SqlValue> = []): SqlResult => {
        const result = db.executeSync(sql, [...params] as Scalar[]);

        return {
            rows: (result.rows ?? []) as unknown as SqlRow[],
            rowsAffected: result.rowsAffected ?? 0,
            insertId: result.insertId,
        };
    };

    return {
        execute,
        transaction: <T>(work: () => T): T => {
            db.executeSync('BEGIN');
            try {
                const result = work();
                db.executeSync('COMMIT');
                return result;
            } catch (error) {
                db.executeSync('ROLLBACK');
                throw error;
            }
        },
        close: () => db.close(),
    };
};
