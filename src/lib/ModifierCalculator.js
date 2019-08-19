import { Alert } from 'react-native';

class ModifierCalculator {
    getItemTotalModifiers(item) {
        let totalModifiers = [];

        if (item === null || item === undefined) {
            return totalModifiers;
        }

        if (item.hasOwnProperty('modifier') && item.modifier !== undefined) {
            if (Array.isArray(item.modifier)) {
                for (let modifier of item.modifier) {
                    totalModifiers.push(this.getTotalModifiers(modifier));
                }
            } else {
                totalModifiers.push(this.getTotalModifiers(item.modifier));
            }
        }

        return totalModifiers;
    }

    getTotalModifiers(modifier) {
        // Damage Over Time is funky and an exception to the norm
        if (modifier.xmlid.toUpperCase() === 'DAMAGEOVERTIME') {
            return this._handleDoT(modifier);
        }

        let basecost = modifier.basecost + (modifier.levels > 0 ? modifier.lvlcost * modifier.levels : 0);

        let totalModifiers = this._getAdderTotal(basecost, modifier.modifier, modifier);

        if (modifier.hasOwnProperty('adder')) {
            if (Array.isArray(modifier.adder)) {
                for (let adder of modifier.adder) {
                    totalModifiers += this._getAdderTotal(adder.basecost, modifier.modifier, modifier) || 0;
                }
            } else {
                totalModifiers += this._getAdderTotal(modifier.adder.basecost, modifier.modifier, modifier) || 0;
            }
        }

        return totalModifiers;
    }

    _getAdderTotal(cost, subModifier, modifier) {
        let totalAdderCost = cost;

        if (subModifier !== undefined) {
            if (Array.isArray(subModifier)) {
                for (let mod of subModifier) {
                    totalAdderCost += this._getAdderTotal(mod.cost, mod, modifier);
                }
            } else {
                totalAdderCost *= 2;
            }
        }

        return totalAdderCost;
    }

    _handleDoT(modifier) {
        let totalCost = modifier.basecost;
        let incrementCost = this._getAdderByXmlId('INCREMENTS', modifier.adder).basecost || 0;
        let timeCost = this._getAdderByXmlId('TIMEBETWEEN', modifier.adder).basecost || 0;

        if (modifier.modifier !== undefined) {
            if (Array.isArray(modifier.modifier)) {
                for (let mod of modifier.modifier) {
                    if (mod.xmlid.toUpperCase() === 'ONEDEFENSE') {
                        incrementCost *= 2;
                    } else if (mod.xmlid.toUpperCase() === 'LOCKOUT') {
                        if (timeCost > 0) {
                            timeCost = 0;
                        } else {
                            timeCost *= 2;
                        }
                    }
                }
            } else {
                if (modifier.modifier.xmlid.toUpperCase() === 'ONEDEFENSE') {
                    incrementCost *= 2;
                } else if (modifier.modifier.xmlid.toUpperCase() === 'LOCKOUT') {
                    if (timeCost > 0) {
                        timeCost = 0;
                    } else {
                        timeCost *= 2;
                    }
                }
            }
        }

        return totalCost + incrementCost + timeCost;
    }

    _getAdderByXmlId(xmlId, adders) {
        for (let adder of adders) {
            if (adder.xmlid.toUpperCase() === xmlId.toUpperCase()) {
                return adder;
            }
        }

        return null;
    }
}

export let modifierCalculator = new ModifierCalculator();