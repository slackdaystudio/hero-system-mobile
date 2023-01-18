import CharacterTrait from '../CharacterTrait';
import {common} from '../../lib/Common';

export default class ElementalControlItem extends CharacterTrait {
    constructor(characterTrait) {
        super(characterTrait.trait, characterTrait.listKey, characterTrait.getCharacter);

        this.characterTrait = characterTrait;
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
        const itemLimitationsTotal = this._totalModifiers(this.limitations());
        const itemAdvantagesTotal = this._totalModifiers(this.advantages());
        const parentBasecost = this.characterTrait.parentTrait.basecost;

        if (itemAdvantagesTotal > 0) {
            return common.roundInPlayersFavor((this.cost() * (1 + itemAdvantagesTotal) - parentBasecost) / (1 - itemLimitationsTotal));
        }

        return common.roundInPlayersFavor((this.activeCost() - parentBasecost) / (1 - itemLimitationsTotal));
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

    _totalModifiers(modifiers) {
        if (modifiers === undefined) {
            return 0;
        }

        return modifiers.reduce((a, b) => a + (b.cost ? b.cost : b.basecost), 0);
    }
}
