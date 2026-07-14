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

import {heroDesignerCharacter} from 'core/hero';
import {type Obj} from '../characterTrait';
import Modifier from './modifier';

/** Area-of-Effect advantage cost, ported from legacy `modifiers/Aoe.js`. */
export default class Aoe extends Modifier {
    private decorated: Modifier;

    constructor(decorated: Modifier) {
        super(decorated.modifier, decorated.trait, decorated.getCharacter);

        this.decorated = decorated;
    }

    cost(): number {
        let cost = 0;
        let template = this.decorated.modifier.template.option[0];

        for (const type of this.decorated.modifier.template.option) {
            if (this.decorated.modifier.optionid.toUpperCase() === type.xmlid.toUpperCase()) {
                template = type;
                break;
            }
        }

        if (heroDesignerCharacter.isFifth(this.decorated.getCharacter())) {
            cost += template.basecost;
        } else {
            cost += this.getMultiplications(this.decorated.modifier.levels, template.lvlmultiplier, template.lvlpower) * template.lvlcost;
        }

        if (Object.prototype.hasOwnProperty.call(this.decorated.modifier, 'adder')) {
            if (Array.isArray(this.decorated.modifier.adder)) {
                for (const adder of this.decorated.modifier.adder) {
                    cost += this.getAoeAdderCost(adder, template);
                }
            } else {
                cost += this.getAoeAdderCost(this.decorated.modifier.adder, template);
            }
        }

        return cost;
    }

    label(): string {
        return this.decorated.label(this.cost());
    }

    private getAoeAdderCost(adder: Obj, template: Obj): number {
        const stepAdders = ['DOUBLEAREA', 'DOUBLEHEIGHT', 'DOUBLEWIDTH', 'MOBILE'];
        let adderCost = 0;

        if (stepAdders.includes(adder.xmlid.toUpperCase())) {
            let adderTemplate = null;

            if (Array.isArray(template.adder)) {
                for (const a of template.adder) {
                    if (adder.xmlid.toUpperCase() === a.xmlid.toUpperCase()) {
                        adderTemplate = a;
                        break;
                    }
                }
            } else {
                adderTemplate = template.adder;
            }

            if (heroDesignerCharacter.isFifth(this.decorated.getCharacter())) {
                adderCost += (adder.levels / adderTemplate.lvlval) * adderTemplate.lvlcost;
            } else {
                adderCost += this.getMultiplications(adder.levels, adderTemplate.lvlmultiplier + 1, adderTemplate.lvlpower) * adderTemplate.lvlcost;
            }
        } else {
            adderCost += adder.basecost;
        }

        return adderCost;
    }

    private getMultiplications(levels: number, levelMultiplier: number, levelPower: number): number {
        const multiplications = Math.ceil(Math.log(levels / levelMultiplier) / Math.log(levelPower));

        return multiplications < 1 ? 1 : multiplications;
    }
}
