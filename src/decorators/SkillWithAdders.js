import { Alert } from 'react-native';
import CharacterTrait from './CharacterTrait';

export default class SkillWithAdders extends CharacterTrait {
    constructor(characterTrait) {
        super(characterTrait.trait, characterTrait.listKey, characterTrait.getCharacter);

        this.characterTrait = characterTrait;
    }

    cost() {
        let cost = 3;

        if (this.characterTrait.trait.hasOwnProperty('adder')) {
            if (Array.isArray(this.characterTrait.trait.adder)) {
                cost = this.characterTrait.trait.adder.length + 1;
            } else {
                cost = 2;
            }
        }

        cost += this.characterTrait.trait.levels / this.characterTrait.trait.template.characteristicChoice.item.lvlval * this.characterTrait.trait.template.characteristicChoice.item.lvlcost;

        return cost;
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
        return this.characterTrait.roll();
    }

    advantages() {
        return this.characterTrait.advantages();
    }

    limitations() {
        return this.characterTrait.limitations();
    }
}