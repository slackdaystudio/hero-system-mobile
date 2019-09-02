import { Alert } from 'react-native';
import CharacterTrait from './CharacterTrait';

export default class Characteristic extends CharacterTrait {
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

        if (this.characterTrait.trait.affectsTotal) {
            attributes.push({
                label: `Added to ${this.characterTrait.trait.affectsPrimary ? 'Primary' : 'Secondary'}`,
                value: ''
            });
        } else {
            attributes.push({
                label: 'Not added to totals',
                value: ''
            });
        }

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