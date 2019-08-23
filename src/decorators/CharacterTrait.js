import { Alert } from 'react-native';

export default class CharacterTrait {
    constructor(trait, parentTrait=undefined) {
        this.trait = trait;
        this.parentTrait = parentTrait;
    }

    cost() {
        return this.trait.basecost || 0;
    }

    activeCost() {
        return this.trait.basecost || 0;
    }

    realCost() {
        return this.trait.basecost || 0;
    }

    label() {
        return this.trait.alias;
    }

    definition() {
        return this.trait.template.definition;
    }

    advantages() {
        return null;
    }

    limitations() {
        return null;
    }
}