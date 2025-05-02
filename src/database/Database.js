import {enablePromise, openDatabase} from 'react-native-sqlite-storage';
import {DB_NAME} from '../contexts/DatabaseContext';

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
