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

import {DEFAULT_SETTINGS} from 'core/ports';
import {createBetterSqlite3Database} from '../driver/betterSqlite3Database';
import {runMigrations} from '../migrations';
import {SqliteSettingsRepository} from '../settingsRepository';

// Contract tests run against a real in-memory SQLite (better-sqlite3).
const setup = () => {
    const db = createBetterSqlite3Database();
    runMigrations(db);
    return {db, repo: new SqliteSettingsRepository(db)};
};

describe('SqliteSettingsRepository (real SQLite)', () => {
    it('returns defaults on an empty store', async () => {
        const {repo} = setup();

        expect(await repo.get()).toEqual(DEFAULT_SETTINGS);
    });

    it('persists a setting and leaves the rest at their defaults', async () => {
        const {repo} = setup();

        await repo.set('playSounds', false);
        await repo.set('colorScheme', 'dark');

        const settings = await repo.get();
        expect(settings.playSounds).toBe(false);
        expect(settings.colorScheme).toBe('dark');
        expect(settings.useFifthEdition).toBe(DEFAULT_SETTINGS.useFifthEdition);
    });

    it('upserts on repeated set rather than duplicating rows', async () => {
        const {db, repo} = setup();

        await repo.set('playSounds', false);
        await repo.set('playSounds', true);

        expect(db.execute('SELECT COUNT(*) AS n FROM settings').rows[0].n).toBe(1);
        expect((await repo.get()).playSounds).toBe(true);
    });

    it('reset clears back to defaults', async () => {
        const {repo} = setup();

        await repo.set('increaseEntropy', false);
        await repo.reset();

        expect(await repo.get()).toEqual(DEFAULT_SETTINGS);
    });
});
