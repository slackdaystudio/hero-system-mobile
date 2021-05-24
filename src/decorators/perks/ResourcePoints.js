import CharacterTrait from '../CharacterTrait';















export default class ResourcePoints extends CharacterTrait {
    constructor(characterTrait) {
        super(characterTrait.trait, characterTrait.listKey, characterTrait.getCharacter);

        this.characterTrait = characterTrait;
    }

    cost() {
        let cost = this.characterTrait.cost() || 0;

        if (this.characterTrait.trait.levels > 1) {
            let option = null;

            for (let o of this.characterTrait.trait.template.option) {
                if (o.xmlid.toUpperCase() === this.characterTrait.trait.option.toUpperCase()) {
                    option = o;
                    break;
                }
            }

            cost += Math.ceil(this.characterTrait.trait.levels / option.lvlval) * option.lvlcost;
        }

        return cost;
    }

    costMultiplier() {
        return this.characterTrait.roll();
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
}
