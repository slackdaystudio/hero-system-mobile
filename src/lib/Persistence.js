import { Dimensions, Platform, Alert } from 'react-native';
import { Toast } from 'native-base';
import AsyncStorage from '@react-native-community/async-storage';
import { common } from './Common';
import { character as libCharacter } from './Character';
import { heroDesignerCharacter } from './HeroDesignerCharacter';

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

        if (libCharacter.isHeroDesignerCharacter(character)) {
            combatDetails = {
                stun: heroDesignerCharacter.getCharacteristicTotalByShortName('stun', character),
                body: heroDesignerCharacter.getCharacteristicTotalByShortName('body', character),
                endurance: heroDesignerCharacter.getCharacteristicTotalByShortName('end', character),
                ocv: heroDesignerCharacter.getCharacteristicTotalByShortName('ocv', character),
                dcv: heroDesignerCharacter.getCharacteristicTotalByShortName('dcv', character),
                omcv: heroDesignerCharacter.getCharacteristicTotalByShortName('omcv', character),
                dmcv: heroDesignerCharacter.getCharacteristicTotalByShortName('dmcv', character),
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

    async clearCharacter() {
        try {
            await AsyncStorage.removeItem('character');
            await AsyncStorage.removeItem('combat');
        } catch (error) {
            common.toast('Unable to clear persisted character');
        }
    }

    async setShowSecondaryCharacteristics(show = true) {
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

            if (settings === null) {
                settings = {
                    useFifthEdition: false,
                };

                await AsyncStorage.setItem('appSettings', JSON.stringify(settings));
            } else {
                settings = JSON.parse(settings);
            }
        } catch (error) {
            common.toast('Unable to retrieve application settings or initialize a fresh set');
        }

        return settings;
    }

    async setUseFifthEditionRules(fifth) {
        try {
            await AsyncStorage.setItem('appSettings', JSON.stringify({useFifthEdition: fifth}));
        } catch (error) {
            common.toast('Unable to set the value for the setting to use fifth edition rules');
        }

        return fifth;
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
                freeFormRolls: 0,
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
}

export let persistence = new Persistence();
