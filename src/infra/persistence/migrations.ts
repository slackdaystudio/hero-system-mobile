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

/**
 * 005 — record where a character came from, and (when generated) the recipe it came from.
 *
 * Only generated characters are editable: an imported `.hdc` is a faithful view of a file the
 * player owns, and the app has no business rewriting it. The `generated-` id prefix nearly says
 * this already, but an import's id is its sanitised filename, so `generated-brick-1.hdc` would
 * import as a forgery. `origin` is written on every save, so re-importing a real `.hdc` over a
 * generated id correctly flips it back to 'imported' — which the prefix alone gets wrong.
 *
 * The backfill reads the prefix precisely because that *was* the rule until now; characters
 * generated before this migration keep their edit rights.
 */
const migration005: Migration = {
    version: 5,
    up(db) {
        db.execute("ALTER TABLE characters ADD COLUMN origin TEXT NOT NULL DEFAULT 'imported'");
        // JSON, and generated-only — see core/random's CharacterRecipe. Null for imports.
        db.execute('ALTER TABLE characters ADD COLUMN recipe TEXT');
        db.execute("UPDATE characters SET origin = 'generated' WHERE id LIKE 'generated-%'");
    },
};

/**
 * 006 — which part of a portrait to show.
 *
 * Portraits render in a square, and `<Image>`'s default `cover` centre-crops. HERO portraits are
 * artwork, not headshots — composition varies enough that no default is right for all of them, so
 * the player says. Two fractions in 0..1, both defaulting to the centre the app has always used.
 *
 * NULL rather than 0.5: a row that has never been framed is not the same as one deliberately
 * centred, and it means existing characters need no backfill.
 */
const migration006: Migration = {
    version: 6,
    up(db) {
        db.execute('ALTER TABLE characters ADD COLUMN portrait_focus_x REAL');
        db.execute('ALTER TABLE characters ADD COLUMN portrait_focus_y REAL');
    },
};

/**
 * 007 — zoom, alongside the framing offset.
 *
 * Its own migration rather than a line added to 006: 006 has already run on a dev device, and a
 * migration that has run anywhere is history. Editing it would leave that device on schema 6 with
 * no `portrait_focus_scale` column and a query that references it.
 *
 * NULL reads as 1 (cover), so rows framed before zoom existed keep exactly the crop they had.
 */
const migration007: Migration = {
    version: 7,
    up(db) {
        db.execute('ALTER TABLE characters ADD COLUMN portrait_focus_scale REAL');
    },
};

/** All migrations, in ascending version order. */
export const MIGRATIONS: readonly Migration[] = [migration001, migration002, migration003, migration004, migration005, migration006, migration007];

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
