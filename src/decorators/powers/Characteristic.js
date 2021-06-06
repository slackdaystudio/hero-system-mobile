import CharacterTrait from '../CharacterTrait';
import {common} from '../../lib/Common';
import {heroDesignerCharacter} from '../../lib/HeroDesignerCharacter';

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

export default class Characteristic extends CharacterTrait {
    constructor(characterTrait) {
        super(characterTrait.trait, characterTrait.listKey, characterTrait.getCharacter);

        this.characterTrait = characterTrait;
    }

    cost() {
        if (this.characterTrait.trait.levels === 0) {
            let value = heroDesignerCharacter.getCharacteristicTotal(this.characterTrait.trait.xmlid, this.characterTrait.getCharacter());

            return common.roundInPlayersFavor((value / this.characterTrait.trait.template.lvlval) * this.characterTrait.trait.template.lvlcost);
        }

        let cost = (this.characterTrait.trait.levels / this.characterTrait.trait.template.lvlval) * this.characterTrait.trait.template.lvlcost;

        cost += common.totalAdders(this.characterTrait.trait.adder);

        return Math.ceil(cost);
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
        return `${heroDesignerCharacter.getCharacteristicFullName(this.characterTrait.trait.xmlid)}: +${this.characterTrait.trait.levels}`;
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
}
