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

import type {SqlDatabase} from './driver/sqlDatabase';

export interface Migration {
    version: number;
    up(db: SqlDatabase): void;
}

/** 001 — the base schema (see docs/PERSISTENCE.md). */
const migration001: Migration = {
    version: 1,
    up(db) {
        db.execute(`
            CREATE TABLE characters (
                id           TEXT PRIMARY KEY,
                name         TEXT NOT NULL,
                player       TEXT,
                edition      TEXT NOT NULL,
                slot         INTEGER,
                is_active    INTEGER NOT NULL DEFAULT 0,
                portrait_id  TEXT,
                filename     TEXT,
                data         TEXT NOT NULL,
                updated_at   TEXT NOT NULL
            )
        `);
        // At most one character per slot, and at most one active character —
        // enforced by the DB rather than hand-rolled bookkeeping.
        db.execute('CREATE UNIQUE INDEX ux_characters_slot ON characters(slot) WHERE slot IS NOT NULL');
        db.execute('CREATE UNIQUE INDEX ux_characters_active ON characters(is_active) WHERE is_active = 1');

        db.execute('CREATE TABLE settings (key TEXT PRIMARY KEY, value TEXT NOT NULL)');
        db.execute('CREATE TABLE statistics (id INTEGER PRIMARY KEY CHECK (id = 1), stats TEXT NOT NULL)');
        db.execute('CREATE TABLE random_hero (id INTEGER PRIMARY KEY CHECK (id = 1), data TEXT NOT NULL)');
        db.execute('CREATE TABLE app_state (key TEXT PRIMARY KEY, value TEXT NOT NULL)');
    },
};

/** 002 — live combat state per character (see combatTracker). */
const migration002: Migration = {
    version: 2,
    up(db) {
        db.execute(`
            CREATE TABLE combat_state (
                character_id TEXT PRIMARY KEY REFERENCES characters(id) ON DELETE CASCADE,
                state        TEXT NOT NULL
            )
        `);
    },
};

/** 003 — retire character slots (the library + active pointer replaced the slot loadout). */
const migration003: Migration = {
    version: 3,
    up(db) {
        db.execute('DROP INDEX IF EXISTS ux_characters_slot');
        db.execute('ALTER TABLE characters DROP COLUMN slot');
    },
};

/** 004 — track last-access time so Home can show recently opened characters. */
const migration004: Migration = {
    version: 4,
    up(db) {
        db.execute('ALTER TABLE characters ADD COLUMN accessed_at TEXT');
    },
};

/** All migrations, in ascending version order. */
export const MIGRATIONS: readonly Migration[] = [migration001, migration002, migration003, migration004];

/**
 * Apply every migration newer than the recorded schema version, each in its own
 * transaction. Idempotent: re-running applies nothing. Returns the resulting
 * schema version.
 */
export function runMigrations(db: SqlDatabase, migrations: readonly Migration[] = MIGRATIONS, now: () => string = () => new Date().toISOString()): number {
    db.execute('CREATE TABLE IF NOT EXISTS schema_migrations (version INTEGER PRIMARY KEY, applied_at TEXT NOT NULL)');

    const current = (db.execute('SELECT MAX(version) AS version FROM schema_migrations').rows[0]?.version as number | null) ?? 0;

    let version = current;

    for (const migration of [...migrations].sort((a, b) => a.version - b.version)) {
        if (migration.version <= current) {
            continue;
        }

        db.transaction(() => {
            migration.up(db);
            db.execute('INSERT INTO schema_migrations (version, applied_at) VALUES (?, ?)', [migration.version, now()]);
        });

        version = migration.version;
    }

    return version;
}
