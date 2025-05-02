import {enablePromise} from 'react-native-sqlite-storage';
import {DEFAULT_LOADOUT} from './Settings';
import {dropTable} from './Database';

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

/**
 * Required for all SQLite operations to work.
 */
enablePromise(true);

const TABLE_STATISTICS = 'statistics';

export const DEFAULT_STATS = {
    sum: 0,
    largestDieRoll: 0,
    largestSum: 0,
    totals: {
        diceRolled: 0,
        hitRolls: 0,
        skillChecks: 0,
        effectRolls: 0,
        normalDamage: {
            rolls: 0,
            stun: 0,
            body: 0,
        },
        killingDamage: {
            rolls: 0,
            stun: 0,
            body: 0,
        },
        knockback: 0,
        hitLocations: {
            head: 0,
            hands: 0,
            arms: 0,
            shoulders: 0,
            chest: 0,
            stomach: 0,
            vitals: 0,
            thighs: 0,
            legs: 0,
            feet: 0,
        },
    },
    distributions: {
        one: 0,
        two: 0,
        three: 0,
        four: 0,
        five: 0,
        six: 0,
    },
};

export const createStatisticsTable = async (db) => {
    const query = `CREATE TABLE IF NOT EXISTS ${TABLE_STATISTICS} (
        loadout TEXT PRIMARY KEY DEFAULT '${DEFAULT_LOADOUT}',
        stats TEXT DEFAULT '${JSON.stringify(DEFAULT_STATS)}'
    );`;

    try {
        await db.executeSql(query);
    } catch (error) {
        console.error('Error creating statistics table:', error);
    }
};

export const getStatistics = async (db) => {
    let statistics = {...DEFAULT_STATS};

    try {
        const results = await db.executeSql(`SELECT loadout, json_extract(stats, '$') as stats FROM ${TABLE_STATISTICS} WHERE loadout = ?;`, [DEFAULT_LOADOUT]);

        if (results && results[0].rows.length > 0) {
            statistics = results[0].rows.item(0);

            return JSON.parse(statistics.stats);
        }
    } catch (error) {
        console.error('Error retrieving statistics:', error);
    }

    return statistics;
};

export const saveStatistics = async (db, statistics) => {
    const query = `INSERT OR REPLACE INTO ${TABLE_STATISTICS} (loadout, stats) VALUES (?, ?);`;
    const params = [DEFAULT_LOADOUT, JSON.stringify(statistics)];

    try {
        await db.executeSql(query, params);
    } catch (error) {
        console.error('Error saving statistics:', error);
    }
};

export const resetStatistics = async (db) => {
    await dropTable(db, TABLE_STATISTICS);

    await createStatisticsTable(db);

    await saveStatistics(db, DEFAULT_STATS);
};
