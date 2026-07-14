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

import {flatten, toMap} from 'core/util';
import {RollType} from 'core/dice';
import {heroDesignerCharacter} from 'core/hero';
import {type Attribute, type RollDescriptor} from './characterTrait';
import {TraitDecorator} from './traitDecorator';

/** Martial-arts maneuver, ported from legacy `decorators/Maneuver.js`. Cost delegates;
 *  the combat logic lives in roll()/attributes(). */
export default class Maneuver extends TraitDecorator {
    attributes(): Attribute[] {
        const attributes = this.characterTrait.attributes();
        const trait = this.characterTrait.trait;

        if (hasOwn(trait, 'category') && trait.category === 'Hand To Hand') {
            attributes.push({label: 'Type', value: trait.useweapon ? 'Weapon' : 'Empty Hand'});
        }

        if (hasOwn(trait, 'phase')) {
            attributes.push({label: 'Phase', value: trait.phase === '1/2' ? '½' : trait.phase});
        }

        if (hasOwn(trait, 'ocv')) {
            attributes.push({label: 'OCV', value: `${trait.ocv < 0 ? '' : '+'}${trait.ocv}`});
        }

        if (hasOwn(trait, 'dcv')) {
            attributes.push({label: 'DCV', value: `${trait.dcv < 0 ? '' : '+'}${trait.dcv}`});
        }

        if (hasOwn(trait, 'range')) {
            attributes.push({label: 'Range', value: `${trait.range < 0 ? '' : '+'}${trait.range}`});
        }

        if (hasOwn(trait, 'effect')) {
            if (trait.category === 'Hand To Hand') {
                if (trait.useweapon) {
                    attributes.push(this.performEffectInterpolation(trait.weaponeffect));
                } else {
                    attributes.push(this.performEffectInterpolation(trait.effect));
                }
            } else {
                attributes.push(this.performEffectInterpolation(trait.effect));
            }
        }

        return attributes;
    }

    roll(): RollDescriptor | null {
        const trait = this.characterTrait.trait;

        if (trait.xmlid.toUpperCase() === 'CUSTOM_MANEUVER') {
            return this.characterTrait.roll();
        }

        if (hasOwn(trait, 'effect') && hasOwn(trait, 'template')) {
            if (trait.template.doesdamage && trait.category === 'Hand To Hand' && !trait.useweapon) {
                if (trait.effect.indexOf('[KILLINGDC]') > -1) {
                    return {roll: this.getUnarmedKillingDamage(), type: RollType.KillingDamage};
                } else if (trait.effect.indexOf('[NORMALDC]') > -1) {
                    return {roll: this.getNormalDamage(), type: RollType.NormalDamage};
                } else if (trait.effect.indexOf('[NNDDC]') > -1) {
                    return {roll: this.getNndDamage(), type: RollType.NormalDamage};
                } else if (trait.effect.indexOf('[FLASHDC]') > -1) {
                    return {roll: this.getFlashDamage(), type: RollType.Effect};
                }
            }
        }

        return this.characterTrait.roll();
    }

    private performEffectInterpolation(effect: string): Attribute {
        const attribute: Attribute = {label: 'Effect', value: effect};

        if (effect.indexOf('[WEAPONDC]') > -1) {
            attribute.value = effect.replace('[WEAPONDC]', `+${this.getKillingDc()} DC`);
        }
        if (effect.indexOf('[NORMALDC]') > -1) {
            attribute.value = effect.replace('[NORMALDC]', this.getNormalDamage());
        }
        if (effect.indexOf('[NNDDC]') > -1) {
            attribute.value = effect.replace('[NNDDC]', `${this.getNndDamage()} NND`);
        }
        if (effect.indexOf('[FLASHDC]') > -1) {
            attribute.value = effect.replace('[FLASHDC]', `Flash ${this.getFlashDamage()}`);
        }
        if (effect.indexOf('[KILLINGDC]') > -1) {
            attribute.value = effect.replace('[KILLINGDC]', `HKA ${this.getUnarmedKillingDamage()}`);
        }
        if (effect.indexOf('[WEAPONKILLINGDC]') > -1) {
            attribute.value = effect.replace('[WEAPONKILLINGDC]', `HKA ${this.getKillingDc()} DC`);
        }
        if (effect.indexOf('[STRDC]') > -1) {
            attribute.value = effect.replace('[STRDC]', `${this.getStrengthDc()} STR`);
        }

        return attribute;
    }

