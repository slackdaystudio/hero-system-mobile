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

import {isInt} from 'core/util';
import {hasOwn, type Obj} from '../characterTrait';

/**
 * Computes a single advantage/limitation modifier's fractional cost and label,
 * ported from legacy `decorators/modifiers/Modifier.js`. Feeds `ModifierCalculator`.
 */
export default class Modifier {
    modifier: Obj;
    trait: Obj;
    getCharacter: () => Obj;

    constructor(modifier: Obj, trait: Obj, getCharacter: () => Obj) {
        this.modifier = modifier;
        this.trait = trait;
        this.getCharacter = getCharacter;
    }

    cost(): number {
        let basecost = this.modifier.basecost;

        if (this.modifier.levels > 0) {
            if (hasOwn(this.modifier, 'template') && hasOwn(this.modifier.template, 'lvlcost')) {
                basecost += (this.modifier.template.lvlcost / this.modifier.template.lvlval) * this.modifier.levels;
            } else if (hasOwn(this.trait, 'template') && hasOwn(this.trait.template, 'modifier')) {
                let templateModifier = null;

                if (Array.isArray(this.trait.template.modifier)) {
                    for (const m of this.trait.template.modifier) {
                        if (m.xmlid.toUpperCase() === this.modifier.xmlid.toUpperCase()) {
                            templateModifier = m;
                            break;
                        }
                    }
                } else if (this.trait.template.modifier.xmlid.toUpperCase() === this.modifier.xmlid.toUpperCase()) {
                    templateModifier = this.trait.template.modifier;
                }

                if (templateModifier !== null) {
                    basecost += (templateModifier.lvlcost / templateModifier.lvlval) * this.modifier.levels;
                }
            }
        }

        if (hasOwn(this.modifier, 'optionid')) {
            if (hasOwn(this.modifier, 'template')) {
                if (hasOwn(this.modifier.template, 'option')) {
                    basecost = this.getCostByOptionOrModifier(basecost, this.modifier.template.option);
                } else if (hasOwn(this.modifier.template, 'modifier')) {
                    basecost = this.getCostByOptionOrModifier(basecost, this.modifier.template.modifier);
                }
            }
        }

        let totalModifiers = this.getAdderTotal(basecost, this.modifier.modifier, this.modifier);

        if (hasOwn(this.modifier, 'adder')) {
            if (Array.isArray(this.modifier.adder)) {
                for (const adder of this.modifier.adder) {
                    totalModifiers += this.getAdderTotal(adder.basecost, this.modifier.modifier, this.modifier) || 0;
                }
            } else {
                totalModifiers += this.getAdderTotal(this.modifier.adder.basecost, this.modifier.modifier, this.modifier) || 0;
            }
        }

        const minMaxCosts = this.getMinMaxCosts();

        if (hasOwn(minMaxCosts, 'min')) {
            totalModifiers = totalModifiers < (minMaxCosts.min as number) ? (minMaxCosts.min as number) : totalModifiers;
        }

        if (hasOwn(minMaxCosts, 'max')) {
            totalModifiers = totalModifiers > (minMaxCosts.max as number) ? (minMaxCosts.max as number) : totalModifiers;
        }

        return totalModifiers;
    }

    label(cost?: number): string {
        const adders: string[] = [];
        let label = this.modifier.alias + (this.modifier.levels > 0 ? ` x${this.modifier.levels}` : '');

        if (hasOwn(this.modifier, 'optionAlias')) {
            label += `, ${this.modifier.optionAlias}`;
        }

        if (hasOwn(this.modifier, 'adder')) {
            if (Array.isArray(this.modifier.adder)) {
                for (const adder of this.modifier.adder) {
                    adders.push(this.getAdderLabel(adder));
                }
            } else {
                adders.push(this.getAdderLabel(this.modifier.adder));
            }
        }

        if (hasOwn(this.modifier, 'modifier')) {
            if (Array.isArray(this.modifier.modifier)) {
                for (const m of this.modifier.modifier) {
                    label += `, ${m.alias}`;
                }
            } else {
                label += `, ${this.modifier.modifier.alias}`;
            }
        }

        if (adders.length > 0) {
            label += ` (${adders.join(', ')})`;
        }

        label += `: ${this.formatCost(cost === undefined ? this.cost() : cost)}`;

        return label;
    }

