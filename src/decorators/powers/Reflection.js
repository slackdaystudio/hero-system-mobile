import CharacterTrait from '../CharacterTrait';















export default class Reflection extends CharacterTrait {
    constructor(characterTrait) {
        super(characterTrait.trait, characterTrait.listKey, characterTrait.getCharacter);

        this.characterTrait = characterTrait;
    }

    cost() {
        let cost = this.trait.basecost;

        cost += Math.ceil(this.characterTrait.trait.levels / this.characterTrait.trait.template.lvlval) * this.characterTrait.trait.template.lvlcost;

        cost += this._addAdder(this.characterTrait.trait.adder);

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
            label: 'Active Points Worth',
            value: this.characterTrait.trait.levels,
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

    _addAdder(adder) {
        let cost = 0;

        if (adder === undefined || adder === null) {
            return cost;
        }

        if (Array.isArray(adder)) {
            for (let a of adder) {
                cost += this._addAdder(a);
            }
        } else {
            cost += adder.basecost;

            if (adder.levels > 0) {
                cost = adder.levels / adder.lvlval * adder.lvlcost;
            }
        }

        return cost;
    }
}
