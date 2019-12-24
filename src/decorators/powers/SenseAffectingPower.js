import { Alert } from 'react-native';
import CharacterTrait from '../CharacterTrait';
import { SKILL_CHECK } from '../../lib/DieRoller';

export default class SenseAffectingPower extends CharacterTrait {
    constructor(characterTrait) {
        super(characterTrait.trait, characterTrait.listKey, characterTrait.getCharacter);

        this.characterTrait = characterTrait;
    }

    cost() {
        let cost = 0;
        let counts = this._getCounts();

        return ((counts.group * this.characterTrait.trait.template.groupcost) + (counts.sense * this.characterTrait.trait.template.sensecost)) * this.characterTrait.trait.levels / this.characterTrait.trait.template.lvlval;
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
        return this.characterTrait.roll();
    }

    advantages() {
        return this.characterTrait.advantages();
    }

    limitations() {
        return this.characterTrait.limitations();
    }

    _getCounts() {
        let counts = {
            group: 0,
            sense: 0
        };

        if (this._isGroup(this.characterTrait.trait.option)) {
            counts.group++;
        } else {
            counts.sense++;
        }

        this._getAdderCounts(this.characterTrait.trait.adder, counts);

        return counts;
    }

    _getAdderCounts(adders, counts) {
        if (adders === null || adders === undefined) {
            return counts;
        }

        if (Array.isArray(adders)) {
            for (let adder of adders) {
                this._getAdderCounts(adder, counts);
            }
        } else {
            if (this._isGroup(adders.xmlid)) {
                counts.group++;
            } else {
                counts.sense++;
            }
        }

        return counts;
    }

    _isGroup(name) {
        return name.endsWith('GROUP');
    }
}