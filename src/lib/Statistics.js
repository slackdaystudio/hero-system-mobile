import { AsyncStorage } from 'react-native';

class Statistics {
    async init() {
        await AsyncStorage.setItem('statistics', JSON.stringify({
            average: 0,
            sum: 0,
            totals: {
                diceRolled: 0,
                rolledFaceValue: 0,
                damageFaceValue: 0,
                killingDamage: 0,
                normalDamage: 0,
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
            }
        }));
    }

    async add(rollResult) {

    }
}

export let statistics = new Statistics();