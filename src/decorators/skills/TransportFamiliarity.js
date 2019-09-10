import { Alert } from 'react-native';
import CharacterTrait from '../CharacterTrait';

export default class TransportFamiliarity extends CharacterTrait {
    constructor(characterTrait) {
        super(characterTrait.trait, characterTrait.listKey, characterTrait.getCharacter);

        this.characterTrait = characterTrait;
    }

    cost() {
        let cost = 1;

        if (this.characterTrait.trait.hasOwnProperty('adder')) {
            cost = this._totalAdders(this.characterTrait.trait.adder);
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

    _totalAdders(adder) {
        let cost = 0;

        if (Array.isArray(adder)) {
            for (let a of adder) {
                cost += this._totalAdder(a);
            }
        } else {
            cost += this._totalAdder(adder);
        }

        return cost;
    }

    _totalAdder(adder) {
        let cost = 0;

        if (adder.hasOwnProperty('adder')) {
            cost += this._totalAdders(adder.adder);
        } else {
            cost += adder.basecost;
        }

        return cost;
    }
}