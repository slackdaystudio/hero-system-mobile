import {enablePromise, openDatabase} from 'react-native-sqlite-storage';
import {DB_NAME} from '../contexts/DatabaseContext';

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

export const getDBConnection = async () => {
    return openDatabase({name: DB_NAME, location: 'default'});
};

export const dropTable = async (db, table) => {
    const query = `DROP TABLE IF EXISTS ${table};`;

    await db.executeSql(query);
};

export const toBoolean = (value) => {
    if (value === 0) {
        return false;
    } else if (value === 1) {
        return true;
    } else {
        return value;
    }
};

export const toSQLiteBoolean = (value) => {
    if (value === false) {
        return 0;
    } else if (value === true) {
        return 1;
    } else {
        return value;
    }
};
