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

export default class ResistantProtection extends CharacterTrait {
    constructor(characterTrait) {
        super(characterTrait.trait, characterTrait.listKey, characterTrait.getCharacter);

        this.characterTrait = characterTrait;
    }

    cost() {
        let cost = this.characterTrait.trait.basecost;

        cost += Math.ceil(this.characterTrait.trait.levels / this.characterTrait.trait.template.lvlval) * this.characterTrait.trait.template.lvlcost;

        cost += common.totalAdders(this.characterTrait.trait.adder);

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
        let attributes = this.characterTrait.attributes();

        if (this.characterTrait.trait.pdlevels > 0) {
            attributes.push({
                label: 'Physical Defense',
                value: this.characterTrait.trait.pdlevels,
            });
        }

        if (this.characterTrait.trait.edlevels > 0) {
            attributes.push({
                label: 'Energy Defense',
                value: this.characterTrait.trait.edlevels,
            });
        }

        if (this.characterTrait.trait.mdlevels > 0) {
            attributes.push({
                label: 'Mental Defense',
                value: this.characterTrait.trait.mdlevels,
            });
        }

        if (this.characterTrait.trait.powdlevels > 0) {
            attributes.push({
                label: 'Power Defense',
                value: this.characterTrait.trait.powdlevels,
            });
        }

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

    calculateDefenseCost(levels) {
        let cost = 0;

        if (levels === 1) {
            cost += this.characterTrait.trait.template.lvlcost;
        } else if (levels > 1) {
            cost += common.getMultiplierCost(
                levels,
                this.characterTrait.trait.template.lvlval,
                this.characterTrait.trait.template.lvlcost
            );
        }

        return cost;
    }
}
