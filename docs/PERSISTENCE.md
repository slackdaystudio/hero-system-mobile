# Persistence & Storage Design (Phase 2)

> Design spec for the rebuild's data layer (`infra/persistence`, `infra/files`,
> and the `core/ports` repository interfaces). Written after auditing the legacy
> `Persistence.js`, the partial `src/database/` SQLite migration, `File.js`, and
> the character/settings/statistics reducers. Companion to `REBUILD_PLAN.md`.

## The problem we're solving

In the legacy app a single character exists in **three places at once**:

1. **AsyncStorage** — `character` (active) and `characters` (a 5-slot map), each a
   full character JSON **with the base64 portrait embedded**.
2. **SQLite `hsm.db`** — a *partial* migration: `settings` (columns) and
   `statistics` (a JSON blob), both keyed by a vestigial `loadout`.
3. **Filesystem** — `DocumentDirectory/character/*.hsmc`, a zip of the character JSON.

Five base64 portraits stuffed into one AsyncStorage key is what blows Android's
~6 MB `AsyncStorage` cap. The deeper problems: **binary data stored as base64 in a
key/value store**, and **no single source of truth** (three copies that drift —
`updateLoadedCharacters` exists solely to fight that drift).

## Resolved decisions

| # | Decision | Choice |
|---|---|---|
| 1 | Image storage | **Files on disk**, referenced by id (not SQLite BLOBs) |
| 2 | SQLite driver | **op-sqlite** (JSI, fast, reads the existing `hsm.db` file format) |
| 3 | `loadout` key | **Dropped.** Settings + statistics are single global rows |
| 4 | Edition (5E/6E) | **Per character, derived** from the `.hdc` via `isFifth()`, cached on the row. Global `useFifthEdition` becomes the default only for character-less dice rolls |
| 5 | Statistics | **Global** (one aggregate set), as today |
| 6 | `.hsmc` zip | **Export/interchange only.** SQLite is the runtime source of truth |
| 7 | Settings storage shape | **Key/value table** behind a typed facade (adding a setting needs no schema migration) — *assumed default, easy to flip to columnar* |
| 8 | Migration source of truth | **`.hsmc` files on disk** are authoritative for characters; AsyncStorage only supplies slot/active pointers — *assumed default* |

## Target topology — one source of truth per data kind

| Data | Legacy home | Target home |
|---|---|---|
| Character document (79-trait HD object) | AsyncStorage ×2 + `.hsmc` | **SQLite** row, document in a TEXT column |
| Portrait bytes | base64 inside that JSON | **File on disk**, referenced by `portrait_id` |
| Character edition | global `useFifthEdition` toggle | **`edition` column** on the character row (derived) |
| Settings | SQLite columns (per loadout) | SQLite key/value (global) |
| Statistics | SQLite JSON blob (per loadout) | SQLite JSON blob (global, single row) |
| Random hero | AsyncStorage `hero` | SQLite row |
| Version / misc | AsyncStorage | SQLite `app_state` KV |

Net effect: **AsyncStorage is not used at runtime.** It is read exactly once, by
the one-time migration, then its keys are cleared. Records live in SQLite; bytes
live on the filesystem.

## Core ports (`core/ports`) — interfaces only, domain-typed

The domain and UI depend on these interfaces, never on a raw `db` handle. This is
what dissolves the legacy `File ⇄ Persistence ⇄ Statistics ⇄ Character` cycle and
ends the "thread `db` through every method" pattern.

