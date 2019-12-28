import { Alert } from 'react-native';
import CharacterTrait from './CharacterTrait';
import { common } from '../lib/Common';
import { SKILL_ENHANCERS } from '../lib/HeroDesignerCharacter';
import { modifierDecorator } from './modifiers/ModifierDecorator';

export default class ModifierCalculator extends CharacterTrait {
    constructor(characterTrait) {
        super(characterTrait.trait, characterTrait.listKey, characterTrait.getCharacter);

        this.characterTrait = characterTrait;
        this.modifiers = this._getItemTotalModifiers(this.characterTrait.trait).concat(this._getItemTotalModifiers(this.characterTrait.parentTrait));
    }

    cost() {
        return this.characterTrait.cost();
    }

    costMultiplier() {
        return this.characterTrait.costMultiplier();
    }

    activeCost() {
        let activeCost = this.cost() * (1 + this.advantages().reduce((a, b) => a + b.cost, 0));

        return common.roundInPlayersFavor(activeCost);
    }

    realCost() {
        let realCost = common.roundInPlayersFavor(this.activeCost() / (1 - this.limitations().reduce((a, b) => a + b.cost, 0)));

        if (this.characterTrait.parentTrait !== undefined &&
            SKILL_ENHANCERS.includes(this.characterTrait.parentTrait.xmlid.toUpperCase())) {
            realCost = realCost - 1 <= 0 ? 1 : realCost - 1;
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
        return this.modifiers.filter(m => m.cost >= 0);
    }

    limitations() {
        return this.modifiers.filter(m => m.cost < 0);
    }

    _getItemTotalModifiers(trait) {
        let totalModifiers = [];
        let modifierCost = 0;

        if (trait === null || trait === undefined || !trait.hasOwnProperty('modifier')) {
            return totalModifiers;
        }

        if (trait.hasOwnProperty('modifier')) {
            let decorated = null;

            if (Array.isArray(trait.modifier)) {
                for (let modifier of trait.modifier) {
                    decorated = modifierDecorator.decorate(modifier, trait);

                    totalModifiers.push({
                        label: decorated.label(),
                        cost: decorated.cost()
                    });
                }
            } else {
                decorated = modifierDecorator.decorate(trait.modifier, trait);

                totalModifiers.push({
                    label: decorated.label(),
                    cost: decorated.cost()
                });
            }
        }

        return totalModifiers;
    }
}