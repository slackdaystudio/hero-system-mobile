import { Alert } from 'react-native';
import CharacterTrait from './CharacterTrait';

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

export default class SkillWithSubAdders extends CharacterTrait {
    constructor(characterTrait) {
        super(characterTrait.trait, characterTrait.listKey, characterTrait.getCharacter);

        this.characterTrait = characterTrait;
    }

    cost() {
        let cost = 3;

        if (this.characterTrait.trait.hasOwnProperty('adder')) {
            cost = this._totalAdders(this.characterTrait.trait.adder);
        }

        cost += this.characterTrait.trait.levels / this.characterTrait.trait.template.characteristicChoice.item.lvlval * this.characterTrait.trait.template.characteristicChoice.item.lvlcost;

        return cost;
    }

    costMultiplier() {
        return this.characterTrait.costMultiplier();
    }

    activeCost() {
        return this.characterTrait.activeCost();
    }

    realCost() {
        return this.characterTrait.realCost();
    }

    label() {
        return this.characterTrait.label();
    }

    attributes() {
        return this.characterTrait.attributes();
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

    _totalAdders(adder) {
        let cost = 0;

        if (Array.isArray(adder)) {
            for (let a of adder) {
                cost += this._totalAdder(a);
            }
        } else {
            cost += this._totalAdder(adder);
        }

        return cost;
    }

    _totalAdder(adder) {
        let cost = 0;

        if (adder.hasOwnProperty('adder')) {
            cost += this._totalAdders(adder.adder);
        } else {
            cost += adder.basecost;
        }

        return cost;
    }
}
