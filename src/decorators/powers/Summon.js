import { Alert } from 'react-native';
import CharacterTrait from '../CharacterTrait';
import { common } from '../../lib/Common';

export default class Summon extends CharacterTrait {
    constructor(characterTrait) {
        super(characterTrait.trait, characterTrait.listKey, characterTrait.getCharacter);

        this.characterTrait = characterTrait;
    }

    cost() {
        let cost = this.characterTrait.trait.levels / this.characterTrait.trait.template.lvlval * this.characterTrait.trait.template.lvlcost;

        cost += common.totalAdders(this.characterTrait.trait.adder);

        return Math.ceil(cost);
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
            label: 'Points',
            value: `${this.characterTrait.trait.levels}`
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

    _getNonCombatDistance() {
        let nonCombatDistance = 2;
        let adderMap = common.toMap(this.characterTrait.trait.adder);

        if (adderMap.has('NONCOMBAT')) {
            nonCombatDistance **= adderMap.get('NONCOMBAT').levels + 1;
        }

        return nonCombatDistance;
    }
}