    private formatCost(cost: number): string {
        if (cost === 0) {
            return '+0';
        }

        let formattedCost = cost < 0 ? '' : '+';

        formattedCost += Math.trunc(cost) === 0 ? '' : Math.trunc(cost);

        switch ((cost % 1).toFixed(2)) {
            case '0.25':
            case '-0.25':
                formattedCost += '¼';
                break;
            case '0.50':
            case '-0.50':
                formattedCost += '½';
                break;
            case '0.75':
            case '-0.75':
                formattedCost += '¾';
                break;
        }

        if (cost < 0 && !formattedCost.startsWith('-')) {
            formattedCost = `-${formattedCost}`;
        }

        return formattedCost;
    }

    private getAdderLabel(adder: Obj): string {
        let label = '';

        if (hasOwn(adder, 'levels') && adder.levels > 0) {
            label += `x${adder.levels} `;
        }

        label += `${adder.alias}${adder.optionAlias === undefined ? '' : adder.optionAlias}`;

        return label;
    }

    private getAdderTotal(cost: number, subModifier: Obj | Obj[] | undefined | null, modifier: Obj): number {
        let totalAdderCost = cost;

        if (subModifier !== undefined && subModifier !== null) {
            if (Array.isArray(subModifier)) {
                for (const mod of subModifier) {
                    totalAdderCost += this.getAdderTotal(mod.cost, mod, modifier);
                }
            } else {
                if (cost < 0) {
                    const newCost = parseFloat((totalAdderCost / 2).toFixed(2));

                    totalAdderCost = parseFloat((Math.round(newCost * 4) / 4).toFixed(2));
                } else {
                    totalAdderCost *= 2;
                }
            }
        }

        return totalAdderCost;
    }

    private getMinMaxCosts(): {min?: number; max?: number} {
        const costs: {min?: number; max?: number} = {min: undefined, max: undefined};

        if (this.modifier === null || this.modifier === undefined) {
            return costs;
        }

        if (hasOwn(this.modifier, 'template')) {
            if (hasOwn(this.modifier.template, 'mincost') || hasOwn(this.modifier.template, 'maxcost')) {
                costs.min = this.modifier.template.mincost || undefined;
                costs.max = this.modifier.template.maxcost || undefined;
            } else if (hasOwn(this.modifier.template, 'option') && hasOwn(this.modifier, 'optionid')) {
                if (Array.isArray(this.modifier.template.option)) {
                    for (const option of this.modifier.template.option) {
                        if (option.xmlid === this.modifier.optionid) {
                            costs.min = option.mincost || undefined;
                            costs.max = option.maxcost || undefined;
                            break;
                        }
                    }
                } else {
                    costs.min = this.modifier.template.option.mincost || undefined;
                    costs.max = this.modifier.template.option.maxcost || undefined;
                }
            }
        }

        return costs;
    }

    private getCostByOptionOrModifier(basecost: number, optionOrModifier: Obj | Obj[]): number {
        if (Array.isArray(optionOrModifier)) {
            for (const item of optionOrModifier) {
                if (isInt(item.xmlid)) {
                    if (item.xmlid === this.modifier.optionid) {
                        basecost = item.basecost || basecost;
                        break;
                    }
                } else if (item.xmlid.toUpperCase() === this.modifier.optionid.toUpperCase()) {
                    basecost = item.basecost || basecost;
                    break;
                }
            }
        } else {
            basecost = optionOrModifier.basecost || basecost;
        }

        return basecost;
    }
}
