import { Alert } from 'react-native';
import CharacterTrait from '../CharacterTrait';
import { common } from '../../lib/Common';
import { heroDesignerCharacter } from '../../lib/HeroDesignerCharacter';
import { modifierDecorator } from '../modifiers/ModifierDecorator';
import { KILLING_DAMAGE } from '../../lib/DieRoller';

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

const DC_BASE_COST = 5;

export default class HandKillingAttack extends CharacterTrait {
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

        attributes.push({
            label: 'Dice',
            value: this._getDice(),
        });

        return attributes;
    }

    definition() {
        return this.characterTrait.definition();
    }

    roll() {
        let character = this.getCharacter();
        let adderMap = common.toMap(this.characterTrait.trait.adder);
        let modifierMap = common.toMap(this.characterTrait.trait.modifier);
        let dice = '';
        let roll = {
            roll: '',
            type: KILLING_DAMAGE,
        };
        let damageClasses = this.characterTrait.trait.levels * 3;
        let partialDie = false;
        let remainder = 0;

        if (!modifierMap.has('STRMINIMUM')) {
            damageClasses += Math.floor(heroDesignerCharacter.getCharacteristicByShortName('STR', character) / this._getStrengthDcCost());
        }

        if (adderMap.has('PLUSONEPIP')) {
            damageClasses += 1;
        } else if (adderMap.has('PLUSONEHALFDIE') || adderMap.has('MINUSONEPIP')) {
            damageClasses += 2;
        }

        dice = damageClasses / 3;
        remainder = parseFloat((dice % 1).toFixed(1));

        if (remainder > 0.0) {
            if (remainder >= 0.3 && remainder <= 0.5) {
                roll.roll = `${Math.trunc(dice)}d6+1`;
            } else if (remainder >= 0.6) {
                if (adderMap.has('MINUSONEPIP')) {
                    roll.roll = `${Math.trunc(dice) + 1}d6-1`;
                } else {
                    roll.roll = `${Math.trunc(dice)}½d6`;
                }
            }
        } else {
            roll.roll = `${dice}d6`;
        }

        return roll;
    }

    advantages() {
        return this.characterTrait.advantages();
    }

    limitations() {
        return this.characterTrait.limitations();
    }

    _getDice() {
        let dice = `+${this.characterTrait.trait.levels}`;
        let adderMap = common.toMap(this.characterTrait.trait.adder);

        if (adderMap.has('PLUSONEHALFDIE')) {
            dice += '½d6';
        } else if (adderMap.has('PLUSONEPIP')) {
            dice += 'd6+1';
        } else if (adderMap.has('MINUSONEPIP')) {
            dice += 'd6-1';
        } else {
            dice += 'd6';
        }

        return dice;
    }

    _getStrengthDcCost() {
        return DC_BASE_COST * (1 + this._totalAdvantages(this.characterTrait.trait.modifier));
    }

    _totalAdvantages(modifiers) {
        let total = 0;

        if (modifiers === null || modifiers === undefined) {
            return total;
        }

        if (Array.isArray(modifiers)) {
            for (let modifier of modifiers) {
                total += this._totalAdvantages(modifier);
            }
        } else {
            let decorated = modifierDecorator.decorate(modifiers, this.characterTrait.trait);

            total += decorated.cost() > 0 ? decorated.cost() : 0;
        }

        return total;
    }
}
