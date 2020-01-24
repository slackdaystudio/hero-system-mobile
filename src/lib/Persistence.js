import { Dimensions, Platform, Alert } from 'react-native';
import { Toast } from 'native-base';
import AsyncStorage from '@react-native-community/async-storage';
import { common } from './Common';
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

class Persistence {
    async getCharacter() {
        let character = null;

        try {
            character = await AsyncStorage.getItem('character');
        } catch (error) {
            common.toast('Unable to retrieve persisted character');
        }

        return character === null ? null : JSON.parse(character);
    }

    async getShowSecondary() {
        let showSecondary = null;

        try {
            showSecondary = await AsyncStorage.getItem('showSecondaryCharacteristics');

            if (showSecondary === null) {
                await AsyncStorage.setItem('showSecondaryCharacteristics', true.toString());

                showSecondary = JSON.stringify(true);
            }
        } catch (error) {
            common.toast('Unable to retrieve show secondary characteristics');
        }

        return JSON.parse(showSecondary);
    }

    async setCharacter(character) {
        try {
            await AsyncStorage.setItem('character', JSON.stringify(character));
        } catch (error) {
            common.toast('Unable to persist character');
        }

        return character;
    }

    async initializeCombatDetails(character) {
        let combatDetails = null;

        try {
            combatDetails = await AsyncStorage.getItem('combat');
        } catch (error) {
            common.toast('Unable to retrieve persisted combat details');
        }

        return combatDetails === null ? null : JSON.parse(combatDetails);
    }

    async setCombatDetails(character) {
        let combatDetails = {
            stun: 0,
            body: 0,
            endurance: 0
        }
        let showSecondary = JSON.parse(await AsyncStorage.getItem('showSecondaryCharacteristics'));

        if (libCharacter.isHeroDesignerCharacter(character)) {
            combatDetails = {
                stun: this._getCharacteristic(character, 'stun', showSecondary),
                body: this._getCharacteristic(character, 'body', showSecondary),
                endurance: this._getCharacteristic(character, 'end', showSecondary),
                ocv: this._getCharacteristic(character, 'ocv', showSecondary),
                dcv: this._getCharacteristic(character, 'dcv', showSecondary),
                omcv: this._getCharacteristic(character, 'omcv', showSecondary),
                dmcv: this._getCharacteristic(character, 'dmcv', showSecondary),
                phases: this._initPhases(character, showSecondary),
            };
        } else {
            combatDetails = {
                stun: libCharacter.getCharacteristic(character.characteristics.characteristic, 'stun'),
                body: libCharacter.getCharacteristic(character.characteristics.characteristic, 'body'),
                endurance: libCharacter.getCharacteristic(character.characteristics.characteristic, 'endurance'),
            };
        }

        try {
            await AsyncStorage.setItem('combat', JSON.stringify(combatDetails));
        } catch (error) {
            common.toast('Unable to generate combat details');
        }

        return combatDetails;
    }

    async setSparseCombatDetails(sparseCombatDetails) {
        let combatDetails = null;

        try {
            combatDetails = await AsyncStorage.getItem('combat');

            if (combatDetails !== null) {
                combatDetails = JSON.parse(combatDetails);

                for (let [key, value] of Object.entries(sparseCombatDetails)) {
                    if (combatDetails.hasOwnProperty(key)) {
                        combatDetails[key] = value;
                    }
                }

                await AsyncStorage.setItem('combat', JSON.stringify(combatDetails));
            }
        } catch (error) {
            common.toast('Unable to update combat detail');
        }

        return combatDetails;
    }

    async usePhase(phase, abort) {
        let combatDetails = null;

        try {
            combatDetails = await AsyncStorage.getItem('combat');

            if (combatDetails !== null) {
                combatDetails = JSON.parse(combatDetails);

                let used = combatDetails.phases[phase.toString()].used;
                let aborted = combatDetails.phases[phase.toString()].aborted;

                if (abort) {
                    used = false;
                    aborted = !aborted;
                } else {
                    if (aborted) {
                        used = false;
                        aborted = false;
                    } else {
                        used = !used;
                        aborted = false;
                    }
                }

                combatDetails.phases[phase.toString()] = {
                    used: used,
                    aborted: aborted,
                };

                await AsyncStorage.setItem('combat', JSON.stringify(combatDetails));
            }
        } catch (error) {
            common.toast(`Unable to toggle phase ${phase}: ${error.message}`);
        }

        return combatDetails;
    }

    async clearCharacter() {
        try {
            await AsyncStorage.removeItem('character');
            await AsyncStorage.removeItem('combat');
        } catch (error) {
            common.toast('Unable to clear persisted character');
        }
    }

    async setShowSecondaryCharacteristics(show) {
        try {
            await AsyncStorage.setItem('showSecondaryCharacteristics', show.toString());
        } catch (error) {
            common.toast('Unable to update the value of show secondary characteristics');
        }

        return show;
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

    _initPhases(character, showSecondary) {
        let speed = 1;
        let phases = {};

        if (showSecondary) {
            speed = heroDesignerCharacter.getCharacteristicTotalByShortName('SPD', character);
        } else {
            let speedCharacteristic = heroDesignerCharacter.getCharacteristicByShortName('SPD', character);

            speed = speedCharacteristic === null ? 1 : speedCharacteristic.value;
        }

        for (let phase of speedTable[(speed > 12 ? '12' : speed.toString())].phases) {
            phases[phase.toString()] = {
                used: false,
                aborted: false,
            }
        }

        return phases;
    }

    _getCharacteristic(character, shortName, showSecondary) {
        if (showSecondary) {
            return heroDesignerCharacter.getCharacteristicTotalByShortName(shortName, character)
        }

        let characteristic = heroDesignerCharacter.getCharacteristicByShortName(shortName, character);

        return characteristic === null ? 0 : characteristic.value;
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
