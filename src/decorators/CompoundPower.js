import { Alert } from 'react-native';
import CharacterTrait from './CharacterTrait';
import { common } from './../lib/Common';

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

export default class CompoundPower extends CharacterTrait {
    constructor(characterTrait, characterTraitDecorator) {
        super(characterTrait.trait, characterTrait.listKey, characterTrait.getCharacter);

        this.characterTrait = characterTrait;
        this.characterTraitDecorator = characterTraitDecorator;
        this.powers = this._getCompoundPowers(this.characterTrait.trait.powers);
    }

    cost() {
        let cost = 0;

        for (let power of this.powers) {
            cost += power.cost();
        }

        return cost;
    }

    costMultiplier() {
        return this.characterTrait.costMultiplier();
    }

    activeCost() {
        let activeCost = 0;

        for (let power of this.powers) {
            activeCost += power.activeCost();
        }

        return activeCost;
    }

    realCost() {
        let realCost = 0;

        for (let power of this.powers) {
            realCost += power.realCost();
        }

        return realCost;
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

    _getCompoundPowers(powers) {
        let compoundPowers = [];

        if (Array.isArray(powers)) {
            for (let power of powers) {
                compoundPowers = compoundPowers.concat(this._getCompoundPowers(power));
            }
        } else {
            compoundPowers.push(this.characterTraitDecorator.decorate(powers, this.characterTrait.listKey, this.characterTrait.getCharacter));
        }

        return compoundPowers;
    }
}