    private martialArtsMap(): Map<unknown, any> {
        return toMap(flatten(this.characterTrait.getCharacter().martialArts, 'maneuver'));
    }

    private getNormalDamage(): string {
        const character = this.characterTrait.getCharacter();
        const martialArtsMap = this.martialArtsMap();
        let dice = this.characterTrait.trait.dc;
        let partialDie = false;

        if (this.characterTrait.trait.addstr) {
            dice += heroDesignerCharacter.getCharacteristicTotal('STR', character) / 5;
        }

        if (this.characterTrait.trait.category === 'Hand To Hand') {
            if (martialArtsMap.has('EXTRADC')) {
                dice += martialArtsMap.get('EXTRADC').levels;
            }
        } else {
            if (martialArtsMap.has('RANGEDDC')) {
                dice += martialArtsMap.get('RANGEDDC').levels;
            }
        }

        if (parseFloat((dice % 1).toFixed(1)) !== 0.0) {
            partialDie = parseFloat((dice % 1).toFixed(1)) >= 0.6;
            dice = Math.trunc(dice);
        }

        return partialDie ? `${dice}½d6` : `${dice}d6`;
    }

    private getNndDamage(): string {
        const martialArtsMap = this.martialArtsMap();
        let dice = this.characterTrait.trait.dc / 2;
        let partialDie = false;

        if (this.characterTrait.trait.category === 'Hand To Hand') {
            if (martialArtsMap.has('EXTRADC')) {
                dice += martialArtsMap.get('EXTRADC').levels / 2;
            }
        }

        if (parseFloat((dice % 1).toFixed(1)) !== 0.0) {
            partialDie = parseFloat((dice % 1).toFixed(1)) >= 0.5;
            dice = Math.trunc(dice);
        }

        return partialDie ? `${dice}½d6` : `${dice}d6`;
    }

    private getFlashDamage(): string {
        const martialArtsMap = this.martialArtsMap();
        let dice = this.characterTrait.trait.dc;

        if (this.characterTrait.trait.category === 'Hand To Hand') {
            if (martialArtsMap.has('EXTRADC')) {
                dice += martialArtsMap.get('EXTRADC').levels;
            }
        }

        return `${dice}d6`;
    }

    private getUnarmedKillingDamage(): string {
        const character = this.characterTrait.getCharacter();
        const martialArtsMap = this.martialArtsMap();
        let damageClasses = this.characterTrait.trait.dc;
        let damageString = '';

        damageClasses += Math.floor(heroDesignerCharacter.getCharacteristicTotal('STR', character) / 5);

        if (martialArtsMap.has('EXTRADC')) {
            damageClasses += martialArtsMap.get('EXTRADC').levels;
        }

        const dice = damageClasses / 3;
        const remainder = parseFloat((dice % 1).toFixed(1));

        if (remainder > 0.0) {
            if (remainder >= 0.3 && remainder <= 0.5) {
                damageString = `${Math.trunc(dice)}d6+1`;
            } else if (remainder >= 0.6) {
                damageString = `${Math.trunc(dice)}½d6`;
            }
        } else {
            damageString = `${dice}d6`;
        }

        return damageString;
    }

    private getKillingDc(): number {
        const martialArtsMap = this.martialArtsMap();
        let dice = this.characterTrait.trait.dc;

        if (martialArtsMap.has('EXTRADC')) {
            dice += martialArtsMap.get('EXTRADC').levels;
        }

        return dice;
    }

    private getStrengthDc(): number {
        const character = this.characterTrait.getCharacter();
        const martialArtsMap = this.martialArtsMap();
        let strength = this.characterTrait.trait.dc * 5;

        if (this.characterTrait.trait.addstr) {
            strength += heroDesignerCharacter.getCharacteristicTotal('STR', character);
        }

        if (this.characterTrait.trait.category === 'Hand To Hand') {
            if (martialArtsMap.has('EXTRADC')) {
                strength += martialArtsMap.get('EXTRADC').levels * 5;
            }
        }

        return strength;
    }
}

const hasOwn = (obj: object, key: string): boolean => Object.prototype.hasOwnProperty.call(obj, key);
