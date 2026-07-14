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

import type {AppStateStore} from 'core/ports';
import type {SqlDatabase} from './driver/sqlDatabase';

/** Scalar app state over the `app_state` key/value table. */
export class SqliteAppStateStore implements AppStateStore {
    constructor(private readonly db: SqlDatabase) {}

    async get(key: string): Promise<string | null> {
        const {rows} = this.db.execute('SELECT value FROM app_state WHERE key = ?', [key]);

        return rows.length > 0 ? (rows[0].value as string) : null;
    }

    async set(key: string, value: string): Promise<void> {
        this.db.execute('INSERT INTO app_state (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value', [key, value]);
    }
}
