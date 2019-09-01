import { Alert } from 'react-native';
import CharacterTrait from '../CharacterTrait';
import { common } from '../../lib/Common';

export default class ResistantProtection extends CharacterTrait {
    constructor(characterTrait) {
        super(characterTrait.trait, characterTrait.listKey, characterTrait.getCharacter);

        this.characterTrait = characterTrait;
    }

    cost() {
        let cost = this.characterTrait.trait.basecost;

        cost += Math.ceil(this.characterTrait.trait.levels / this.characterTrait.trait.template.lvlval) * this.characterTrait.trait.template.lvlcost;

        cost += common.totalAdders(this.characterTrait.trait.adder);

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

        if (this.characterTrait.trait.pdlevels > 0) {
            attributes.push({
                label: 'Physical Defense',
                value: this.characterTrait.trait.pdlevels
            });
        }

        if (this.characterTrait.trait.edlevels > 0) {
            attributes.push({
                label: 'Energy Defense',
                value: this.characterTrait.trait.edlevels
            });
        }

        if (this.characterTrait.trait.mdlevels > 0) {
            attributes.push({
                label: 'Mental Defense',
                value: this.characterTrait.trait.mdlevels
            });
        }

        if (this.characterTrait.trait.powdlevels > 0) {
            attributes.push({
                label: 'Power Defense',
                value: this.characterTrait.trait.powdlevels
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

    calculateDefenseCost(levels) {
        cost = 0;

        if (levels === 1) {
            cost += this.characterTrait.trait.template.lvlcost;
        } else if (levels > 1) {
            cost += common.getMultiplierCost(
                levels,
                this.characterTrait.trait.template.lvlval,
                this.characterTrait.trait.template.lvlcost
            );
        }

        return cost;
    }
}