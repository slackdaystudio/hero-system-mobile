import { Alert } from 'react-native';
import CharacterTrait from '../CharacterTrait';
import { common } from '../../lib/Common';

export default class Duplication extends CharacterTrait {
    constructor(characterTrait) {
        super(characterTrait.trait, characterTrait.listKey, characterTrait.getCharacter);

        this.characterTrait = characterTrait;
    }

    cost() {
        cost = 0;

        if (this.characterTrait.trait.points === 0) {
            cost = 1;
        } else {
            cost = Math.round(this.characterTrait.trait.points / this.characterTrait.trait.template.lvlval);
        }

        cost = cost < 1 ? 1 : cost;

        cost += common.totalAdders(this.characterTrait.trait.adder);

        cost += common.getMultiplierCost(
            this.characterTrait.trait.number,
            this.characterTrait.trait.template.multiplierval,
            this.characterTrait.trait.template.multipliercost
        );

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
        let attributes =  this.characterTrait.attributes();

        attributes.push({
            label: 'Points',
            value: this.characterTrait.trait.points
        });

        attributes.push({
            label: 'Number of Duplicates',
            value: this.characterTrait.trait.number
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