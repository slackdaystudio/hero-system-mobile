import { Alert } from 'react-native';
import CharacterTrait from '../CharacterTrait';
import { common } from '../../lib/Common';

export default class EnduranceReserve extends CharacterTrait {
    constructor(characterTrait) {
        super(characterTrait.trait, characterTrait.listKey, characterTrait.getCharacter);

        this.characterTrait = characterTrait;
    }

    cost() {
        let cost = Math.ceil(this.characterTrait.trait.levels / this.characterTrait.trait.template.lvlval * this.characterTrait.trait.template.lvlcost);
        cost += Math.ceil(this.characterTrait.trait.power.levels / this.characterTrait.trait.template.endurancereserverec.lvlval * this.characterTrait.trait.template.endurancereserverec.lvlcost);

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
            label: 'Reserve',
            value: this.characterTrait.trait.levels
        });

        attributes.push({
            label: 'Recovery',
            value: this.characterTrait.trait.power.levels
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