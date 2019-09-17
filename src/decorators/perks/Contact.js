import { Alert } from 'react-native';
import CharacterTrait from '../CharacterTrait';
import { SKILL_CHECK } from '../../lib/DieRoller';

export default class Contact extends CharacterTrait {
    constructor(characterTrait) {
        super(characterTrait.trait, characterTrait.listKey, characterTrait.getCharacter);

        this.characterTrait = characterTrait;
    }

    cost() {
        return this.characterTrait.cost() * this.costMultiplier();
    }

    costMultiplier() {
        return this._getModifierMultiplier(this.characterTrait.trait.modifier);
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
        let baseRoll = this.characterTrait.trait.levels > 1 ? 11 : 8;
        let levels = 0;

        if (this.characterTrait.trait.levels > 2) {
            levels = this.characterTrait.trait.levels - 2;
        }

        return {
            roll: `${baseRoll + levels}-`,
            type: SKILL_CHECK
        }
    }

    advantages() {
        return this.characterTrait.advantages();
    }

    limitations() {
        return this.characterTrait.limitations();
    }

    _getModifierMultiplier(modifier) {
        let multiplier = this.characterTrait.costMultiplier();

        if (modifier === undefined || modifier === null) {
            return multiplier;
        }

        if (Array.isArray(modifier)) {
            for (let m of modifier) {
                this._getModifierMultiplier(m);
            }
        } else {
            if (modifier.xmlid.toUpperCase() === 'ORGANIZATION') {
                multiplier += modifier.basecost;
            }
        }

        return multiplier;
    }
}