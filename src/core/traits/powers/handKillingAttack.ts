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

import {toMap} from 'core/util';
import {RollType} from 'core/dice';
import {heroDesignerCharacter} from 'core/hero';
import {type Obj, type RollDescriptor} from '../characterTrait';
import {TraitDecorator} from '../traitDecorator';
import {modifierDecorator} from '../modifiers/modifierDecorator';

const DC_BASE_COST = 5;

const DAMAGE_AFFECTING_ADVANTAGES = [
    'AOE',
    'ARMORPIERCING',
    'AVAD',
    'AUTOFIRE',
    'CHARGES',
    'CONSTANT',
    'CUMULATIVE',
    'DAMAGEOVERTIME',
    'DOESBODY',
    'DOESKB',
    'DOUBLEKB',
    'INCREASEDSTUNMULTIPLIER',
    'MEGASCALE',
    'PENETRATING',
    'STICKY',
    'TIMELIMIT',
    'TRANSDIMENSIONAL',
    'TRIGGER',
    'UNCONTROLLED',
    'UAA',
    'VARIABLEADVANTAGE',
    'VARIABLESFX',
];

/** Hand Killing Attack, ported from legacy `powers/HandKillingAttack.js`. */
export default class HandKillingAttack extends TraitDecorator {
    roll(): RollDescriptor {
        const character = this.characterTrait.getCharacter();
        const adderMap = toMap(this.characterTrait.trait.adder);
        const modifierMap = toMap(this.characterTrait.trait.modifier);
        const roll: RollDescriptor = {roll: '', type: RollType.KillingDamage};
        let damageClasses = this.characterTrait.trait.levels * 3;

        if (!modifierMap.has('STRMINIMUM')) {
            damageClasses += Math.floor(heroDesignerCharacter.getCharacteristicTotal('STR', character) / this.getStrengthDcCost());
        }

        if (adderMap.has('PLUSONEPIP')) {
            damageClasses += 1;
        } else if (adderMap.has('PLUSONEHALFDIE') || adderMap.has('MINUSONEPIP')) {
            damageClasses += 2;
        }

        const dice = damageClasses / 3;
        const remainder = parseFloat((dice % 1).toFixed(1));

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

    private getStrengthDcCost(): number {
        return DC_BASE_COST * (1 + this.totalAdvantages(this.characterTrait.trait.modifier));
    }

    private totalAdvantages(modifiers: Obj | Obj[] | null | undefined): number {
        let total = 0;

        if (modifiers === null || modifiers === undefined) {
            return total;
        }

        if (Array.isArray(modifiers)) {
            for (const modifier of modifiers) {
                total += this.totalAdvantages(modifier);
            }
        } else {
            if (this.affectsDamageCalc(modifiers)) {
                const decorated = modifierDecorator.decorate(modifiers, this.characterTrait.trait, this.characterTrait.getCharacter);

                total += decorated.cost() > 0 ? decorated.cost() : 0;
            }
        }

        return total;
    }

    private affectsDamageCalc(modifiers: Obj): boolean {
        if (DAMAGE_AFFECTING_ADVANTAGES.includes(modifiers.xmlid)) {
            if (modifiers.xmlid === 'CHARGES') {
                if (Object.prototype.hasOwnProperty.call(modifiers, 'adder')) {
                    if (Array.isArray(modifiers.adder)) {
                        return modifiers.adder.includes('BOOSTABLE');
                    } else {
                        return modifiers.adder.xmlid === 'BOOSTABLE';
                    }
                }
            }

            return true;
        }

        return false;
    }
}
