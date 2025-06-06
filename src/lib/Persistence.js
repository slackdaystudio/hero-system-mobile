import AsyncStorage from '@react-native-async-storage/async-storage';
import {file} from './File';
import {SYSTEM} from '../hooks/useColorTheme';
import {INIT_SETTINGS} from '../reducers/settings';
import {common} from './Common';
import {createSettingsTable, getSettings, resetSettings, saveSettings, setSetting} from '../database/Settings';
import {createStatisticsTable, DEFAULT_STATS, getStatistics, resetStatistics, saveStatistics} from '../database/Statistics';

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

export const MAX_CHARACTER_SLOTS = 5;

class Persistence {
    async initializeApplication(db) {
        let settings = await this.initializeApplicationSettings(db);
        let statistics = await this.initializeStatistics(db);
        let character = await this.initializeCharacter();
        let randomHero = await this.initializeRandomHero();

        return {
            settings,
            statistics: statistics,
            character: character,
            randomHero: randomHero,
        };
    }

    async getVersion() {
        let version = null;

        try {
            version = await AsyncStorage.getItem('version');
        } catch (error) {
            console.error('Unable to retrieve version');
        }

        return version;
    }

    async setVersion(version) {
        try {
            await AsyncStorage.setItem('version', version);
        } catch (error) {
            console.error('Unable to persist version');
        }

        return version;
    }

    async clearCaches(db) {
        let cacheKeys = ['appSettings', 'character', 'statistics', 'statistics'];
        let legacyCacheKeys = ['showSecondaryCharacteristics', 'combat'];
        let allCacheKeys = cacheKeys.concat(legacyCacheKeys);

        await AsyncStorage.multiRemove(allCacheKeys);

        await resetSettings(db);

        console.error('All caches have been cleared');
    }

    async saveCharacter(character, slot) {
        let characters = null;

        try {
            await AsyncStorage.setItem('character', JSON.stringify(character));

            await file.saveCharacter(character, character.filename.slice(0, -5));

            characters = await AsyncStorage.getItem('characters');

            if (characters === null) {
                characters = this._initializeCharacters();

                characters[slot] = character;
            } else {
                characters = JSON.parse(characters);

                characters[slot] = character;
            }

            await AsyncStorage.setItem('characters', JSON.stringify(characters));
        } catch (error) {
            console.error('Unable to persist character');
        }

        return {
            character: character,
            characters: characters,
        };
    }

    async saveCharacterData(character, characters) {
        try {
            for (let char of Object.values(characters)) {
                if (char !== null) {
                    await file.saveCharacter(char, char.filename.slice(0, -5));
                }
            }

            await AsyncStorage.setItem('character', JSON.stringify(character));
            await AsyncStorage.setItem('characters', JSON.stringify(characters));
        } catch (error) {
            console.error('Unable to persist character data');
        }
    }

    async initializeCharacter() {
        let characterData = {
            character: null,
            characters: this._initializeCharacters(),
        };

        try {
            let character = null;
            let characters = this._initializeCharacters();

            character = await AsyncStorage.getItem('character');

            if (character !== null) {
                characterData.character = JSON.parse(character);
            }

            characters = await AsyncStorage.getItem('characters');

            if (characters === null) {
                if (character !== null) {
                    // Do not change, we want the object ref
                    characterData.characters['0'] = characterData.character;
                }
            } else {
                characterData.characters = JSON.parse(characters);
            }
        } catch (error) {
            console.error('Unable to retrieve persisted character');
        }

        return characterData;
    }

    async updateLoadedCharacters(newCharacter, character, characters) {
        let data;

        try {
            if (newCharacter.filename === character.filename) {
                character = {...newCharacter};
            }

            for (const [slot, char] of Object.entries(characters)) {
                if (char.filename === newCharacter.filename) {
                    characters[slot] = {...newCharacter};
                    break;
                }
            }

            data = await this.saveCharacter(character, characters);
        } catch (error) {
            console.error('Unable to update loaded characters');
        }

        return data;
    }

    async clearCharacter(filename, character, characters, saveCharacters = true) {
        try {
            if (saveCharacters) {
                await this.saveCharacterData(character, characters);
            }

            let toBeRemoved = null;

            for (let i = 0; i < MAX_CHARACTER_SLOTS; i++) {
                if (characters[i.toString()] !== undefined && characters[i.toString()].filename === filename) {
                    toBeRemoved = i.toString();
                    break;
                }
            }

            if (toBeRemoved !== null) {
                if (character.filename === filename) {
                    character = null;

                    for (let char of Object.values(characters)) {
                        if (char !== null && char.filename !== filename) {
                            character = char;
                            break;
                        }
                    }
                }

                characters[toBeRemoved] = null;

                await AsyncStorage.setItem('character', JSON.stringify(character));
                await AsyncStorage.setItem('characters', JSON.stringify(characters));
            }
        } catch (error) {
            console.error('Unable to clear persisted character');
        }

        return {
            character: character,
            characters: characters,
        };
    }

