import { Dimensions, Platform, Alert } from 'react-native';
import { Toast } from 'native-base';
import AsyncStorage from '@react-native-community/async-storage';
import camelCase from 'camelcase';
import snakeCase from 'snake-case';
import {
    KILLING_DAMAGE,
    NORMAL_DAMAGE,
    PARTIAL_DIE_PLUS_ONE,
    PARTIAL_DIE_HALF,
    PARTIAL_DIE_MINUS_ONE
} from './DieRoller';

class Common {
    isIPad() {
	    let {height, width} = Dimensions.get('window');

	    if (Platform.OS === 'ios' && height / width <= 1.6) {
		    return true;
	    }

	    return false;
    }

    compare(first, second) {
        if (first === null || typeof first !== 'object' || second === null || typeof second !== 'object') {
            return false;
        }

        for (let prop in first) {
            if (!second.hasOwnProperty(prop)) {
                return false;
            }
        }

        return true;
    }

    isEmptyObject(obj) {
        if (obj === null || obj === undefined) {
            return true;
        }

        return Object.keys(obj).length === 0 && obj.constructor === Object;
    }

    isInt(value) {
        return !isNaN(value) && value % 1 === 0;
    }

    isFloat(value) {
        if (!isNaN(value)) {
    		return (value % 1 !== 0);
    	}

    	return false;
    }

    getMultiplications(total, step=2) {
        return Math.ceil(Math.log(total) / Math.log(step));
    }

    getMultiplierCost(total, step, cost) {
        if (step === 1) {
            return total / step * cost;
        }

        return this.getMultiplications(total, step) * cost;
    }

    totalAdders(adder) {
        let total = 0;

        if (adder === undefined || adder === null) {
            return total;
        }

        if (Array.isArray(adder)) {
            for (let a of adder) {
                total += this.totalAdders(a);
            }
        } else {
            total += adder.basecost;

            if (adder.levels > 0) {
                total += Math.round(adder.levels / adder.lvlval * adder.lvlcost);
            }
        }

        return total;
    }

    flatten(items, key) {
        let flattened = [];

        for (let item of items) {
            if (item.type === 'list' && item.hasOwnProperty(key)) {
                flattened = flattened.concat(this.flatten(item[key], key));
            } else {
                flattened.push(item);
            }
        }

        return flattened;
    }

    toMap(objects, mapKey='xmlid') {
        let map = new Map();

        if (objects === undefined || objects === null) {
            return map;
        }

        if (Array.isArray(objects)) {
            for (let object of objects) {
                if (object.hasOwnProperty(mapKey)) {
                    map.set(object[mapKey], object);
                }
            }
        } else {
            if (objects.hasOwnProperty(mapKey)) {
                map.set(objects[mapKey], objects);
            }
        }

        return map;
    }

    roundInPlayersFavor(toBeRounded) {
        let rounded = toBeRounded;

        if (common.isFloat(toBeRounded)) {
            if (/0\.5[0-9]/.test((toBeRounded % 1).toFixed(2))) {
                rounded = Math.trunc(toBeRounded);
            } else {
                rounded = Math.round(toBeRounded);
            }
        }

        return rounded;
    }

    async getAppSettings() {
        let settings = await AsyncStorage.getItem('appSettings');

        if (settings === null) {
            return {
                useFifthEdition: false
            };
        }

        return JSON.parse(settings);
    }


    initDamageForm(props = null) {
        if (props === null || props === undefined || props === '') {
            return {
                dice: 12,
                partialDie: "0",
                killingToggled: false,
                damageType: NORMAL_DAMAGE,
                stunMultiplier: 0,
                useHitLocations: false,
                isMartialManeuver: false,
                isTargetFlying: false,
                isTargetInZeroG: false,
                isTargetUnderwater: false,
                rollWithPunch: false,
                isUsingClinging: false,
                isExplosion: false,
                fadeRate: 1,
                useFifthEdition: false,
                tabsLocked: false
            };
        }

        return {
            dice: props.dice || 12,
            partialDie: props.partialDie || 0,
            killingToggled: props.killingToggled || false,
            damageType: props.damageType || NORMAL_DAMAGE,
            stunMultiplier: props.stunMultiplier || 0,
            useHitLocations: props.useHitLocations || false,
            isMartialManeuver: props.isMartialManeuver || false,
            isTargetFlying: props.isTargetFlying || false,
            isTargetInZeroG: props.isTargetInZeroG || false,
            isTargetUnderwater: props.isTargetUnderwater || false,
            rollWithPunch: props.rollWithPunch || false,
            isUsingClinging: props.isUsingClinging || false,
            isExplosion: props.isExplosion || false,
            fadeRate: props.fadeRate || 1,
            useFifthEdition: props.useFifthEdition || false,
            tabsLocked: props.tabsLocked || false,
            skipFormLoad: true
        };
    }

    initFreeFormForm(props = null) {
        if (props === null || props === undefined || props === '') {
            return {
                dice: 1,
                halfDice: 0,
                pips: 0
            };
        }

        return {
            dice: props.dice || 1,
            halfDice: props.halfDice || 0,
            pips: props.pips || 0,
            skipFormLoad: true
        };
    }

    toCamelCase(text) {
        return camelCase(text);
    }

    toSnakeCase(text) {
        return snakeCase(text);
    }

    capitalize(word) {
        return word.toLowerCase().charAt(0).toUpperCase() + word.slice(1);
    }

    toast(message, buttonText='OK', duration=3000) {
        Toast.show({
            text: message,
            position: 'bottom',
            buttonText: buttonText,
            duration: duration
        });
    }

    toKg(lbs) {
        return Math.round(lbs * 0.453592, 1);
    }

    toCm(inches) {
        return Math.round(inches * 2.54, 1);
    }

    toDice(dieCode) {
        let dice = {
            full: 0,
            partial: 0
        }

        if (typeof dieCode !== 'string') {
            return dice;
        }

        let dieParts = dieCode.split('d');

        if (dieParts[0].endsWith('½')) {
            dice.partial = PARTIAL_DIE_HALF;
        } else if (dieParts[1].endsWith('+1')) {
            dice.partial = PARTIAL_DIE_PLUS_ONE;
        } else if (dieParts[1].endsWith('-1')) {
            dice.partial = PARTIAL_DIE_MINUS_ONE;
        }

        if (dieParts[0].endsWith('½')) {
            dice.full = parseInt(dieParts[0].substring(0, dieParts[0].length - 1), 10) || 0;
        } else {
            dice.full = parseInt(dieParts[0], 10) || 0;
        }

        return dice;
    }
}

export let common = new Common();
