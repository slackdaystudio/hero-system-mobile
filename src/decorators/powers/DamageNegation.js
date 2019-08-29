import { Alert } from 'react-native';
import CharacterTrait from '../CharacterTrait';

export default class DamageNegation extends CharacterTrait {
    constructor(characterTrait) {
        super(characterTrait.trait, characterTrait.parentTrait);

        this.characterTrait = characterTrait;
    }

    cost() {
        return this.characterTrait.trait.basecost;
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
        let attributes = [];

        for (let adder of this.characterTrait.trait.adder) {
            if (adder.levels > 0) {
                attributes.push({
                    label: `-${adder.levels} ${adder.alias}`,
                    value: ''
                });
            }
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