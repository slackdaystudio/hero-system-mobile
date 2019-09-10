import { Alert } from 'react-native';
import CharacterTrait from '../CharacterTrait';

export default class RapidAttack extends CharacterTrait {
    constructor(characterTrait) {
        super(characterTrait.trait, characterTrait.listKey, characterTrait.getCharacter);

        this.characterTrait = characterTrait;
    }

    cost() {
        let cost = 10;

        if (this.characterTrait.trait.hasOwnProperty('modifier')) {
            if (Array.isArray(this.characterTrait.trait.modifier)) {
                for (let modifier of this.characterTrait.trait.modifier) {
                    if (modifier.xmlid.toUpperCase() === 'HTHONLY' || modifier.xmlid.toUpperCase() === 'RANGEDONLY') {
                        cost--;
                        break;
                    }
                }
            } else {
                if (modifier.xmlid.toUpperCase() === 'HTHONLY' || modifier.xmlid.toUpperCase() === 'RANGEDONLY') {
                    cost--;
                }
            }
        }

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