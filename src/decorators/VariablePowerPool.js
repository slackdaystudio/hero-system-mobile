import CharacterTrait from './CharacterTrait';
import {common} from './../lib/Common';

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

export default class VariablePowerPool extends CharacterTrait {
    constructor(characterTrait) {
        super(characterTrait.trait, characterTrait.listKey, characterTrait.getCharacter);

        this.characterTrait = characterTrait;
        this.controlCost = this._getControlCost();
    }

    cost() {
        return this.controlCost + this.characterTrait.trait.levels;
    }

    costMultiplier() {
        return this.characterTrait.costMultiplier();
    }

    activeCost() {
        return this._getControlActiveCost() + this.characterTrait.trait.levels;
    }

    realCost() {
        let realCost = this._getControlActiveCost() / (1 - this.limitations().reduce((a, b) => a + b.cost, 0));

        return common.roundInPlayersFavor(realCost) + this.characterTrait.trait.levels;
    }

    label() {
        return this.characterTrait.label();
    }

    attributes() {
        let attributes = this.characterTrait.attributes();

        attributes.push({
            label: 'Base Pool',
            value: this.characterTrait.trait.levels,
        });

        return attributes;
    }

    definition() {
        return this.characterTrait.definition();
    }

    roll() {
        return this.characterTrait.roll();
    }

    advantages() {
        return this.characterTrait.advantages();
    }

    limitations() {
        return this.characterTrait.limitations();
    }

    _addAdder(adder) {
        let cost = 0;

        if (adder === undefined || adder === null) {
            return cost;
        }

        if (Array.isArray(adder)) {
            for (let a of adder) {
                cost += this._addAdder(a);
            }
        } else {
            cost += adder.basecost;

            if (adder.levels > 0) {
                cost = (adder.levels / adder.lvlval) * adder.lvlcost;
            }
        }

        return cost;
    }

    _getControlCost() {
        let cost = Math.round(this.characterTrait.trait.levels * 0.5);

        if (this.characterTrait.trait.adder) {
            for (const adder of this.characterTrait.trait.adder) {
                if (adder.xmlid.toUpperCase() === 'CONTROLCOST') {
                    cost = (adder.levels / adder.lvlval) * adder.lvlcost;
                    break;
                }
            }
        }

        return cost;
    }

    _getControlActiveCost() {
        return common.roundInPlayersFavor(this.controlCost * (1 + this.advantages().reduce((a, b) => a + b.cost, 0)));
    }
}