```ts
interface CharacterRepository {
    list(): Promise<CharacterSummary[]>;      // name, edition, portraitUri, slot, isActive
    get(id: string): Promise<Character | null>;
    save(character: Character): Promise<void>; // upserts; writes portrait via ImageStore
    delete(id: string): Promise<void>;         // also deletes the portrait file
    setActive(id: string): Promise<void>;
    getActive(): Promise<Character | null>;
    slots(): Promise<Array<CharacterSummary | null>>;
}

interface SettingsRepository {
    get(): Promise<Settings>;
    set<K extends keyof Settings>(key: K, value: Settings[K]): Promise<void>;
    reset(): Promise<void>;
}

interface StatisticsRepository {         // the dice slice's StatisticsSink writes through this
    get(): Promise<Statistics>;
    add(roll: RollResult): Promise<Statistics>;
    reset(): Promise<void>;
}

interface RandomHeroRepository {
    get(): Promise<RandomHero | null>;
    set(hero: RandomHero): Promise<void>;
    rename(name: string): Promise<void>;
    clear(): Promise<void>;
}

interface ImageStore {
    put(bytes: Uint8Array, mime: string): Promise<string>; // returns imageId
    uri(imageId: string): string;                          // file:// uri for <Image>
    delete(imageId: string): Promise<void>;
}

interface AppStateStore {                // version, migration flags, misc scalars
    get(key: string): Promise<string | null>;
    set(key: string, value: string): Promise<void>;
}
```

## SQLite schema

```sql
schema_migrations(version INTEGER PRIMARY KEY, applied_at TEXT NOT NULL);

characters(
  id           TEXT PRIMARY KEY,        -- uuid
  name         TEXT NOT NULL,           -- denormalized for the list screen
  player       TEXT,                    -- denormalized (sort/filter)
  edition      TEXT NOT NULL,           -- '5E' | '6E', derived at import via isFifth()
  slot         INTEGER,                 -- 0..4, NULL = stored but unslotted
  is_active    INTEGER NOT NULL DEFAULT 0,
  portrait_id  TEXT,                    -- ImageStore id, NULL if no portrait
  filename     TEXT,                    -- .hsmc export name
  data         TEXT NOT NULL,           -- full HD document JSON, portrait bytes stripped
  updated_at   TEXT NOT NULL
);
CREATE UNIQUE INDEX ux_characters_slot ON characters(slot) WHERE slot IS NOT NULL;
CREATE UNIQUE INDEX ux_characters_active ON characters(is_active) WHERE is_active = 1;

settings(key TEXT PRIMARY KEY, value TEXT NOT NULL);          -- global, k/v
statistics(id INTEGER PRIMARY KEY CHECK (id = 1), stats TEXT NOT NULL);  -- global, single row
random_hero(id INTEGER PRIMARY KEY CHECK (id = 1), data TEXT NOT NULL);
app_state(key TEXT PRIMARY KEY, value TEXT NOT NULL);

-- migration 002: live combat state per character (health/CVs/phase chart, JSON)
combat_state(
  character_id TEXT PRIMARY KEY REFERENCES characters(id) ON DELETE CASCADE,
  state        TEXT NOT NULL            -- CombatState JSON (see core/combat/combatTracker)
);
```

Notes:
- The 79-trait HD object stays a **document** in `characters.data` — we do not shred
  it into relational tables. Only the handful of columns the list/sort/rules need
  are lifted out (`name`, `player`, `edition`, `slot`, `is_active`, `portrait_id`).
- The partial unique indexes enforce "one character per slot" and "at most one
  active character" at the DB level, replacing legacy hand-rolled bookkeeping.

### Migrations framework

A tiny forward-only runner: an ordered list of `{version, up(db)}` steps; on
startup, apply every step whose `version` exceeds the max in `schema_migrations`,
each inside a transaction, recording the version on success. `migration 001`
creates the base tables above; `migration 002` adds the `combat_state` table.
(The one-time **user data import** below is a separate step guarded by a
`migrated_v1` flag in `app_state`, not a numbered schema migration.) Future
schema changes are just new numbered steps.

## Image store (`infra/files`)

- Portrait bytes are written to `DocumentDirectory/images/<uuid>.<ext>`;
  `portrait_id` on the character row holds `<uuid>.<ext>`.
- `ImageStore.uri(id)` returns `file://…/images/<id>`, which RN `<Image>` renders
  directly — **no base64, no decode-on-render memory spike**.
