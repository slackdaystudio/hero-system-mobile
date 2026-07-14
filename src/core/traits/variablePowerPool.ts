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

import {roundInPlayersFavor} from 'core/util';
import {CharacterTrait} from './characterTrait';
import {TraitDecorator} from './traitDecorator';

/** Variable Power Pool control cost, ported from legacy `decorators/VariablePowerPool.js`. */
export default class VariablePowerPool extends TraitDecorator {
    private controlCost: number;

    constructor(characterTrait: CharacterTrait) {
        super(characterTrait);

        this.controlCost = this.getControlCost();
    }

    cost(): number {
        return this.controlCost + this.characterTrait.trait.levels;
    }

    activeCost(): number {
        return this.getControlActiveCost() + this.characterTrait.trait.levels;
    }

    realCost(): number {
        const realCost = this.getControlActiveCost() / (1 - this.limitations()!.reduce((a: number, b: {cost: number}) => a + b.cost, 0));

        return roundInPlayersFavor(realCost) + this.characterTrait.trait.levels;
    }

    private getControlCost(): number {
        let cost = Math.round(this.characterTrait.trait.levels * 0.5);

        if (this.characterTrait.trait.adder) {
            const adder = this.characterTrait.trait.adder;

            if (adder.xmlid.toUpperCase() === 'CONTROLCOST') {
                cost = (adder.levels / adder.lvlval) * adder.lvlcost;
            }
        }

        return cost;
    }

    private getControlActiveCost(): number {
        return roundInPlayersFavor(this.controlCost * (1 + this.advantages()!.reduce((a: number, b: {cost: number}) => a + b.cost, 0)));
    }
}
