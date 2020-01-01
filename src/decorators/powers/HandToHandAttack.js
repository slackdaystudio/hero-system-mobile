import { Alert } from 'react-native';
import CharacterTrait from '../CharacterTrait';
import { common } from '../../lib/Common';
import { heroDesignerCharacter } from '../../lib/HeroDesignerCharacter';
import { NORMAL_DAMAGE } from '../../lib/DieRoller';

export default class HandToHandAttack extends CharacterTrait {
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
            value: this._getDice()
        });

        return attributes;
    }

    definition() {
        return this.characterTrait.definition();
    }

    roll() {
        let character = this.characterTrait.getCharacter();
        let characteristicsMap = common.toMap(character.characteristics, 'shortName');
        let adderMap = common.toMap(this.characterTrait.trait.adder);
        let powersMap = common.toMap(common.flatten(character.powers, 'powers'));
        let dice = this.characterTrait.trait.levels;
        let roll = {
            roll: '',
            type: NORMAL_DAMAGE
        };
        let partialDie = false;

        dice += heroDesignerCharacter.getCharacteristicTotal(characteristicsMap.get('STR'), powersMap) / 5;

        if (parseFloat((dice % 1).toFixed(1)) != 0.0) {
            partialDie = parseFloat((dice % 1).toFixed(1)) >= 0.6 ? true : false;
            dice = Math.trunc(dice);
        }

        if (adderMap.has('PLUSONEPIP')) {
            roll.roll = partialDie ? `${dice + 1}d6` : `${dice}d6+1`;
        } else if (adderMap.has('PLUSONEHALFDIE')) {
            roll.roll = partialDie ? `${dice + 1}d6` : `${dice}½d6`;
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
        } else {
            dice += 'd6';
        }

        return dice;
    }
}