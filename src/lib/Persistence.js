import { Dimensions, Platform, Alert } from 'react-native';
import { Toast } from 'native-base';
import AsyncStorage from '@react-native-community/async-storage';
import { common } from './Common';
import { file } from './File';
import { character as libCharacter } from './Character';
import { heroDesignerCharacter } from './HeroDesignerCharacter';
import speedTable from '../../public/speed.json';

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
    async initializeApplication() {
        let settings = await this.initializeApplicationSettings();
        let statistics = await this.initializeStatistics();
        let character = await this.initializeCharacter();
        let randomHero = await this.initializeRandomHero();

        return {
            settings: settings,
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
            common.toast('Unable to retrieve version');
        }

        return version;
    }

    async setVersion(version) {
        try {
            await AsyncStorage.setItem('version', version);
        } catch (error) {
            common.toast('Unable to persist version');
        }

        return version;
    }

    async clearCaches() {
        let cacheKeys = ['appSettings', 'character', 'statistics', 'statistics'];
        let legacyCacheKeys = ['showSecondaryCharacteristics', 'combat'];
        let allCacheKeys = cacheKeys.concat(legacyCacheKeys);

        await AsyncStorage.multiRemove(allCacheKeys);

        common.toast('All caches have been cleared');
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
            common.toast('Unable to persist statistics');
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
            common.toast('Unable to persist character data');
        }
    }

    async initializeCharacter() {
        let characterData = {
            character: null,
            characters: this._initializeCharacters(),
        }

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
            common.toast('Unable to retrieve persisted character');
        }

        return characterData;
    }

    async clearCharacter(filename, character, characters, saveCharacters = true) {
        try {
            if (saveCharacters) {
                await this.saveCharacterData(character, characters);
            }

            let toBeRemoved = null;

            for (let i = 0; i < MAX_CHARACTER_SLOTS; i++) {
                if (characters[i.toString()] !== null && characters[i.toString()].filename === filename) {
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
            common.toast('Unable to clear persisted character');
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
            common.toast('Unable to clear persisted character');
        }
    }

    async initializeApplicationSettings() {
        let settings = null;

        try {
            settings = await AsyncStorage.getItem('appSettings');
            settings = settings === null ? {} : JSON.parse(settings);

            if (this._populateMissingSetttings(settings)) {
                await AsyncStorage.setItem('appSettings', JSON.stringify(settings));

                return settings;
            }
        } catch (error) {
            common.toast('Unable to retrieve application settings or initialize a fresh set');
        }

        return settings;
    }

    async clearApplicationSettings() {
        let settings = {};

        try {
            this._populateMissingSetttings(settings);

            await AsyncStorage.setItem('appSettings', JSON.stringify(settings));
        } catch (error) {
            common.toast('Unable to clear application settings');
        }

        return settings;
    }

    async toggleSetting(key, value) {
        try {
            let appSettings = await AsyncStorage.getItem('appSettings');
            appSettings = JSON.parse(appSettings);

            appSettings[key] = value;

            await AsyncStorage.setItem('appSettings', JSON.stringify(appSettings));
        } catch (error) {
            common.toast(`Unable to toggle ${key}`);
        }

        return value;
    }

    async initializeStatistics() {
        let statistics = null;

        try {
            statistics = await AsyncStorage.getItem('statistics');

            if (statistics === null) {
                statistics = await this._initializeStatistics();
            } else {
                statistics = JSON.parse(statistics);
            }
        } catch (error) {
            common.toast('Unable to retrieve persisted statistics or initialize a fresh set');
        }

        return statistics;
    }

    async setStatistics(statistics) {
        try {
            await AsyncStorage.setItem('statistics', JSON.stringify(statistics));
        } catch (error) {
            common.toast('Unable to persist statistics');
        }

        return statistics;
    }

    async clearStatistics() {
        let reinitializedStatistics = null;

        try {
            await AsyncStorage.removeItem('statistics');
            reinitializedStatistics = await this._initializeStatistics();
        } catch (error) {
            common.toast('Unable to clear persisted statistics');
        }

        return reinitializedStatistics;
    }

    async initializeRandomHero() {
        let randomHero = null;

        try {
            randomHero = await AsyncStorage.getItem('hero');
        } catch (error) {
            common.toast('Unable to retrieve persisted H.E.R.O.');
        }

        return randomHero === null ? null : JSON.parse(randomHero);
    }

    async setRandomHero(character) {
        try {
            await AsyncStorage.setItem('hero', JSON.stringify(character));
        } catch (error) {
            common.toast('Unable to persist H.E.R.O.');
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
            common.toast('Unable to retrieve persisted H.E.R.O.');
        }

        return randomHero;
    }

    async clearRandomHero() {
        try {
            await AsyncStorage.removeItem('hero');
        } catch (error) {
            common.toast('Unable to clear persisted H.E.R.O.');
        }
    }

    async _initializeStatistics() {
        let statistics = {
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

        try {
            await AsyncStorage.setItem('statistics', JSON.stringify(statistics));
        } catch (error) {
            common.toast('Unable to initialize statistics');
        }

        return statistics;
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
