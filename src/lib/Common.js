import {Dimensions, Platform} from 'react-native';
import Toast from 'react-native-toast-message';
import camelCase from 'camelcase';
import snakeCase from 'snake-case';
import merge from 'deepmerge';
import {PARTIAL_DIE_PLUS_ONE, PARTIAL_DIE_HALF, PARTIAL_DIE_MINUS_ONE} from './DieRoller';

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

    isArrayEqual(first, second) {
        if (!Array.isArray(first) || !Array.isArray(second)) {
            return false;
        }

        if (first.length !== second.length) {
            return false;
        }

        for (let i = 0; i < first.length; i++) {
            if (first[i] !== second[i]) {
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
            return value % 1 !== 0;
        }

        return false;
    }

    getMultiplications(total, step = 2) {
        return Math.ceil(Math.log(total) / Math.log(step));
    }

    getMultiplierCost(total, step, cost) {
        if (step === 1) {
            return (total / step) * cost;
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
                total += Math.round((adder.levels / adder.lvlval) * adder.lvlcost);
            }
        }

        return total;
    }

    hasModifier(modifierXmlid, power) {
        if (power.hasOwnProperty('type') && power.type === 'power') {
            if (power.modifier !== undefined && power.modifier !== null) {
                if (Array.isArray(power.modifier)) {
                    return power.modifier.some((m) => m.xmlid === modifierXmlid);
                } else {
                    return power.modifier.xmlid === modifierXmlid;
                }
            }
        }

        return false;
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

    toMap(objects, mapKey = 'xmlid') {
        let map = new Map();

        if (objects === undefined || objects === null) {
            return map;
        }

        if (Array.isArray(objects)) {
            for (let object of objects) {
                if (object.hasOwnProperty(mapKey)) {
                    if (map.has(object[mapKey])) {
                        if (Array.isArray(map.get(object[mapKey]))) {
                            map.get(object[mapKey]).push(object);
                        } else {
                            map.set(object[mapKey], [map.get(object[mapKey]), object]);
                        }
                    } else {
                        map.set(object[mapKey], object);
                    }
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

    toCamelCase(text) {
        return camelCase(text);
    }

    toSnakeCase(text) {
        return snakeCase(text);
    }

    capitalize(word) {
        return word.toLowerCase().charAt(0).toUpperCase() + word.slice(1);
    }

    toast(message, type = 'error', title = 'HERO System Mobile', duration = 3000) {
        Toast.show({
            type: type.toLowerCase(),
            text1: `${title}: ${this.capitalize(type)}`,
            text2: message + (type.toLowerCase() === 'error' ? '\n\nSwipe up to dismiss' : ''),
            position: 'bottom',
            autoHide: type.toLowerCase() === 'success',
            visibilityTime: duration,
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
            partial: 0,
        };

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

    merge(left, right) {
        return merge(left, right);
    }
}

export let common = new Common();
