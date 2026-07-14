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
 * The SQLite driver seam. Repositories, the schema, and migrations are written
 * against this interface, never against a concrete SQLite library. Two adapters
 * implement it with identical SQL:
 *  - `op-sqlite` (JSI, synchronous) in the app;
 *  - `better-sqlite3` in node, so the whole data layer is exercised against real
 *    SQLite in tests (real constraints, real transactions) without a native RN runtime.
 *
 * Execution is synchronous: op-sqlite's JSI path and better-sqlite3 are both sync,
 * and it keeps the SQL layer free of async plumbing. (File I/O — the async part —
 * lives in the ImageStore, above this seam.)
 */

/** One database column value. */
export type SqlValue = string | number | null | Uint8Array;

/** A returned row, keyed by column name. */
export type SqlRow = Record<string, SqlValue>;

export interface SqlResult {
    rows: SqlRow[];
    /** Rows changed by an INSERT/UPDATE/DELETE (0 for reads). */
    rowsAffected: number;
    /** rowid of the last INSERT, when applicable. */
    insertId?: number;
}

export interface SqlDatabase {
    /** Run one statement with positional (`?`) parameters. */
    execute(sql: string, params?: ReadonlyArray<SqlValue>): SqlResult;
    /** Run `work` inside a transaction; commits on return, rolls back if it throws. */
    transaction<T>(work: () => T): T;
    close(): void;
}
