import { Alert } from 'react-native';
import CharacterTrait from './CharacterTrait';

export default class BaseCost extends CharacterTrait {
    constructor(characterTrait) {
        super(characterTrait.trait, characterTrait.parentTrait);

        this.characterTrait = characterTrait;
    }

    cost() {
        let cost = this.characterTrait.trait.basecost;

        if (this.characterTrait.trait.levels > 0) {
            let levelCost = this.characterTrait.trait.template.hasOwnProperty('lvlcost') ? this.characterTrait.trait.template.lvlcost : this._getLevelCost(this.characterTrait.trait.adder);

            if (this.characterTrait.trait.template.hasOwnProperty('mincost')) {
                levelCost = levelCost < this.characterTrait.trait.template.mincost ? this.characterTrait.trait.template.mincost : levelCost;
            }

            if (this.characterTrait.trait.template.lvlval != 0) {
                cost += this.characterTrait.trait.levels / this.characterTrait.trait.template.lvlval * levelCost;
            }
        }

        if (this.characterTrait.trait.hasOwnProperty('adder')) {
            cost += this._addAdder(this.characterTrait.trait.adder);
        }

        if (this.characterTrait.trait.hasOwnProperty('modifier')) {
            cost *= this._getModifierMultiplier(this.characterTrait.trait.modifier);
        }

        return cost;
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

    advantages() {
        return this.characterTrait.advantages();
    }

    limitations() {
        return this.characterTrait.limitations();
    }

    _getLevelCost(adder) {
//        if (this.characterTrait.trait.hasOwnProperty('option')) {
//            return
//        }

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

        if (Array.isArray(adder)) {
            for (let a of adder) {
                adderTotal += this._addAdder(a);
            }
        } else {
            adderTotal += adder.required ? 0 : adder.basecost + (adder.levels / adder.lvlval * adder.lvlcost);
        }

        return adderTotal;
    }

    _getModifierMultiplier(modifier) {
        let modifierTotal = 0;

        if (Array.isArray(modifier)) {
            for (let m of modifier) {
                modifierTotal += this._getModifierMultiplier(m);
            }
        } else {
            if (modifier.multiplier) {
                if (modifier.number > 1) {
                    for (let i = 0; i < modifier.number; i++) {
                        modifierTotal += modifier.template.multipliercost;
                    }
                }
            }
        }

        return modifierTotal;
    }
}