    async clearCharacterData() {
        try {
            await AsyncStorage.removeItem('character');
            await AsyncStorage.removeItem('characters');
        } catch (error) {
            console.error('Unable to clear persisted character');
        }
    }

    async initializeApplicationSettings(db) {
        if (!db || db === null) {
            console.error('Database is not initialized');
            return null;
        }

        await createSettingsTable(db);

        let settings = await getSettings(db);

        if (common.isEmptyObject(settings)) {
            console.log('Settings are empty, initializing with default settings');

            await saveSettings(db, INIT_SETTINGS);

            settings = await getSettings(db);
        }

        return settings;
    }

    async clearApplicationSettings(db) {
        let settings = {};

        try {
            await resetSettings(db);

            settings = await getSettings(db);
        } catch (error) {
            console.error('Unable to clear application settings');
        }

        return settings;
    }

    async toggleSetting(db, key, value) {
        try {
            await setSetting(db, key, value.valueOf());
        } catch (error) {
            console.error(error.message);
            console.error(`Unable to toggle ${key}`);
        }

        return value;
    }

    async initializeStatistics(db) {
        if (!db || db === null) {
            console.error('Database is not initialized');
            return null;
        }

        await createStatisticsTable(db);

        let statistics = await getStatistics(db);

        if (common.isEmptyObject(statistics)) {
            console.log('Statistics are empty, initializing with default statistics');

            await saveStatistics(db, DEFAULT_STATS);

            statistics = await getStatistics(db);
        }

        return statistics;
    }

    async setStatistics(db, statistics) {
        try {
            await saveStatistics(db, statistics);
        } catch (error) {
            console.error('Unable to persist statistics');
        }

        return statistics;
    }

    async clearStatistics(db) {
        let stats = {};

        try {
            await resetStatistics(db);

            stats = await getStatistics(db);
        } catch (error) {
            console.error('Unable to clear statistics');
        }

        return stats;
    }

    async initializeRandomHero() {
        let randomHero = null;

        try {
            randomHero = await AsyncStorage.getItem('hero');
        } catch (error) {
            console.error('Unable to retrieve persisted H.E.R.O.');
        }

        return randomHero === null ? null : JSON.parse(randomHero);
    }

    async setRandomHero(character) {
        try {
            await AsyncStorage.setItem('hero', JSON.stringify(character));
        } catch (error) {
            console.error('Unable to persist H.E.R.O.');
        }

        return character;
    }

    async setRandomHeroName(name) {
        let randomHero = null;

        try {
            randomHero = await AsyncStorage.getItem('hero');

            if (randomHero !== null) {
                randomHero = JSON.parse(randomHero);

                randomHero.name = name;

                await AsyncStorage.setItem('hero', JSON.stringify(randomHero));
            }
        } catch (error) {
            console.error('Unable to retrieve persisted H.E.R.O.');
        }

        return randomHero;
    }

    async clearRandomHero() {
        try {
            await AsyncStorage.removeItem('hero');
        } catch (error) {
            console.error('Unable to clear persisted H.E.R.O.');
        }
    }

    async _initializeStatistics() {
        try {
            await AsyncStorage.setItem('statistics', JSON.stringify(DEFAULT_STATS));
        } catch (error) {
            console.error('Unable to initialize statistics');
        }

        return DEFAULT_STATS;
    }

    _initializeCharacters() {
        let characters = {};

        for (let i = 0; i < MAX_CHARACTER_SLOTS; i++) {
            characters[i.toString()] = null;
        }

        return characters;
    }

    _populateMissingSetttings(settings) {
        let shouldUpdate = false;
        let settingDefaults = {
            useFifthEdition: false,
            playSounds: true,
            onlyDiceSounds: false,
            showAnimations: true,
            increaseEntropy: true,
            colorScheme: SYSTEM,
        };

        settings = settings === null || settings === undefined ? {} : settings;

        for (let [key, value] of Object.entries(settingDefaults)) {
            if (settings[key] === null || settings[key] === undefined || settings[key] === '') {
                settings[key] = value;
                shouldUpdate = true;
            }
        }

        return shouldUpdate;
    }
}

export let persistence = new Persistence();
