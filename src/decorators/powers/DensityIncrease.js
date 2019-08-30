import { Alert } from 'react-native';
import CharacterTrait from '../CharacterTrait';

export default class DensityIncrease extends CharacterTrait {
    constructor(characterTrait) {
        super(characterTrait.trait, characterTrait.listKey, characterTrait.getCharacter);

        this.characterTrait = characterTrait;
    }

    cost() {
        return this.characterTrait.trait.levels * 5 - 5;
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
            label: `+${this.characterTrait.trait.levels * 5} STR`,
            value: ''
        });

        attributes.push({
            label: `${100 * 2 ** this.characterTrait.trait.levels} kg mass`,
            value: ''
        });

        attributes.push({
            label: `+${this.characterTrait.trait.levels} PD/ED`,
            value: ''
        });

        attributes.push({
            label: `-${this.characterTrait.trait.levels * 2} KB`,
            value: ''
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
}