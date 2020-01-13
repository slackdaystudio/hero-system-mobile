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

export default class SkillLevelsOnly extends CharacterTrait {
    constructor(characterTrait) {
        super(characterTrait.trait, characterTrait.listKey, characterTrait.getCharacter);

        this.characterTrait = characterTrait;
    }

    cost() {
        let levelCost = 0;
        let levelValue = 0;

        if (Array.isArray(this.characterTrait.trait.template.characteristicChoice.item)) {
            for (let item of this.characterTrait.trait.template.characteristicChoice.item) {
                if (item.characteristic.toUpperCase() === this.characterTrait.trait.characteristic.toUpperCase()) {
                    levelCost = item.lvlcost;
                    levelValue = item.lvlval;
                    break;
                }
            }
        } else {
            levelCost = this.characterTrait.trait.template.characteristicChoice.item.lvlcost;
            levelValue = this.characterTrait.trait.template.characteristicChoice.item.lvlval;
        }

        if (this.characterTrait.trait.hasOwnProperty('adder')) {
            return this.characterTrait.trait.levels / levelValue * levelCost + (this.characterTrait.cost() - this.characterTrait.trait.levels / levelValue * levelCost);
        }

        return this.characterTrait.trait.levels / levelValue * levelCost;
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
        return `${this.characterTrait.label()} (+${this.characterTrait.trait.levels})`;
    }

    attributes() {
        let attributes = this.characterTrait.attributes();

        attributes.push({
            label: 'Total Levels',
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
}
