import { Alert } from 'react-native';
import CharacterTrait from '../CharacterTrait';
import { common } from '../../lib/Common';

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
            label: this._getDice(),
            value: ''
        });

        return attributes;
    }

    definition() {
        return this.characterTrait.definition();
    }

    roll() {
        let character = this.getCharacter();
        let characteristicsMap = common.toMap(character.characteristics, 'shortName');
        let adderMap = common.toMap(this.characterTrait.trait.adder);
        let dice = '';
        let damageClasses = (Math.floor(characteristicsMap.get('STR').value / 5)) + this.characterTrait.trait.levels * 3;

        if (adderMap.has('PLUSONEPIP')) {
            damageClasses += 1;
        } else if (adderMap.has('PLUSONEHALFDIE') || adderMap.has('MINUSONEPIP')) {
            damageClasses += 2;
        }

        dice = damageClasses / 3;

        switch ((dice % 1).toFixed(1)) {
            case '0.3':
                return `${Math.trunc(dice)}d6+1`;
            case '0.6':
                return `${Math.trunc(dice)}½d6`;
            default:
                // do nothing
        }

        return `${dice}d6`;
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

        if (adderMap.has()) {
            dice += '½d6';
        } else if (adderMap.has()) {
            dice += 'd6+1';
        } else {
            dice += 'd6';
        }

        return dice;
    }
}