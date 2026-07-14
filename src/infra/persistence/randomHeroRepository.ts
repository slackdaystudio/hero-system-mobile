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

import type {RandomHero, RandomHeroRepository} from 'core/ports';
import type {SqlDatabase} from './driver/sqlDatabase';

/** The last generated random hero as a single JSON row (`random_hero.id = 1`). */
export class SqliteRandomHeroRepository implements RandomHeroRepository {
    constructor(private readonly db: SqlDatabase) {}

    async get(): Promise<RandomHero | null> {
        const {rows} = this.db.execute('SELECT data FROM random_hero WHERE id = 1');

        return rows.length > 0 ? (JSON.parse(rows[0].data as string) as RandomHero) : null;
    }

    async set(hero: RandomHero): Promise<void> {
        this.db.execute('INSERT INTO random_hero (id, data) VALUES (1, ?) ON CONFLICT(id) DO UPDATE SET data = excluded.data', [JSON.stringify(hero)]);
    }

    async rename(name: string): Promise<void> {
        const hero = await this.get();

        if (hero !== null) {
            hero.name = name;
            await this.set(hero);
        }
    }

    async clear(): Promise<void> {
        this.db.execute('DELETE FROM random_hero');
    }
}
