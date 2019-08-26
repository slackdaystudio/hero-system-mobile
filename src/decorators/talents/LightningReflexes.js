import { Alert } from 'react-native';
import CharacterTrait from '../CharacterTrait';
import { common } from '../../lib/Common';

export default class LightningReflexes extends CharacterTrait {
    constructor(characterTrait) {
        super(characterTrait.trait, characterTrait.parentTrait);

        this.characterTrait = characterTrait;
    }

    cost() {
        let cost = 0;
        let option = null;

        for (let o of this.characterTrait.trait.template.option) {
            if (o.xmlid.toUpperCase() === this.characterTrait.trait.option.toUpperCase()) {
                option = o;
                break;
            }
        }

        if (this.characterTrait.trait.option.toUpperCase() === 'ALL') {
            cost += this.characterTrait.trait.levels * option.lvlcost;
        } else {
            cost += common.getMultiplierCost(
                this.characterTrait.trait.levels,
                option.lvlval,
                option.lvlcost
            );
        }

        return cost < 1 ? 1 : cost;
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
            label: `+${this.characterTrait.trait.levels} DEX to act first`,
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