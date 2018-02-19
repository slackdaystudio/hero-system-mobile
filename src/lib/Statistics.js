import { AsyncStorage, Alert } from 'react-native';
import { NORMAL_DAMAGE, KILLING_DAMAGE, TO_HIT, FREE_FORM, SKILL_CHECK } from './DieRoller';

class Statistics {
    async init() {
        await AsyncStorage.setItem('statistics', JSON.stringify({
            sum: 0,
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
        }));
    }

    async add(resultRoll) {
        let stats = await AsyncStorage.getItem('statistics');
        stats = JSON.parse(stats);

        stats.sum += resultRoll.rolls.reduce((a, b) => a + b, 0);
        stats.totals.diceRolled += resultRoll.rolls.length;

        if (resultRoll.rollType === NORMAL_DAMAGE || resultRoll.rollType === KILLING_DAMAGE) {
            if (resultRoll.rollType === NORMAL_DAMAGE) {
                stats.totals.normalDamage.rolls++;
                stats.totals.normalDamage.stun += resultRoll.stun;
                stats.totals.normalDamage.body += resultRoll.body;
            } else if (resultRoll.rollType === KILLING_DAMAGE) {
                stats.totals.killingDamage.rolls++;
                stats.totals.killingDamage.stun += resultRoll.stun;
                stats.totals.killingDamage.body += resultRoll.body;
            }

            stats.totals.knockback += resultRoll.knockback < 0 ? 0 : resultRoll.knockback;
            stats.totals.hitLocations[resultRoll.hitLocationDetails.location.toLowerCase()]++;
        } else if (resultRoll.rollType === TO_HIT) {
            stats.totals.hitRolls++;
        } else if (resultRoll.rollType === FREE_FORM) {
            stats.totals.freeFormRolls++;
        } else if (resultRoll.rollType === SKILL_CHECK) {
            stats.totals.skillChecks++;
        }

        this._updateDistributions(resultRoll.rolls, stats.distributions);

        await AsyncStorage.setItem('statistics', JSON.stringify(stats));
    }

    getMostFrequentHitLocation(hitLocationStats) {
        let location = {
            location: '',
            hits: 0
        };

        for (let property in hitLocationStats) {
            if (hitLocationStats.hasOwnProperty(property)) {
                if (hitLocationStats[property] > location.hits) {
                    location = {
                        location: property,
                        hits: hitLocationStats[property]
                    };
                }
            }
        }

        return location;
    }

    _updateDistributions(rolls, distributions) {
        for (let roll of rolls) {
            switch(roll) {
                case 1:
                    distributions.one++;
                    break;
                case 2:
                    distributions.two++;
                    break;
                case 3:
                    distributions.three++;
                    break;
                case 4:
                    distributions.four++;
                    break;
                case 5:
                    distributions.five++;
                    break;
                case 6:
                    distributions.six++;
                    break;
                default:
                    // do nothing
            }
        }
    }
}

export let statistics = new Statistics();