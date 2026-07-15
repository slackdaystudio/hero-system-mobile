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

import type {Character, CharacterOrigin, CharacterRepository, CharacterSummary, ImageStore, PortraitFocus, SaveCharacter, StoredRecipe} from 'core/ports';
import type {SqlDatabase, SqlRow} from './driver/sqlDatabase';

const SUMMARY_COLUMNS = 'id, name, player, edition, is_active, portrait_id, portrait_focus_x, portrait_focus_y';

/**
 * Characters in SQLite: one row each, the HD document as a JSON `data` column
 * with the list/rules fields lifted into their own columns. `list()` reads only
 * the lifted columns — the document is never parsed for the list screen (the
 * performance fix). Portrait bytes live in the {@link ImageStore}, referenced by
 * `portrait_id`, and never bloat the row.
 */
export class SqliteCharacterRepository implements CharacterRepository {
    constructor(
        private readonly db: SqlDatabase,
        private readonly imageStore: ImageStore,
        private readonly now: () => string = () => new Date().toISOString(),
    ) {}

    async list(): Promise<CharacterSummary[]> {
        const {rows} = this.db.execute(`SELECT ${SUMMARY_COLUMNS} FROM characters ORDER BY name`);

        return rows.map((row) => this.toSummary(row));
    }

    async get(id: string): Promise<Character | null> {
        const {rows} = this.db.execute('SELECT * FROM characters WHERE id = ?', [id]);

        return rows.length > 0 ? this.toCharacter(rows[0]) : null;
    }

    async getActive(): Promise<Character | null> {
        const {rows} = this.db.execute('SELECT * FROM characters WHERE is_active = 1');

        return rows.length > 0 ? this.toCharacter(rows[0]) : null;
    }

    async markAccessed(id: string): Promise<void> {
        this.db.execute('UPDATE characters SET accessed_at = ? WHERE id = ?', [this.now(), id]);
    }

    async recent(limit = 4): Promise<CharacterSummary[]> {
        // Recently accessed first (NULLs sort last under DESC), then recently
        // updated — so the list is populated even before anything is opened.
        const {rows} = this.db.execute(`SELECT ${SUMMARY_COLUMNS} FROM characters ORDER BY accessed_at DESC, updated_at DESC LIMIT ?`, [limit]);

        return rows.map((row) => this.toSummary(row));
    }

    async save(character: SaveCharacter): Promise<void> {
        const existing = this.db.execute('SELECT portrait_id, is_active, origin, recipe FROM characters WHERE id = ?', [character.id]).rows[0];
        const existingPortraitId = (existing?.portrait_id as string | null) ?? null;
        const existingIsActive = existing ? (existing.is_active as number) : 0;

        // Provenance and recipe resolve like the portrait does: absent keeps what's there. A new
        // row is 'imported' unless told otherwise — see SaveCharacter.origin for why this isn't a
        // plain default on every save.
        const origin = character.origin ?? (existing?.origin as CharacterOrigin | undefined) ?? 'imported';
        const recipe = character.recipe === undefined ? ((existing?.recipe as string | null) ?? null) : character.recipe === null ? null : JSON.stringify(character.recipe);

        // Resolve the portrait: keep (undefined), clear (null), or store new (bytes).
        // Write the file before the row so a failed upsert only orphans an image
        // (swept at startup) rather than leaving a dangling reference.
        let portraitId: string | null;
        let portraitToRemove: string | null = null;

        if (character.portrait === undefined) {
            portraitId = existingPortraitId;
        } else if (character.portrait === null) {
            portraitId = null;
            portraitToRemove = existingPortraitId;
        } else {
            portraitId = await this.imageStore.put(character.portrait.bytes, character.portrait.mime);
            portraitToRemove = existingPortraitId;
        }

        this.db.transaction(() => {
            this.db.execute(
                `INSERT INTO characters (id, name, player, edition, is_active, portrait_id, filename, data, updated_at, origin, recipe)
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                 ON CONFLICT(id) DO UPDATE SET
                    name = excluded.name, player = excluded.player, edition = excluded.edition,
                    portrait_id = excluded.portrait_id, filename = excluded.filename,
                    data = excluded.data, updated_at = excluded.updated_at,
                    origin = excluded.origin, recipe = excluded.recipe`,
                [
                    character.id,
                    character.name,
                    character.player,
                    character.edition,
                    existingIsActive,
                    portraitId,
                    character.filename ?? null,
                    JSON.stringify(character.document),
                    this.now(),
                    origin,
                    recipe,
                ],
            );
        });

        if (portraitToRemove !== null && portraitToRemove !== portraitId) {
            await this.imageStore.delete(portraitToRemove);
        }
    }

    async delete(id: string): Promise<void> {
        const portraitId = (this.db.execute('SELECT portrait_id FROM characters WHERE id = ?', [id]).rows[0]?.portrait_id as string | null) ?? null;

        this.db.execute('DELETE FROM characters WHERE id = ?', [id]);

        if (portraitId !== null) {
            await this.imageStore.delete(portraitId);
        }
    }

    async setPortraitFocus(id: string, focus: PortraitFocus | null): Promise<void> {
        this.db.execute('UPDATE characters SET portrait_focus_x = ?, portrait_focus_y = ? WHERE id = ?', [focus?.x ?? null, focus?.y ?? null, id]);
    }

    async setActive(id: string): Promise<void> {
        // Clear then set inside one transaction so the one-active partial unique
        // index is never violated mid-flight.
        this.db.transaction(() => {
            this.db.execute('UPDATE characters SET is_active = 0 WHERE is_active = 1');
            this.db.execute('UPDATE characters SET is_active = 1 WHERE id = ?', [id]);
        });
    }

    private toSummary(row: SqlRow): CharacterSummary {
        const portraitId = row.portrait_id as string | null;
        const x = row.portrait_focus_x as number | null;
        const y = row.portrait_focus_y as number | null;

        return {
            id: row.id as string,
            name: row.name as string,
            player: (row.player as string | null) ?? null,
            edition: row.edition as CharacterSummary['edition'],
            isActive: row.is_active === 1,
            portraitUri: portraitId !== null ? this.imageStore.uri(portraitId) : null,
            // Both or neither — a half-written focus would silently frame one axis.
            portraitFocus: x === null || y === null ? null : {x, y},
        };
    }

    private toCharacter(row: SqlRow): Character {
        const recipe = (row.recipe as string | null) ?? null;

        return {
            ...this.toSummary(row),
            filename: (row.filename as string | null) ?? null,
            updatedAt: row.updated_at as string,
            document: JSON.parse(row.data as string) as Character['document'],
            origin: (row.origin as CharacterOrigin | null) ?? 'imported',
            // Shape is not checked here — `core/random` validates on the way back in, so a recipe
            // from an older build fails to parse there and the character simply isn't editable.
            recipe: recipe === null ? null : (JSON.parse(recipe) as StoredRecipe),
        };
    }
}
