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

export default class Barrier extends CharacterTrait {
    constructor(characterTrait) {
        super(characterTrait.trait, characterTrait.listKey, characterTrait.getCharacter);

        this.characterTrait = characterTrait;
    }

    cost() {
        let cost = this.characterTrait.trait.basecost;

        if (heroDesignerCharacter.isFifth(this.characterTrait.getCharacter())) {
            cost += this._getFifthEditionDefenseCost();
        } else {
            cost += this._getSixthEditionDefenseCost();
        }

        cost += common.totalAdders(this.characterTrait.trait.adder);

        return Math.round(cost);
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

        attributes.push({
            label: 'Body',
            value: this.characterTrait.trait.bodylevels,
        });

        if (heroDesignerCharacter.isFifth(this.characterTrait.getCharacter())) {
            attributes.push({
                label: 'Dimensions',
                value: `${this.characterTrait.trait.lengthlevels + 1}" x ${this.characterTrait.trait.heightlevels + 1}"`,
            });
        } else {
            attributes.push({
                label: 'Dimensions',
                value: `${this.characterTrait.trait.lengthlevels + 1}m x ${this.characterTrait.trait.widthlevels + 0.5}m x ${
                    this.characterTrait.trait.heightlevels + 1
                }m`,
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

    _getFifthEditionDefenseCost() {
        let cost = 0;
        let totalDefense = 0;

        totalDefense += this.characterTrait.trait.pdlevels;
        totalDefense += this.characterTrait.trait.edlevels;
        totalDefense += this.characterTrait.trait.mdlevels;
        totalDefense += this.characterTrait.trait.powdlevels;

        cost += (totalDefense / this.characterTrait.trait.template.lvlval) * this.characterTrait.trait.template.lvlcost;
        cost += this.characterTrait.trait.lengthlevels * 2;
        cost += this.characterTrait.trait.heightlevels * 2;

        return cost;
    }

    _getSixthEditionDefenseCost() {
        let cost = 0;
        let totalDefense = 0;

        totalDefense += this.characterTrait.trait.pdlevels;
        totalDefense += this.characterTrait.trait.edlevels;
        totalDefense += this.characterTrait.trait.mdlevels;
        totalDefense += this.characterTrait.trait.powdlevels;

        cost += (totalDefense / this.characterTrait.trait.template.lvlval) * this.characterTrait.trait.template.lvlcost;
        cost += this.characterTrait.trait.lengthlevels;
        cost += this.characterTrait.trait.heightlevels;
        cost += this.characterTrait.trait.bodylevels;
        cost += (this.characterTrait.trait.widthlevels * 4) / this.characterTrait.trait.template.costperinch;

        return cost;
    }
}
