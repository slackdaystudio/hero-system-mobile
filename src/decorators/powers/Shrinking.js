import { Alert } from 'react-native';
import CharacterTrait from '../CharacterTrait';
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

CUT_OFF_POINT = 0.0009;

export default class Shrinking extends CharacterTrait {
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
        let attributes = this.characterTrait.attributes();
        let alterations = this._getAlterations();

        attributes.push({
            label: 'Height',
            value: `${alterations.height} m`
        });

        attributes.push({
            label: 'Weight',
            value: `${alterations.mass} kg`
        });

        attributes.push({
            label: 'Perception Rolls',
            value: alterations.perception
        });

        attributes.push({
            label: 'DCV',
            value: `+${alterations.dcv}`
        });

        attributes.push({
            label: 'Knockback',
            value: `+${alterations.knockback}m`
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

    _getAlterations() {
        let character = this.characterTrait.getCharacter();
        let height = this._getAlteredHeight(
            common.toCm(character.characterInfo.height),
            this.characterTrait.trait.template.heightincrease,
            this.characterTrait.trait.levels,
            this.characterTrait.trait.template.heightincreaselevels
        );
        let mass = this._getAlteredMass(
            common.toKg(character.characterInfo.weight),
            this.characterTrait.trait.template.massmultiplier,
            this.characterTrait.trait.levels,
            this.characterTrait.trait.template.massmultiplierlevels
        );

        return {
           height: height,
           mass: mass,
           perception: this.characterTrait.trait.levels / this.characterTrait.trait.template.perincreaselevels * this.characterTrait.trait.template.perincrease,
           dcv: this.characterTrait.trait.template.dcvincrease * (this.characterTrait.trait.levels / this.characterTrait.trait.template.dcvincreaselevels),
           knockback: this.characterTrait.trait.template.kbincrease * (this.characterTrait.trait.levels / this.characterTrait.trait.template.kbincreaselevels)
       };
    }

    _getAlteredMass(kg, massMultiplier, shrinkingLevels, massMultiplierLevels) {
        let weight = kg * 1000 * massMultiplier ** (shrinkingLevels / massMultiplierLevels) / 1000;

        return weight > CUT_OFF_POINT ? Math.round(weight * 10000) / 10000 : weight.toExponential(3);
    }

    _getAlteredHeight(cm, heightMultiplier, shrinkingLevels, heightMultiplierLevels) {
        let height = cm * heightMultiplier ** (shrinkingLevels / heightMultiplierLevels);

        return height > CUT_OFF_POINT ? Math.round(height * 100) / 10000 : height.toExponential(3);
    }
}