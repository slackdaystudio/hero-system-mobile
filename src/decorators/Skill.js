import CharacterTrait from './CharacterTrait';

export default class Skill extends CharacterTrait {
    constructor(characterTrait) {
        super(characterTrait.trait, characterTrait.listKey, characterTrait.getCharacter);

        this.characterTrait = characterTrait;
    }

    cost() {
        let cost = this.characterTrait.cost();

        if (this.characterTrait.trait.type === 'list') {
            return cost;
        }

        if (this.characterTrait.trait.proficiency) {
            cost = 2;
        } else if (this.characterTrait.trait.familiarity || this.characterTrait.trait.everyman) {
            cost = this.characterTrait.trait.familiarity ? 1 : 0;
        } else if (this.characterTrait.trait.hasOwnProperty('adder')) {
            cost += this._totalAdders(this.characterTrait.trait.adder);
        } else {
            let basecost = 0;
            let skillLevelCost = 0;

            if (Array.isArray(this.characterTrait.trait.template.characteristicChoice.item)) {
                for (let item of this.characterTrait.trait.template.characteristicChoice.item) {
                    if (item.characteristic.toLowerCase() === this.characterTrait.trait.characteristic.toLowerCase()) {
                        basecost = item.basecost;
                        skillLevelCost = item.lvlcost;
                    }
                }
            } else {
                basecost = this.characterTrait.trait.template.characteristicChoice.item.basecost;
                skillLevelCost = this.characterTrait.trait.template.characteristicChoice.item.lvlcost;
            }

            cost = basecost + (this.characterTrait.trait.levels * skillLevelCost);
        }

        return cost;
    }

    costMultiplier() {
        return this.characterTrait.costMultiplier();
    }

    activeCost() {
        return this.cost();
    }

    realCost() {
        return this.cost();
    }

    label() {
        let name = this.trait.name === null || this.trait.name === '' ? '' : this.trait.name;
        let label = this.trait.name === null || this.trait.name === '' ? this.trait.alias : ` (${this.trait.alias})`;
        let input = this.trait.input === null || this.trait.input === undefined ? '' : `: ${this.trait.input}`;

        return `${name}${label}${input}`;
    }

    attributes() {
        return this.characterTrait.attributes();
    }

    definition() {
        return this.characterTrait.definition();
    }

    roll() {
        return this.characterTrait.trait.roll;
    }

    advantages() {
        return this.characterTrait.advantages();
    }

    limitations() {
        return this.characterTrait.limitations();
    }

    _totalAdders(adder) {
        let total = 0;

        if (Array.isArray(adder)) {
            for (let a of adder) {
                total += a.basecost;

                if (a.hasOwnProperty('adder')) {
                    total += this._totalAdders(a.adder);
                }
            }
        } else {
            total += adder.basecost;

            if (adder.hasOwnProperty('adder')) {
                total += this._totalAdders(adder.adder);
            }
        }

        return total;
    }
}