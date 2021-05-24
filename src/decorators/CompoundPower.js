import CharacterTrait from './CharacterTrait';















export default class CompoundPower extends CharacterTrait {
    constructor(characterTrait, characterTraitDecorator) {
        super(characterTrait.trait, characterTrait.listKey, characterTrait.getCharacter);

        this.characterTrait = characterTrait;
        this.characterTraitDecorator = characterTraitDecorator;
        this.powers = this._getCompoundPowers(this.characterTrait.trait.powers);
    }

    cost() {
        let cost = 0;

        for (let power of this.powers) {
            cost += power.cost();
        }

        return cost;
    }

    costMultiplier() {
        return this.characterTrait.costMultiplier();
    }

    activeCost() {
        let activeCost = 0;

        for (let power of this.powers) {
            activeCost += power.activeCost();
        }

        return activeCost;
    }

    realCost() {
        let realCost = 0;

        for (let power of this.powers) {
            realCost += power.realCost();
        }

        return realCost;
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

    _getCompoundPowers(powers) {
        let compoundPowers = [];

        if (Array.isArray(powers)) {
            for (let power of powers) {
                compoundPowers = compoundPowers.concat(this._getCompoundPowers(power));
            }
        } else {
            compoundPowers.push(this.characterTraitDecorator.decorate(powers, this.characterTrait.listKey, this.characterTrait.getCharacter));
        }

        return compoundPowers;
    }
}
