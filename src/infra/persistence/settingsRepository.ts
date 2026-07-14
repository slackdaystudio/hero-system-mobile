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

import {DEFAULT_SETTINGS, type Settings, type SettingsRepository} from 'core/ports';
import type {SqlDatabase} from './driver/sqlDatabase';

/**
 * Settings over the `settings` key/value table — one row per setting, value as
 * JSON. `get()` layers the stored rows onto {@link DEFAULT_SETTINGS}, so a
 * missing key falls back to its default and adding a new setting needs no schema
 * migration.
 */
export class SqliteSettingsRepository implements SettingsRepository {
    constructor(private readonly db: SqlDatabase) {}

    async get(): Promise<Settings> {
        const settings = {...DEFAULT_SETTINGS} as unknown as Record<string, unknown>;
        const {rows} = this.db.execute('SELECT key, value FROM settings');

        for (const row of rows) {
            const key = row.key as string;

            if (key in settings) {
                settings[key] = JSON.parse(row.value as string);
            }
        }

        return settings as unknown as Settings;
    }

    async set<K extends keyof Settings>(key: K, value: Settings[K]): Promise<void> {
        this.db.execute('INSERT INTO settings (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value', [key as string, JSON.stringify(value)]);
    }

    async reset(): Promise<void> {
        this.db.execute('DELETE FROM settings');
    }
}
