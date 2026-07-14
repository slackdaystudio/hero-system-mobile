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

import {DEFAULT_STATISTICS} from 'core/ports';
import {createBetterSqlite3Database} from '../driver/betterSqlite3Database';
import {runMigrations} from '../migrations';
import {SqliteStatisticsRepository} from '../statisticsRepository';
import {SqliteRandomHeroRepository} from '../randomHeroRepository';
import {SqliteAppStateStore} from '../appStateStore';

const db = () => {
    const database = createBetterSqlite3Database();
    runMigrations(database);
    return database;
};

describe('SqliteStatisticsRepository (real SQLite)', () => {
    it('returns defaults when empty, round-trips a save, and upserts the single row', async () => {
        const repo = new SqliteStatisticsRepository(db());

        expect(await repo.get()).toEqual(DEFAULT_STATISTICS);

        const stats = {...DEFAULT_STATISTICS, sum: 42, largestSum: 18};
        await repo.save(stats);
        expect((await repo.get()).sum).toBe(42);

        await repo.save({...stats, sum: 99});
        expect((await repo.get()).sum).toBe(99);
    });

    it('reset returns to defaults', async () => {
        const repo = new SqliteStatisticsRepository(db());
        await repo.save({...DEFAULT_STATISTICS, sum: 5});

        await repo.reset();

        expect(await repo.get()).toEqual(DEFAULT_STATISTICS);
    });

    it('heals a partial / legacy-shaped stored row against the defaults', async () => {
        const database = db();
        // A blob missing `totals`/`distributions`, as legacy or a partial migration could leave.
        database.execute('INSERT INTO statistics (id, stats) VALUES (1, ?)', [JSON.stringify({sum: 1234, largestDieRoll: 6})]);

        const stats = await new SqliteStatisticsRepository(database).get();

        expect(stats.sum).toBe(1234);
        expect(stats.largestDieRoll).toBe(6);
        expect(stats.totals.diceRolled).toBe(0);
        expect(stats.totals.normalDamage).toEqual({rolls: 0, stun: 0, body: 0});
        expect(stats.distributions.one).toBe(0);
    });
});

describe('SqliteRandomHeroRepository (real SQLite)', () => {
    it('get/set/rename/clear', async () => {
        const repo = new SqliteRandomHeroRepository(db());

        expect(await repo.get()).toBeNull();

        await repo.set({name: 'Nmeth', str: 20});
        expect(await repo.get()).toEqual({name: 'Nmeth', str: 20});

        await repo.rename('Renamed');
        expect((await repo.get())?.name).toBe('Renamed');

        await repo.clear();
        expect(await repo.get()).toBeNull();
    });

    it('rename is a no-op when there is no hero', async () => {
        const repo = new SqliteRandomHeroRepository(db());

        await repo.rename('nobody');

        expect(await repo.get()).toBeNull();
    });
});

describe('SqliteAppStateStore (real SQLite)', () => {
    it('get returns null for a missing key; set upserts', async () => {
        const store = new SqliteAppStateStore(db());

        expect(await store.get('migrated_v1')).toBeNull();

        await store.set('migrated_v1', 'true');
        expect(await store.get('migrated_v1')).toBe('true');

        await store.set('migrated_v1', 'false');
        expect(await store.get('migrated_v1')).toBe('false');
    });
});
