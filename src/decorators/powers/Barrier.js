import { Alert } from 'react-native';
import CharacterTrait from '../CharacterTrait';
import { common } from '../../lib/Common';

export default class Barrier extends CharacterTrait {
    constructor(characterTrait) {
        super(characterTrait.trait, characterTrait.parentTrait);

        this.characterTrait = characterTrait;
    }

    cost() {
        cost = this.characterTrait.trait.basecost;

        cost += this.calculateDefenseCost(this.characterTrait.trait.pdlevels);
        cost += this.calculateDefenseCost(this.characterTrait.trait.edlevels);
        cost += this.calculateDefenseCost(this.characterTrait.trait.mdlevels);
        cost += this.calculateDefenseCost(this.characterTrait.trait.powdlevels);

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

        attributes.push({
            label: 'Body',
            value: this.characterTrait.trait.bodylevels
        });

        attributes.push({
            label: 'Dimensions',
            value: `${this.characterTrait.trait.lengthlevels + 1}m x ${this.characterTrait.trait.widthlevels + 0.5}m x ${this.characterTrait.trait.heightlevels + 1}m`
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