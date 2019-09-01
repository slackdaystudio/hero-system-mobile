import { Alert } from 'react-native';
import { common } from '../lib/Common';

export default class CharacterTrait {
    constructor(item, listKey, getCharacter) {
        this.trait = item;
        this.parentTrait = this._getParent(this.trait, listKey, getCharacter);
        this.getCharacter = getCharacter;
        this.listKey = listKey;
    }

    cost() {
        return this.trait.basecost || 0;
    }

    costMultiplier() {
        return 1;
    }

    activeCost() {
        return this.trait.basecost || 0;
    }

    realCost() {
        return this.trait.basecost || 0;
    }

    label() {
        if (this.trait.name !== null) {
            return this.trait.name;
        }

        return this.trait.alias;
    }

    attributes() {
        let attributes = [];

        if (this.trait.hasOwnProperty('name') && this.trait.name !== null) {
            attributes.push({
                label: 'Name',
                value: this.trait.alias
            });
        }

        if (this.trait.hasOwnProperty('input') && this.trait.input !== null) {
            attributes.push({
                label: this.trait.template.inputlabel || 'Input',
                value: this.trait.input
            });
        }

        if (this.trait.hasOwnProperty('optionAlias')) {
            attributes.push({
                label: this.trait.template.optionlabel || 'Option',
                value: this.trait.optionAlias
            });
        }

        if (this.trait.hasOwnProperty('adder')) {
            this._addAttribute(this.trait.adder, attributes);
        }

        if (this.trait.hasOwnProperty('modifier')) {
            this._addAttribute(this.trait.modifier, attributes);
        }

        return attributes;
    }

    definition() {
        return this.trait.template.definition || '';
    }

    roll() {
        return null;
    }

    advantages() {
        return null;
    }

    limitations() {
        return null;
    }

    _addAttribute(attribute, attributes) {
        if (Array.isArray(attribute)) {
            for (let a of attribute) {
                this._addAttribute(a, attributes)
            }
        } else {
            if (!attribute.hasOwnProperty('template')) {
                let value = attribute.optionAlias || '';

                if (value !== '' && (value.startsWith('(') && !value.endsWith(')'))) {
                    value = value.substr(1);
                }

                if (attribute.hasOwnProperty('adder')) {
                    let adders = [];

                    if (Array.isArray(attribute.adder)) {
                        for (let adder of attribute.adder) {
                            adders.push(adder.alias);
                        }
                    } else {
                        adders.push(attribute.adder.alias);
                    }

                    value += adders.join(', ');
                }

                attributes.push({
                    label: attribute.alias,
                    value: value + (attribute.levels > 0 ? ` (${attribute.levels} levels)` : '')
                });
            }
        }
    }

    _getParent(item, listKey, getCharacter) {
        let parent = undefined;

        if (item.parentid === undefined) {
            return parent;
        }

        let character = getCharacter();

        for (let i of character[listKey]) {
            if (i.id === item.parentid) {
                parent = i;
                break;
            }
        }

        return parent;
    }
}