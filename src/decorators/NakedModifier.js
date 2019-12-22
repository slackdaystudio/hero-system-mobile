import { Alert } from 'react-native';
import CharacterTrait from './CharacterTrait';
import { common } from './../lib/Common';

export default class NakedModifier extends CharacterTrait {
    constructor(characterTrait) {
        super(characterTrait.trait, characterTrait.listKey, characterTrait.getCharacter);

        this.characterTrait = characterTrait;
    }

    cost() {
        return this.characterTrait.trait.levels || 0;
    }

    costMultiplier() {
        return this.characterTrait.costMultiplier();
    }

    activeCost() {
        return common.roundInPlayersFavor(this.cost() * (1 + this.advantages().reduce((a, b) => a + b.cost, 0))) - this.cost();
    }

    realCost() {
        return common.roundInPlayersFavor(this.activeCost() / (1 - this.limitations().reduce((a, b) => a + b.cost, 0)));
    }

    label() {
        return `${this.characterTrait.label()}: ${this.characterTrait.trait.input}`;
    }

    attributes() {
        let attributes = this.characterTrait.attributes();

        attributes.push({
            label: `Up to ${this.characterTrait.trait.levels} Active Points of ${this.characterTrait.trait.input}`,
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