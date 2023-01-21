import CharacterTrait from './CharacterTrait';
import {heroDesignerCharacter} from '../lib/HeroDesignerCharacter';
import {common} from '../lib/Common';

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

export default class UnusualDefense extends CharacterTrait {
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
        const attributes = this.characterTrait.attributes();
        let points = this.characterTrait.trait.levels;

        if (this.characterTrait.trait.xmlid === 'MENTALDEFENSE' && heroDesignerCharacter.isFifth(this.characterTrait.getCharacter())) {
            points += common.roundInPlayersFavor(heroDesignerCharacter.getCharacteristicTotal('EGO', this.getCharacter()) / 5);
        }

        attributes.push({
            label: 'Points',
            value: points,
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
