import { Alert } from 'react-native';
import CharacterTrait from '../CharacterTrait';
import { common } from '../../lib/Common';

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

export default class Duplication extends CharacterTrait {
    constructor(characterTrait) {
        super(characterTrait.trait, characterTrait.listKey, characterTrait.getCharacter);

        this.characterTrait = characterTrait;
    }

    cost() {
        let cost = 0;

        if (this.characterTrait.trait.points === 0) {
            cost = 1;
        } else {
            cost = Math.round(this.characterTrait.trait.points / this.characterTrait.trait.template.lvlval);
        }

        cost = cost < 1 ? 1 : cost;

        cost += common.totalAdders(this.characterTrait.trait.adder);

        cost += common.getMultiplierCost(
            this.characterTrait.trait.number,
            this.characterTrait.trait.template.multiplierval,
            this.characterTrait.trait.template.multipliercost
        );

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
        let attributes =  this.characterTrait.attributes();

        attributes.push({
            label: 'Points',
            value: this.characterTrait.trait.points,
        });

        attributes.push({
            label: 'Number of Duplicates',
            value: this.characterTrait.trait.number,
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
}
