import {common} from '../lib/Common';

// Copyright 2018-Present Philip J. Guinchard
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//    http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

export default class CharacterTrait {
    constructor(item, listKey, getCharacter) {
        this.trait = item;
        this.parentTrait = this._getParent(this.trait, listKey, getCharacter);
        this.getCharacter = getCharacter;
        this.listKey = listKey;
    }

    getTrait() {
        return this.item;
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
                value: this.trait.alias,
            });
        }

        if (this.trait.hasOwnProperty('input') && this.trait.input !== null) {
            attributes.push({
                label: this.trait.template.inputlabel || 'Input',
                value: this.trait.input,
            });
        }

        if (this.trait.hasOwnProperty('optionAlias')) {
            attributes.push({
                label: this.trait.template.optionlabel || 'Option',
                value: this.trait.optionAlias,
            });
        }

        if (this.trait.hasOwnProperty('adder')) {
            this._addAttribute(this.trait.adder, attributes);
        }

        if (this.trait.hasOwnProperty('modifier')) {
            this._addAttribute(this.trait.modifier, attributes);
        }

        if (this.trait.hasOwnProperty('quantity') && this.trait.quantity > 1) {
            attributes.push({
                label: 'Quantity',
                value: this.trait.quantity,
            });
        }

        if (this.trait.hasOwnProperty('price')) {
            attributes.push({
                label: 'Price',
                value: `$${this.trait.price}`,
            });
        }

        if (this.trait.hasOwnProperty('weight')) {
            attributes.push({
                label: 'Weight',
                value: `${common.toKg(this.trait.weight)} kg`,
            });
        }

        return attributes;
    }

    definition() {
        if (this.trait.template !== undefined) {
            return this.trait.template.definition || '';
        }

        return '';
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
                this._addAttribute(a, attributes);
            }
        } else {
            if (!attribute.hasOwnProperty('template')) {
                let value = attribute.optionAlias || '';

                if (typeof value === 'string' && value !== '' && value.startsWith('(') && !value.endsWith(')')) {
                    value = value.substring(1);
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
                    value: value + (attribute.levels > 0 ? ` (${attribute.levels} levels)` : ''),
                });
            }
        }
    }

    _getParent(item, listKey, getCharacter) {
        let parent;

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
