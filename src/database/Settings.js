import {enablePromise} from 'react-native-sqlite-storage';
import {SYSTEM} from '../hooks/useColorTheme';
import {INIT_SETTINGS} from '../reducers/settings';
import {dropTable, toBoolean, toSQLiteBoolean} from './Database';

/**
 * Required for all SQLite operations to work.
 */
enablePromise(true);

const TABLE_SETTINGS = 'settings';

const SETTINGS_FIELDS = ['loadout', 'useFifthEdition', 'playSounds', 'onlyDiceSounds', 'showAnimations', 'increaseEntropy', 'colorScheme'];

export const DEFAULT_LOADOUT = 'default';

export const createSettingsTable = async (db) => {
    const query = `CREATE TABLE IF NOT EXISTS ${TABLE_SETTINGS} (
        loadout TEXT PRIMARY KEY,
        useFifthEdition INTEGER(1) DEFAULT 0,
        playSounds INTEGER(1) DEFAULT 0,
        onlyDiceSounds INTEGER(1) DEFAULT 0,
        showAnimations INTEGER(1) DEFAULT 1,
        increaseEntropy INTEGER(1) DEFAULT 1,
        colorScheme TEXT DEFAULT '${SYSTEM}'
    );`;

    try {
        await db.executeSql(query);
    } catch (error) {
        console.error('Error creating settings table:', error);
    }
};

export const getSettings = async (db) => {
    let settings;

    const results = await db.executeSql(`SELECT ${SETTINGS_FIELDS.join(', ')} FROM ${TABLE_SETTINGS} WHERE loadout = ?;`, [DEFAULT_LOADOUT]);

    if (results) {
        settings = {...results[0].rows.item(0)};

        // Convert SQLite boolean values to JS boolean values
        for (const [k, v] of Object.entries(settings)) {
            if (SETTINGS_FIELDS.includes(k)) {
                settings[k] = toBoolean(v);
            }
        }
    }

    return settings;
};

export const setSetting = async (db, key, value) => {
    const update = `UPDATE ${TABLE_SETTINGS} SET ${key} = ? WHERE loadout = ?;`;

    await db.executeSql(update, [toSQLiteBoolean(value), DEFAULT_LOADOUT]);

    const settings = await getSettings(db);

    return settings[key];
};

export const saveSettings = async (db, settings) => {
    return await db.executeSql(`INSERT OR REPLACE INTO ${TABLE_SETTINGS} (${SETTINGS_FIELDS.join(', ')}) VALUES (?, ?, ?, ?, ?, ?, ?);`, [
        DEFAULT_LOADOUT,
        toSQLiteBoolean(settings.useFifthEdition),
        toSQLiteBoolean(settings.playSounds),
        toSQLiteBoolean(settings.onlyDiceSounds),
        toSQLiteBoolean(settings.showAnimations),
        toSQLiteBoolean(settings.increaseEntropy),
        settings.colorScheme,
    ]);
};

export const resetSettings = async (db) => {
    await dropTable(db, TABLE_SETTINGS);

    await createSettingsTable(db);

    await saveSettings(db, INIT_SETTINGS);
};
