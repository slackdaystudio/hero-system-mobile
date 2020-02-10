import { Alert } from 'react-native';
import Modifier from './Modifier';
import { heroDesignerCharacter } from '../../lib/HeroDesignerCharacter';

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

export default class Aoe extends Modifier {
    constructor(decorated) {
        super(decorated.modifier, decorated.trait, decorated.getCharacter);

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

        if (heroDesignerCharacter.isFifth(this.decorated.getCharacter())) {
            cost += template.basecost;
        } else {
            cost += this._getMultiplications(this.decorated.modifier.levels, template.lvlmultiplier, template.lvlpower) * template.lvlcost;
        }

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
        let stepAdders = ['DOUBLEAREA', 'DOUBLEHEIGHT', 'DOUBLEWIDTH', 'MOBILE'];
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

            if (heroDesignerCharacter.isFifth(this.decorated.getCharacter())) {
                adderCost += adder.levels / adderTemplate.lvlval * adderTemplate.lvlcost;
            } else {
                adderCost += this._getMultiplications(adder.levels, adderTemplate.lvlmultiplier + 1, adderTemplate.lvlpower) * adderTemplate.lvlcost;
            }
        } else {
            adderCost += adder.basecost;
        }

        return adderCost;
    }

    _getMultiplications(levels, levelMultiplier, levelPower) {
        let multiplications = Math.ceil(Math.log((levels / levelMultiplier)) / Math.log(levelPower));
        multiplications = multiplications < 1 ? 1 : multiplications;

        return multiplications;
    }
}
