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

import type {CombatState} from 'core/combat';
import type {CombatStateRepository} from 'core/ports';
import type {SqlDatabase} from './driver/sqlDatabase';

/** Live combat state over the `combat_state` table — one JSON row per character. */
export class SqliteCombatStateRepository implements CombatStateRepository {
    constructor(private readonly db: SqlDatabase) {}

    async get(characterId: string): Promise<CombatState | null> {
        const {rows} = this.db.execute('SELECT state FROM combat_state WHERE character_id = ?', [characterId]);

        return rows.length > 0 ? (JSON.parse(rows[0].state as string) as CombatState) : null;
    }

    async save(characterId: string, state: CombatState): Promise<void> {
        this.db.execute('INSERT INTO combat_state (character_id, state) VALUES (?, ?) ON CONFLICT(character_id) DO UPDATE SET state = excluded.state', [
            characterId,
            JSON.stringify(state),
        ]);
    }

    async clear(characterId: string): Promise<void> {
        this.db.execute('DELETE FROM combat_state WHERE character_id = ?', [characterId]);
    }
}
