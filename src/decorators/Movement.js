import { Alert } from 'react-native';
import CharacterTrait from './CharacterTrait';
import { common } from '../lib/Common';

export default class Movement extends CharacterTrait {
    constructor(characterTrait) {
        super(characterTrait.trait, characterTrait.listKey, characterTrait.getCharacter);

        this.characterTrait = characterTrait;
        this.modifierMap = common.toMap(this.characterTrait.trait.modifier);
        this.adderMap = common.toMap(this.characterTrait.trait.adder);
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
        let ncm = this._getNcm();
        let character = this.characterTrait.getCharacter();

        attributes.push({
            label: 'Combat Move',
            value: `${this.characterTrait.trait.levels}m`
        });

        attributes.push({
            label: 'Non-Combat Move',
            value: `${this.characterTrait.trait.levels * ncm}m (x${ncm})`
        });

        attributes.push({
            label: 'Max Combat',
            value: `${(this.characterTrait.trait.levels * this._getSpeed() * 5 * 60 / 1000).toFixed(1)} km/h`
        });

        attributes.push({
            label: 'Max Non-Combat',
            value: `${(this.characterTrait.trait.levels * ncm * this._getSpeed() * 5 * 60 / 1000).toFixed(1)} km/h`
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

    _getNcm() {
        let ncm = 2;

        if (this.adderMap.has('IMPROVEDNONCOMBAT')) {
            ncm = adderMap.get('IMPROVEDNONCOMBAT').lvlval * 2;
        }

        return ncm;
    }

    _getSpeed() {
        let character = this.characterTrait.getCharacter();
        let characteristicMap = common.toMap(character.characteristics, 'shortName');

        return characteristicMap.get('SPD').value;
    }
}