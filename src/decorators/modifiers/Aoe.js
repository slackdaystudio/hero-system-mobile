import { Alert } from 'react-native';
import Modifier from './Modifier';

export default class Aoe extends Modifier {
    constructor(decorated) {
        super(decorated.modifier, decorated.trait);

        this.decorated = decorated;
    }

    cost() {
        let cost = 0;
        let template = this.decorated.modifier.template.option[0];

        for (let type of this.decorated.modifier.template.option) {
            if (this.decorated.modifier.optionid.toUpperCase() === type.xmlid.toUpperCase()) {
                template = type;
                break;
            }
        }

        cost += this._getMultiplications(this.decorated.modifier.levels, template.lvlmultiplier, template.lvlpower) * template.lvlcost;

        if (this.decorated.modifier.hasOwnProperty('adder')) {
           if (Array.isArray(this.decorated.modifier.adder)) {
               for (let adder of this.decorated.modifier.adder) {
                   cost += this._getAoeAdderCost(adder, template);
               }
           } else {
               cost += this._getAoeAdderCost(this.decorated.modifier.adder, template);
           }
        }

        return cost;
    }

    label(cost) {
        return this.decorated.label(this.cost());
    }

    _getAoeAdderCost(adder, template) {
        let stepAdders = ['DOUBLEHEIGHT', 'DOUBLEWIDTH', 'MOBILE'];
        let adderCost = 0;

        if (stepAdders.includes(adder.xmlid.toUpperCase())) {
            let adderTemplate = null;

            if (Array.isArray(template.adder)) {
                for (let a of template.adder) {
                    if (adder.xmlid.toUpperCase() === a.xmlid.toUpperCase()) {
                        adderTemplate = a;
                        break;
                    }
                }
            } else {
                adderTemplate = template.adder;
            }

            adderCost += this._getMultiplications(adder.levels, adderTemplate.lvlmultiplier + 1, adderTemplate.lvlpower) * adderTemplate.lvlcost;
        } else {
           adderCost += adder.basecost;
        }

        return adderCost;
    }

    _getMultiplications(levels, levelMultiplier, levelPower) {
        multiplications = Math.ceil(Math.log((levels / levelMultiplier)) / Math.log(levelPower));
        multiplications = multiplications < 1 ? 1 : multiplications;

        return multiplications;
    }
}