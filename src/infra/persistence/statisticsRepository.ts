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

import {DEFAULT_STATISTICS, type Statistics, type StatisticsRepository} from 'core/ports';
import type {SqlDatabase} from './driver/sqlDatabase';

/** Global dice statistics as a single JSON row (`statistics.id = 1`). */
export class SqliteStatisticsRepository implements StatisticsRepository {
    constructor(private readonly db: SqlDatabase) {}

    async get(): Promise<Statistics> {
        const {rows} = this.db.execute('SELECT stats FROM statistics WHERE id = 1');

        return rows.length > 0 ? (JSON.parse(rows[0].stats as string) as Statistics) : {...DEFAULT_STATISTICS};
    }

    async save(statistics: Statistics): Promise<void> {
        this.db.execute('INSERT INTO statistics (id, stats) VALUES (1, ?) ON CONFLICT(id) DO UPDATE SET stats = excluded.stats', [JSON.stringify(statistics)]);
    }

    async reset(): Promise<void> {
        this.db.execute('DELETE FROM statistics');
    }
}
