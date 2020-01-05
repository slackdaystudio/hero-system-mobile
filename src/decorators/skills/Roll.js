import { Alert } from 'react-native';
import CharacterTrait from '../CharacterTrait';
import { SKILL_CHECK } from '../../lib/DieRoller';
import { heroDesignerCharacter } from '../../lib/HeroDesignerCharacter';
import { common } from '../../lib/Common';

// Copyright 2020 Philip J. Guinchard
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

export const SKILL_ROLL_BASE = 9;

const SKILL_FAMILIARITY_BASE = 8;

const SKILL_PROFICIENCY_BASE = 10;

const SKILL_GENERAL_CHARACTERISTIC = 11;

export default class Roll extends CharacterTrait {
    constructor(characterTrait) {
        super(characterTrait.trait, characterTrait.listKey, characterTrait.getCharacter);

        this.characterTrait = characterTrait;
    }

    cost() {
        return this.characterTrait.cost();
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
        let roll = null;

        if (this.characterTrait.trait.proficiency) {
            roll = SKILL_PROFICIENCY_BASE;
        } else if (this.characterTrait.trait.familiarity || this.characterTrait.trait.everyman) {
            roll = SKILL_FAMILIARITY_BASE
        } else if (this.characterTrait.trait.hasOwnProperty('characteristic') && this.characterTrait.trait.characteristic === 'GENERAL') {
            if (this.characterTrait.trait.xmlid.toUpperCase() !== 'COMBAT_LEVELS') {
                roll = SKILL_GENERAL_CHARACTERISTIC;
            }
        } else if (this.characterTrait.trait.hasOwnProperty('characteristic')) {
            let powersMap = common.toMap(common.flatten(this.characterTrait.getCharacter().powers, 'powers'));
            let characteristic = this.characterTrait.getCharacter().characteristics.filter(c => c.shortName.toLowerCase() === this.characterTrait.trait.characteristic.toLowerCase()).shift();

            roll = parseInt(heroDesignerCharacter.getRollTotal(characteristic, powersMap).slice(0, -1), 10);
        }

        if (roll !== null) {
            roll = `${roll + this.characterTrait.trait.levels}-`;
        }

        return {
            roll: roll,
            type: SKILL_CHECK
        }
    }

    advantages() {
        return this.characterTrait.advantages();
    }

    limitations() {
        return this.characterTrait.limitations();
    }
}