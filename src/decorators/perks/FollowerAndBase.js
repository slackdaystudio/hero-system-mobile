import { Alert } from 'react-native';
import CharacterTrait from '../CharacterTrait';
import { common } from '../../lib/Common';

export default class FollowerAndBase extends CharacterTrait {
    constructor(characterTrait) {
        super(characterTrait.trait, characterTrait.parentTrait);

        this.characterTrait = characterTrait;
    }

    cost() {
        let cost = this.characterTrait.cost();

        cost += Math.round(this.characterTrait.trait.basepoints / this.characterTrait.trait.template.lvlval);

        if (this.characterTrait.trait.number > 1) {
            cost += common.getMultiplierCost(
                this.characterTrait.trait.number,
                this.characterTrait.trait.template.multiplierval,
                this.characterTrait.trait.template.multipliercost
            );
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
        let attributes = this.characterTrait.attributes();

        attributes.push({
            label: 'Base Points',
            value: this.characterTrait.trait.basepoints
        });

        attributes.push({
            label: 'Complications',
            value: this.characterTrait.trait.disadpoints
        });

        attributes.push({
            label: 'Number',
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