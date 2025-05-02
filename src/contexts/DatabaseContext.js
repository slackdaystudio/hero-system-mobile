import React, {createContext, useContext, useEffect, useState} from 'react';
import {openDatabase as SQLiteOpenDatabase} from 'react-native-sqlite-storage';

export const DB_NAME = 'hsm.db';

const DatabaseContext = createContext();

const DatabaseProvider = ({children}) => {
    const [db, setDb] = useState(null);

    useEffect(() => {
        async function openDatabase() {
            const database = await SQLiteOpenDatabase({
                name: DB_NAME,
                location: 'default',
            });

            setDb(database);
        }

        openDatabase().catch((error) => {
            console.error('Error initializing database:', error);
        });
    }, []);

    if (!db || db === null) {
        return null;
    }

    return <DatabaseContext.Provider value={db}>{children}</DatabaseContext.Provider>;
};

const useDatabase = () => {
    return useContext(DatabaseContext);
};

export {DatabaseProvider, useDatabase};