- Ownership is simple: delete a character → delete its portrait file. No
  refcounting/content-addressing (5 slots doesn't justify the complexity).
- **Save is transaction-safe:** write the image file first, then upsert the row
  inside a DB transaction. A failed save can orphan an image file; a cheap startup
  sweep deletes `images/*` files with no referencing `portrait_id`.

## Edition handling (behavior fix)

Edition is computed once, at import, from the character document (the existing
`isFifth()` logic) and stored in `characters.edition`. The rules engine and dice
screens read edition from the **active character** when one is loaded:

```ts
const edition = activeCharacter?.edition ?? (settings.useFifthEdition ? '5E' : '6E');
// damageForm.useFifthEdition = edition === '5E'
```

This fixes a latent legacy bug: today a loaded 5E character can still be rolled as
6E (and vice versa) because a single global toggle governs the roll regardless of
which character is active. The global `useFifthEdition` setting is retained purely
as the default for the standalone dice screens, where no character is loaded.

## Connection & wiring

Replace `DatabaseContext`/`useDatabase` (which opens the DB in a React effect and
hands the raw `db` to every caller). Instead, at the **composition root** on
startup:

1. Open the op-sqlite connection once (pointed at the existing `hsm.db` path so the
   partial-migration data is preserved).
2. Run migrations.
3. Construct the infra repositories over that connection + `ImageStore`.
4. Provide the **repositories** (not the `db`) to the app (RTK thunks / a small
   provider).

UI/domain call `characterRepository.save(c)`, never `persistence.saveCharacter(db, …)`.

## `.hsmc` export / import (interchange only)

- Format is unchanged: a zip of the character JSON, so **old `.hsmc` files still
  import**.
- **Export** re-embeds the portrait: read the image file → base64 → inline into the
  document → zip. A shared `.hsmc` stays self-contained.
- **Import** does the inverse: parse → lift the portrait out to the `ImageStore` →
  strip from the document → insert the row (deriving `edition`).

## User data migration (`migration 002`, one-time, idempotent)

Same bundle id → existing installs carry old data. Guarded by a `migrated_v1` flag
in `app_state`; safe to re-run.

1. **Characters — primary source is the `.hsmc` files on disk** (they survive
   AsyncStorage wipes). For each: unzip → parse → lift portrait → write image file →
   strip → derive edition → insert row. AsyncStorage `character`/`characters` are
   read *only* to recover which `.hsmc` was in which slot and which was active.
2. **Settings / statistics** — if an old `hsm.db` exists (partial-migration users),
   copy its rows in, dropping `loadout`; else read old AsyncStorage
   `appSettings`/`statistics`; else defaults.
3. **Random hero / version** — copy from AsyncStorage.
4. Set `migrated_v1`, then clear the old AsyncStorage keys.

## Testing strategy

- **Repository contract tests** run the real op-sqlite adapters against an
  in-memory / temp-file DB (in the `app`/`infra` Jest project), asserting CRUD,
  the slot/active uniqueness constraints, and settings/stats round-trips.
- **Migration golden test:** hand-built fixtures (a fake AsyncStorage dump + a set
  of `.hsmc` files, including one with a portrait and one 5E + one 6E character) →
  run `migration 002` → assert the resulting rows, `edition` values, and extracted
  image files. This is the safety net for existing users' data.
- **ImageStore test:** put/uri/delete + the orphan-sweep.

## Dependencies to add / change

- `+ op-sqlite` (replaces `react-native-sqlite-storage`).
- Reuse existing `react-native-fs` + `react-native-zip-archive` for image files and
  `.hsmc`; keep `buffer`/`iconv-lite` only on the `.hdc` import path.
- `- @react-native-async-storage/async-storage` at runtime — retained transitively
  only for the one-time migration read, then removable in a later release.

## Open / minor decisions

- **#7 settings shape** (k/v vs columnar) — defaulted to k/v; flip if you'd rather
  have typed columns.
- **#8 migration authority** (`.hsmc` on disk) — assumes every character always has
  a `.hsmc`, which legacy `saveCharacter` guarantees. Confirm before implementation.
