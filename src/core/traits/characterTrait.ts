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

import {toKg} from 'core/util';

/** The dynamic, XML-derived trait bag the decorators operate over. */
export type Obj = Record<string, any>;

/** A displayed attribute row `{label, value}`. */
export interface Attribute {
    label: string;
    value: unknown;
}

/** A roll descriptor `{roll, type, ...}` returned by roll-bearing decorators. */
export interface RollDescriptor {
    roll: string;
    type: number;
    [key: string]: unknown;
}

/**
 * Base of the trait-decorator stack, ported from legacy
 * `src/decorators/CharacterTrait.js`. Provides the default cost/roll/label/
 * attribute behaviour; every decorator wraps one of these and overrides
 * selectively (see {@link TraitDecorator}).
 */
export class CharacterTrait {
    trait: Obj;
    parentTrait: Obj | undefined;
    getCharacter: () => Obj;
    listKey: string;

    constructor(item: Obj, listKey: string, getCharacter: () => Obj) {
        this.trait = item;
        this.parentTrait = this.getParent(item, listKey, getCharacter);
        this.getCharacter = getCharacter;
        this.listKey = listKey;
    }

    getTrait(): Obj {
        return this.trait;
    }

    cost(): number {
        return this.trait.basecost || 0;
    }

    costMultiplier(): number {
        return 1;
    }

    activeCost(): number {
        return this.trait.basecost || 0;
    }

    realCost(): number {
        return this.trait.basecost || 0;
    }

    label(): string {
        if (this.trait.name !== null) {
            return this.trait.name;
        }

        return this.trait.alias;
    }

    attributes(): Attribute[] {
        const attributes: Attribute[] = [];

        if (hasOwn(this.trait, 'name') && this.trait.name !== null) {
            attributes.push({label: 'Name', value: this.trait.alias});
        }

        if (hasOwn(this.trait, 'input') && this.trait.input !== null) {
            attributes.push({label: this.trait.template.inputlabel || 'Input', value: this.trait.input});
        }

        if (hasOwn(this.trait, 'optionAlias')) {
            attributes.push({label: this.trait.template.optionlabel || 'Option', value: this.trait.optionAlias});
        }

        if (hasOwn(this.trait, 'adder')) {
            this.addAttribute(this.trait.adder, attributes);
        }

        if (hasOwn(this.trait, 'modifier')) {
            this.addAttribute(this.trait.modifier, attributes);
        }

        if (hasOwn(this.trait, 'quantity') && this.trait.quantity > 1) {
            attributes.push({label: 'Quantity', value: this.trait.quantity});
        }

        if (hasOwn(this.trait, 'price')) {
            attributes.push({label: 'Price', value: `$${this.trait.price}`});
        }

        if (hasOwn(this.trait, 'weight')) {
            attributes.push({label: 'Weight', value: `${toKg(this.trait.weight)} kg`});
        }

        return attributes;
    }

    definition(): string {
        if (this.trait.template !== undefined) {
            return this.trait.template.definition || '';
        }

        return '';
    }

    roll(): RollDescriptor | null {
        return null;
    }

    advantages(): any[] | null {
        return null;
    }

    limitations(): any[] | null {
        return null;
    }

    protected addAttribute(attribute: Obj | Obj[], attributes: Attribute[]): void {
        if (Array.isArray(attribute)) {
            for (const a of attribute) {
                this.addAttribute(a, attributes);
            }
        } else {
            if (!hasOwn(attribute, 'template')) {
                let value = attribute.optionAlias || '';

                if (typeof value === 'string' && value !== '' && value.startsWith('(') && !value.endsWith(')')) {
                    value = value.substring(1);
                }

                if (hasOwn(attribute, 'adder')) {
                    const adders: string[] = [];

                    if (Array.isArray(attribute.adder)) {
                        for (const adder of attribute.adder) {
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

    protected getParent(item: Obj, listKey: string, getCharacter: () => Obj): Obj | undefined {
        let parent: Obj | undefined;

        if (item.parentid === undefined) {
            return parent;
        }

        const character = getCharacter();

        for (const i of character[listKey]) {
            if (i.id === item.parentid) {
                parent = i;
                break;
            }
        }

        return parent;
    }
}

export const hasOwn = (obj: object, key: string): boolean => Object.prototype.hasOwnProperty.call(obj, key);
