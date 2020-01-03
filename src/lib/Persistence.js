import { Dimensions, Platform, Alert } from 'react-native';
import { Toast } from 'native-base';
import AsyncStorage from '@react-native-community/async-storage';
import { common } from './Common';

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

    async setShowSecondaryCharacteristics(show=true) {
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
                    useFifthEdition: false
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

    async initializeStatistics() {
        let character = null;

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
                body: 0
            },
            killingDamage: {
                rolls: 0,
                stun: 0,
                body: 0
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
                feet: 0
            }
            },
            distributions: {
                one: 0,
                two: 0,
                three: 0,
                four: 0,
                five: 0,
                six: 0
            }
        }

        try {
            await AsyncStorage.setItem('statistics', JSON.stringify(statistics));
        } catch (error) {
            common.toast('Unable to initialize statistics');
        }

        return statistics;
    }
}

export let persistence = new Persistence();
