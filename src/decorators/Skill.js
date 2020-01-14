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

export default class Skill extends CharacterTrait {
    constructor(characterTrait) {
        super(characterTrait.trait, characterTrait.listKey, characterTrait.getCharacter);

        this.characterTrait = characterTrait;
    }

    cost() {
        let cost = this.characterTrait.cost();

        if (this.characterTrait.trait.type === 'list') {
            return cost;
        }

        if (this.characterTrait.trait.xmlid.toUpperCase() === 'CUSTOMSKILL') {
            cost = this.characterTrait.trait.basecost + (this.characterTrait.trait.levels * this.characterTrait.trait.template.lvlcost);
        } else if (this.characterTrait.trait.proficiency) {
            cost = 2;
        } else if (this.characterTrait.trait.familiarity || this.characterTrait.trait.everyman || this.characterTrait.trait.nativeTongue) {
            cost = this.characterTrait.trait.familiarity ? 1 : 0;
        } else if (this.characterTrait.trait.xmlid.toUpperCase() === 'LANGUAGES') {
            for (let option of this.characterTrait.trait.template.option) {
                if (option.xmlid.toUpperCase() === this.characterTrait.trait.optionid.toUpperCase()) {
                    cost = option.basecost;
                    break;
                }
            }
        } else if (this.characterTrait.trait.hasOwnProperty('characteristic')) {
            cost = this._getCostByCharacteristic();
        }

        return cost;
    }

    costMultiplier() {
        return this.characterTrait.costMultiplier();
    }

    activeCost() {
        return this.cost();
    }

    realCost() {
        return this.cost();
    }

    label() {
        let name = this.trait.name === null || this.trait.name === '' ? '' : this.trait.name;
        let label = this.trait.name === null || this.trait.name === '' ? this.trait.alias : ` (${this.trait.alias})`;
        let input = this.trait.input === null || this.trait.input === undefined ? '' : `: ${this.trait.input}`;

        return `${name}${label}${input}`;
    }

    attributes() {
        return this.characterTrait.attributes();
    }

    definition() {
        return this.characterTrait.definition();
    }

    roll() {
        return this.characterTrait.trait.roll;
    }

    advantages() {
        return this.characterTrait.advantages();
    }

    limitations() {
        return this.characterTrait.limitations();
    }

    _getCostByCharacteristic() {
        let cost = 0;
        let basecost = 0;
        let skillLevelCost = 0;

        if (Array.isArray(this.characterTrait.trait.template.characteristicChoice.item)) {
            for (let item of this.characterTrait.trait.template.characteristicChoice.item) {
                if (item.characteristic.toLowerCase() === this.characterTrait.trait.characteristic.toLowerCase()) {
                    basecost = item.basecost;
                    skillLevelCost = item.lvlcost;
                }
            }
        } else {
            basecost = this.characterTrait.trait.template.characteristicChoice.item.basecost;
            skillLevelCost = this.characterTrait.trait.template.characteristicChoice.item.lvlcost;
        }

        cost = basecost + (this.characterTrait.trait.levels * skillLevelCost);

        return cost;
    }
}
