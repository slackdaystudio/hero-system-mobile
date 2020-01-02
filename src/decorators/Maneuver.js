import { Alert } from 'react-native';
import CharacterTrait from './CharacterTrait';
import { common } from '../lib/Common';
import { heroDesignerCharacter } from '../lib/HeroDesignerCharacter';
import { NORMAL_DAMAGE } from '../lib/DieRoller';

export default class Maneuver extends CharacterTrait {
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

        if (this.characterTrait.trait.hasOwnProperty('phase')) {
            attributes.push({
                label: 'Phase',
                value: this.characterTrait.trait.phase === '1/2' ? '½' : this.characterTrait.trait.phase
            });
        }

        if (this.characterTrait.trait.hasOwnProperty('ocv')) {
            attributes.push({
                label: 'OCV',
                value: `${this.characterTrait.trait.ocv < 0 ? '' : '+'}${this.characterTrait.trait.ocv}`
            });
        }

        if (this.characterTrait.trait.hasOwnProperty('dcv')) {
            attributes.push({
                label: 'DCV',
                value: `${this.characterTrait.trait.dcv < 0 ? '' : '+'}${this.characterTrait.trait.dcv}`
            });
        }

        if (this.characterTrait.trait.hasOwnProperty('range')) {
            attributes.push({
                label: 'Range',
                value: `${this.characterTrait.trait.range < 0 ? '' : '+'}${this.characterTrait.trait.range}`
            });
        }

        if (this.characterTrait.trait.hasOwnProperty('effect')) {
            if (this.characterTrait.trait.category === 'Hand To Hand') {
                if (this.characterTrait.trait.useweapon) {
                    attributes.push(this._performEffectInterpolation(this.characterTrait.trait.weaponeffect));
                } else {
                    attributes.push(this._performEffectInterpolation(this.characterTrait.trait.effect));
                }
            } else {
                attributes.push(this._performEffectInterpolation(this.characterTrait.trait.effect));
            }
        }

        return attributes;
    }

    definition() {
        return this.characterTrait.definition();
    }

    roll() {
        if (this.characterTrait.trait.hasOwnProperty('effect')) {
            if (this.characterTrait.trait.template.doesdamage && this.characterTrait.trait.category === 'Hand To Hand' && !this.characterTrait.trait.useweapon) {
                return {
                    roll: this._getNormalDamage(),
                    type: NORMAL_DAMAGE
                }
            }
        }

        return this.characterTrait.roll();
    }

    advantages() {
        return this.characterTrait.advantages();
    }

    limitations() {
        return this.characterTrait.limitations();
    }

    _performEffectInterpolation(effect) {
        let attribute = {
            label: 'Effect',
            value: effect
        }

        if (effect.indexOf('[WEAPONDC]') > -1) {
            attribute.value = effect.replace('[WEAPONDC]', `+${this._getKillingDc()} DC`);
        }

        if (effect.indexOf('[NORMALDC]') > -1) {
            attribute.value = effect.replace('[NORMALDC]', this._getNormalDamage());
        }

        if (effect.indexOf('[STRDC]') > -1) {
            attribute.value = effect.replace('[STRDC]', `${this._getStrengthDc()} STR`)
        }

        return attribute;
    }

    _getNormalDamage() {
        let character = this.characterTrait.getCharacter();
        let martialArtsMap = common.toMap(common.flatten(character.martialArts, 'martialArts'));
        let dice = this.characterTrait.trait.dc;
        let partialDie = false;

        if (this.characterTrait.trait.addstr) {
            let characteristicsMap = common.toMap(character.characteristics, 'shortName');
            let powersMap = common.toMap(common.flatten(character.powers, 'powers'));

            dice += heroDesignerCharacter.getCharacteristicTotal(characteristicsMap.get('STR'), powersMap) / 5;
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

        if (parseFloat((dice % 1).toFixed(1)) != 0.0) {
            partialDie = parseFloat((dice % 1).toFixed(1)) >= 0.6 ? true : false;
            dice = Math.trunc(dice);
        }

        return partialDie ? `${dice}½d6` : `${dice}d6`;
    }

    _getKillingDc() {
         let character = this.characterTrait.getCharacter();
         let martialArtsMap = common.toMap(common.flatten(character.martialArts, 'martialArts'));
         let dice = this.characterTrait.trait.dc;

         if (martialArtsMap.has('EXTRADC')) {
             dice += martialArtsMap.get('EXTRADC').levels;
         }

         return dice;
    }

    _getStrengthDc() {
        let character = this.characterTrait.getCharacter();
        let martialArtsMap = common.toMap(common.flatten(character.martialArts, 'martialArts'));
        let strength = this.characterTrait.trait.dc * 5;

        if (this.characterTrait.trait.addstr) {
            let characteristicsMap = common.toMap(character.characteristics, 'shortName');
            let powersMap = common.toMap(common.flatten(character.powers, 'powers'));

            strength += heroDesignerCharacter.getCharacteristicTotal(characteristicsMap.get('STR'), powersMap);
        }

        if (this.characterTrait.trait.category === 'Hand To Hand') {
            if (martialArtsMap.has('EXTRADC')) {
                strength += martialArtsMap.get('EXTRADC').levels * 5;
            }
        }

        return strength;
    }
}