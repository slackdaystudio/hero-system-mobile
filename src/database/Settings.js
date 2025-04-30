import {SYSTEM} from '../hooks/useColorTheme';
import {INIT_SETTINGS} from '../reducers/settings';
import {dropTable, toBoolean, toSQLiteBoolean} from './Database';

const TABLE_SETTINGS = 'settings';

const SETTINGS_FIELDS = ['useFifthEdition', 'playSounds', 'onlyDiceSounds', 'showAnimations', 'increaseEntropy', 'colorScheme'];

export const createSettingsTable = async (db) => {
    const query = `CREATE TABLE IF NOT EXISTS ${TABLE_SETTINGS}(
        useFifthEdition INTEGER(1) DEFAULT 0,
        playSounds INTEGER(1) DEFAULT 0,
        onlyDiceSounds INTEGER(1) DEFAULT 0,
        showAnimations INTEGER(1) DEFAULT 1,
        increaseEntropy INTEGER(1) DEFAULT 1,
        colorScheme TEXT DEFAULT '${SYSTEM}'
    );`;

    await db.executeSql(query);
};

export const getSettings = async (db) => {
    let settings = {};

    const results = await db.executeSql(`SELECT ${SETTINGS_FIELDS.join(',')} FROM ${TABLE_SETTINGS} LIMIT 1;`);

    if (results && results.length > 0) {
        results.forEach((result) => {
            for (let index = 0; index < result.rows.length; index++) {
                settings = {...result.rows.item(index)};
            }
        });

        for (const [k, v] of Object.entries(settings)) {
            if (SETTINGS_FIELDS.includes(k) && k !== 'colorScheme') {
                settings[k] = toBoolean(v);
            }
        }
    }

    return settings ? settings : INIT_SETTINGS;
};

export const setSetting = async (db, key, value) => {
    const formattedValue = key === 'colorScheme' ? value : toSQLiteBoolean(value);

    return await db.executeSql(`UPDATE ${TABLE_SETTINGS} SET ${key} = ?;`, [formattedValue]);
};

export const saveSettings = async (db, settings) => {
    return await db.executeSql(
        // eslint-disable-next-line max-len
        `INSERT OR REPLACE INTO ${TABLE_SETTINGS} (useFifthEdition, playSounds, onlyDiceSounds, showAnimations, increaseEntropy, colorScheme) VALUES (?, ?, ?, ?, ?, ?);`,
        [
            toSQLiteBoolean(settings.useFifthEdition),
            toSQLiteBoolean(settings.playSounds),
            toSQLiteBoolean(settings.onlyDiceSounds),
            toSQLiteBoolean(settings.showAnimations),
            toSQLiteBoolean(settings.increaseEntropy),
            settings.colorScheme,
        ],
    );
};

export const resetSettings = async (db) => {
    await dropTable(db, 'settings');

    await createSettingsTable(db);

    await saveSettings(db, INIT_SETTINGS);
};
