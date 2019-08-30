import { Alert } from 'react-native';
import CharacterTrait from '../CharacterTrait';
import { common } from '../../lib/Common';

export default class Entangle extends CharacterTrait {
    constructor(characterTrait) {
        super(characterTrait.trait, characterTrait.listKey, characterTrait.getCharacter);

        this.characterTrait = characterTrait;
        this.modifierMap = common.toMap(this.characterTrait.trait.modifier);
        this.adderMap = common.toMap(this.characterTrait.trait.adder);
    }

    cost() {
        return this.characterTrait.cost();
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
            label: 'PD/ED',
            value: this._getDefenses(this.characterTrait.trait.adder)
        });

        return attributes;
    }

    definition() {
        return this.characterTrait.definition();
    }

    roll() {
        if (this.modifierMap.has('ONEBODY')) {
            return null;
        }

        let dice = this.characterTrait.trait.levels;

        if (this.adderMap.has('ADDITIONALBODY')) {
            dice += this.adderMap.get('ADDITIONALBODY').levels;
        }

        return `${dice}${this.adderMap.has('PLUSONEHALFDIE') ? '½' : ''}d6`;
    }

    advantages() {
        return this.characterTrait.advantages();
    }

    limitations() {
        return this.characterTrait.limitations();
    }

    _getDefenses(adder) {
        let pd = this.characterTrait.trait.levels;
        let ed = this.characterTrait.trait.levels;

        if (this.modifierMap.has('NODEFENSE')) {
            return '0/0';
        }

        if (this.adderMap.has('ADDITIONALPD')) {
            pd += this.adderMap.get('ADDITIONALPD').levels;
        }

        if (this.adderMap.has('ADDITIONALED')) {
            ed += this.adderMap.get('ADDITIONALED').levels;
        }

        return `${pd}/${ed}`
    }
}