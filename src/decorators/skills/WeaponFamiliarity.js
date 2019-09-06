import { Alert } from 'react-native';
import CharacterTrait from '../CharacterTrait';

export default class WeaponFamiliarity extends CharacterTrait {
    constructor(characterTrait) {
        super(characterTrait.trait, characterTrait.listKey, characterTrait.getCharacter);

        this.characterTrait = characterTrait;
    }

    cost() {
         return this._totalAdders(this.characterTrait.trait.adder);
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

        if (adder === undefined || adder === null) {
            return cost;
        }

        if (Array.isArray(adder)) {
            for (let a of adder) {
                cost += a.basecost;

                if (a.hasOwnProperty('adder')) {
                    cost += this._totalAdders(a.adder);
                }
            }
        } else {
            cost += adder.basecost;

            if (adder.hasOwnProperty('adder')) {
                cost += this._totalAdders(adder.adder);
            }
        }

        return cost;
    }
}