import { Alert } from 'react-native';
import CharacterTrait from '../CharacterTrait';
import { common } from '../../lib/Common';
import { SKILL_CHECK } from '../../lib/DieRoller';

export default class EnduranceReserve extends CharacterTrait {
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
        return this.characterTrait.attributes();
    }

    definition() {
        return this.characterTrait.definition();
    }

    roll() {
        let base = 11;

        if (this.characterTrait.trait.modifier !== null || this.characterTrait.trait.modifier !== undefined) {
            let modifierMap = common.toMap(this.characterTrait.trait.modifier);

            if (modifierMap.has('FOCUS')) {
                base = 9;
            }
        }

        return {
            roll: `${base + this.characterTrait.trait.levels}-`,
            type: SKILL_CHECK
        };
    }

    advantages() {
        return this.characterTrait.advantages();
    }

    limitations() {
        return this.characterTrait.limitations();
    }
}