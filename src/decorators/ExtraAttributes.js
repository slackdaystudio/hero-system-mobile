import { Alert } from 'react-native';
import CharacterTrait from './CharacterTrait';

export default class ExtraAttributes extends CharacterTrait {
    constructor(characterTrait, extraAttributes) {
        super(characterTrait.trait, characterTrait.parentTrait);

        this.characterTrait = characterTrait;
        this.extraAttributes = extraAttributes;
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

        for (let attribute of this.extraAttributes) {
            attributes.push({
                label: attribute.label,
                value: attribute.value
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