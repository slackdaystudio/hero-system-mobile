import { Alert } from 'react-native';
import CharacterTrait from './CharacterTrait';

export default class BaseCost extends CharacterTrait {
    constructor(characterTrait) {
        super(characterTrait.trait, characterTrait.parentTrait);

        this.characterTrait = characterTrait;
    }

    cost() {
        let cost = this.characterTrait.cost();

        if (this.characterTrait.trait.levels > 0) {
            let levelCost = 0;

            if (this.characterTrait.trait.hasOwnProperty('option')) {
                for (let option of this.characterTrait.trait.template.option) {
                    if (option.xmlid.toUpperCase() === this.characterTrait.trait.option.toUpperCase()) {
                        levelCost = option.lvlcost || this.characterTrait.trait.lvlcost;
                        break;
                    }
                }
            } else if (this.characterTrait.trait.template.hasOwnProperty('lvlcost')) {
                levelCost = this.characterTrait.trait.template.lvlcost;
            } else if (this.characterTrait.trait.hasOwnProperty('adder')) {
                levelCost += this._getLevelCost(this.characterTrait.trait.adder)
            }

            if (this.characterTrait.trait.template.hasOwnProperty('mincost')) {
                levelCost = levelCost < this.characterTrait.trait.template.mincost ? this.characterTrait.trait.template.mincost : levelCost;
            }

            if (this.characterTrait.trait.template.hasOwnProperty('lvlval') && this.characterTrait.trait.template.lvlval !== 0) {
                cost += this.characterTrait.trait.levels / this.characterTrait.trait.template.lvlval * levelCost;
            }
        }

        if (this.characterTrait.trait.hasOwnProperty('adder')) {
            cost += this._addAdder(this.characterTrait.trait.adder);
        }

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
        return this.characterTrait.attributes();
    }

    definition() {
        return this.characterTrait.definition();
    }

    roll() {
        return null;
    }

    advantages() {
        return this.characterTrait.advantages();
    }

    limitations() {
        return this.characterTrait.limitations();
    }

    _getLevelCost(adder) {
        let levelCost = 0;

        if (adder === null || adder === undefined) {
            return levelCost;
        }

        if (Array.isArray(adder)) {
            for (let a of adder) {
                levelCost += this._getLevelCost(a);
            }
        } else {
            let templateAdders = this.characterTrait.trait.template.adder;

            for (let ta of templateAdders) {
                if (ta.required && ta.xmlid.toUpperCase() === adder.xmlid.toUpperCase()) {
                    levelCost += adder.basecost;
                    break;
                }
            }
        }

        return levelCost;
    }

    _addAdder(adder) {
        let adderTotal = 0;

        if (adder === undefined || adder === null) {
            return adderTotal;
        }

        if (Array.isArray(adder)) {
            for (let a of adder) {
                adderTotal += this._addAdder(a);
            }
        } else {
            if (adder.levels > 0) {
                adderTotal += adder.basecost + (adder.levels / adder.lvlval * adder.lvlcost);
            } else {
                adderTotal += adder.basecost;
            }
        }

        return adderTotal;
    }
}