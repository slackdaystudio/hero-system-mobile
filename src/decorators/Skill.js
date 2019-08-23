import CharacterTrait from './CharacterTrait';

export default class Skill extends CharacterTrait {
    constructor(characterTrait) {
        super(characterTrait.trait, characterTrait.parentTrait);

        this.characterTrait = characterTrait;
        this.skillCost = this._getSkillCost();
    }

    cost() {
        let cost = this.skillCost;

        return cost;
    }

    activeCost() {
        return this.cost();
    }

    realCost() {
        return this.cost();
    }

    label() {
        let name = this.characterTrait.trait.name === null || this.characterTrait.trait.name === '' ? '' : this.characterTrait.trait.name;
        let label = this.characterTrait.trait.name === null || this.characterTrait.trait.name === '' ? this.characterTrait.label() : ` (${this.characterTrait.label()})`;
        let input = this.characterTrait.trait.input === null || this.characterTrait.trait.input === undefined ? '' : `: ${this.characterTrait.trait.input}`;

        return `${name}${label}${input}`;
    }

    definition() {
        return this.characterTrait.definition();
    }

    advantages() {
        return this.characterTrait.advantages();
    }

    limitations() {
        return this.characterTrait.limitations();
    }

    _getSkillCost() {
        let cost = this.characterTrait.cost();

        if (this.characterTrait.trait.type === 'list') {
            return cost;
        }

        if (this.characterTrait.trait.proficiency) {
            cost = 2;
        } else if (this.characterTrait.trait.familiarity || this.characterTrait.trait.everyman) {
            cost = this.characterTrait.trait.familiarity ? 1 : 0;
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
}