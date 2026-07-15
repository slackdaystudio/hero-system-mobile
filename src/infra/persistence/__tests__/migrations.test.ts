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

import {createBetterSqlite3Database} from '../driver/betterSqlite3Database';
import {MIGRATIONS, runMigrations} from '../migrations';
import type {SqlDatabase} from '../driver/sqlDatabase';

const tables = (db: SqlDatabase): string[] =>
    db.execute("SELECT name FROM sqlite_master WHERE type = 'table' ORDER BY name").rows.map((row) => row.name as string);

describe('migrations (real SQLite)', () => {
    it('applies the base schema and records the version', () => {
        const db = createBetterSqlite3Database();

        expect(runMigrations(db)).toBe(6);

        expect(tables(db)).toEqual(expect.arrayContaining(['app_state', 'characters', 'combat_state', 'random_hero', 'schema_migrations', 'settings', 'statistics']));
        expect(db.execute('SELECT version FROM schema_migrations ORDER BY version').rows).toEqual([{version: 1}, {version: 2}, {version: 3}, {version: 4}, {version: 5}, {version: 6}]);
        // Slots are retired — migration 003 drops the column.
        expect(tables(db)).not.toContain('slot');
        expect(db.execute('PRAGMA table_info(characters)').rows.some((row) => row.name === 'slot')).toBe(false);
    });

    it('is idempotent — re-running applies nothing', () => {
        const db = createBetterSqlite3Database();

        runMigrations(db);
        runMigrations(db);
        runMigrations(db);

        expect(db.execute('SELECT COUNT(*) AS n FROM schema_migrations').rows[0].n).toBe(6);
    });

    it('removes combat state when its character is deleted (ON DELETE CASCADE)', () => {
        const db = createBetterSqlite3Database();
        runMigrations(db);

        db.execute('INSERT INTO characters (id, name, edition, data, updated_at) VALUES (?, ?, ?, ?, ?)', ['a', 'A', '6E', '{}', 't']);
        db.execute('INSERT INTO combat_state (character_id, state) VALUES (?, ?)', ['a', '{}']);

        db.execute('DELETE FROM characters WHERE id = ?', ['a']);

        expect(db.execute('SELECT COUNT(*) AS n FROM combat_state').rows[0].n).toBe(0);
    });

    it('enforces the one-active-character partial unique index', () => {
        const db = createBetterSqlite3Database();
        runMigrations(db);

        const insert = (id: string, active: number) =>
            db.execute('INSERT INTO characters (id, name, edition, is_active, data, updated_at) VALUES (?, ?, ?, ?, ?, ?)', [id, id, '6E', active, '{}', 't']);

        insert('a', 1);
        insert('b', 0); // a second inactive character is fine
        expect(() => insert('c', 1)).toThrow(); // a second active character is rejected
    });

    describe('005 — origin backfill', () => {
        /**
         * The `generated-` id prefix *was* the rule until 005, so characters already on a player's
         * phone have to keep their edit rights. Simulates the pre-005 world: migrate to 004, insert
         * rows the old way, then apply 005.
         */
        const upTo004 = (db: SqlDatabase): void => {
            runMigrations(
                db,
                MIGRATIONS.filter((migration) => migration.version <= 4),
            );
        };

        const origins = (db: SqlDatabase): Array<{id: string; origin: string}> =>
            db.execute('SELECT id, origin FROM characters ORDER BY id').rows.map((row) => ({id: row.id as string, origin: row.origin as string}));

        it('keeps edit rights for characters generated before 005, and only those', () => {
            const db = createBetterSqlite3Database();
            upTo004(db);

            for (const id of ['generated-brick-1', 'defensor', 'tazimmaad']) {
                db.execute('INSERT INTO characters (id, name, edition, data, updated_at) VALUES (?, ?, ?, ?, ?)', [id, id, '5E', '{}', 't']);
            }

            runMigrations(db);

            expect(origins(db)).toEqual([
                {id: 'defensor', origin: 'imported'},
                {id: 'generated-brick-1', origin: 'generated'},
                {id: 'tazimmaad', origin: 'imported'},
            ]);
        });

        it('defaults an existing row to imported — an HD character is never editable by default', () => {
            const db = createBetterSqlite3Database();
            upTo004(db);
            db.execute('INSERT INTO characters (id, name, edition, data, updated_at) VALUES (?, ?, ?, ?, ?)', ['x', 'X', '5E', '{}', 't']);

            runMigrations(db);

            expect(db.execute('SELECT origin, recipe FROM characters').rows[0]).toEqual({origin: 'imported', recipe: null});
        });
    });
});
