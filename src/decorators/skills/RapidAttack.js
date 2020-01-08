import { Alert } from 'react-native';
import CharacterTrait from '../CharacterTrait';

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

export default class RapidAttack extends CharacterTrait {
    constructor(characterTrait) {
        super(characterTrait.trait, characterTrait.listKey, characterTrait.getCharacter);

        this.characterTrait = characterTrait;
    }

    cost() {
        let cost = 10;

        if (this.characterTrait.trait.hasOwnProperty('modifier')) {
            if (Array.isArray(this.characterTrait.trait.modifier)) {
                for (let modifier of this.characterTrait.trait.modifier) {
                    if (modifier.xmlid.toUpperCase() === 'HTHONLY' || modifier.xmlid.toUpperCase() === 'RANGEDONLY') {
                        cost--;
                        break;
                    }
                }
            } else {
                if (this.characterTrait.trait.modifier.xmlid.toUpperCase() === 'HTHONLY' || this.characterTrait.trait.modifier.xmlid.toUpperCase() === 'RANGEDONLY') {
                    cost--;
                }
            }
        }

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
}
