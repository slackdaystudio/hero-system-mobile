import { common } from '../../lib/Common';

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

export default class Modifier {
    constructor(modifier, trait, getCharacter) {
        this.modifier = modifier;
        this.trait = trait;
        this.getCharacter = getCharacter;
    }

    cost() {
        let basecost = this.modifier.basecost;

        if (this.modifier.levels > 0) {
            if (this.modifier.hasOwnProperty('template') && this.modifier.template.hasOwnProperty('lvlcost')) {
                basecost += this.modifier.template.lvlcost / this.modifier.template.lvlval * this.modifier.levels;
            } else if (this.trait.hasOwnProperty('template') && this.trait.template.hasOwnProperty('modifier')) {
                let templateModifier = null;

                if (Array.isArray(this.trait.template.modifier)) {
                    for (let m of this.trait.template.modifier) {
                        if (m.xmlid.toUpperCase() === this.modifier.xmlid.toUpperCase()) {
                            templateModifier = m;
                            break;
                        }
                    }
                } else if (this.trait.template.modifier.xmlid.toUpperCase() === this.modifier.xmlid.toUpperCase()) {
                    templateModifier = this.trait.template.modifier;
                }

                if (templateModifier !== null) {
                    basecost += templateModifier.lvlcost / templateModifier.lvlval * this.modifier.levels;
                }
            }
        }

        if (this.modifier.hasOwnProperty('optionid')) {
            if (this.modifier.hasOwnProperty('template')) {
                if (this.modifier.template.hasOwnProperty('option')) {
                    basecost = this._getCostByOptionOrModifier(basecost, this.modifier.template.option);
                } else if (this.modifier.template.hasOwnProperty('modifier')) {
                    basecost = this._getCostByOptionOrModifier(basecost, this.modifier.template.modifier);
                }
            }
        }

        let totalModifiers = this._getAdderTotal(basecost, this.modifier.modifier, this.modifier);

        if (this.modifier.hasOwnProperty('adder')) {
            if (Array.isArray(this.modifier.adder)) {
                for (let adder of this.modifier.adder) {
                    totalModifiers += this._getAdderTotal(adder.basecost, this.modifier.modifier, this.modifier) || 0;
                }
            } else {
                totalModifiers += this._getAdderTotal(this.modifier.adder.basecost, this.modifier.modifier, this.modifier) || 0;
            }
        }

        let minMaxCosts = this._getMinMaxCosts();

        if (minMaxCosts.hasOwnProperty('min')) {
            totalModifiers = totalModifiers < minMaxCosts.min ? minMaxCosts.min : totalModifiers;
        }

        if (minMaxCosts.hasOwnProperty('max')) {
            totalModifiers = totalModifiers > minMaxCosts.max ? minMaxCosts.max : totalModifiers;
        }

        return totalModifiers;
    }

    label(cost) {
        let adders = [];
        let label = this.modifier.alias + (this.modifier.levels > 0 ? ` x${this.modifier.levels}` : '');

        if (this.modifier.hasOwnProperty('optionAlias')) {
            label += `, ${this.modifier.optionAlias}`;
        }

        if (this.modifier.hasOwnProperty('adder')) {
            if (Array.isArray(this.modifier.adder)) {
                for (let adder of this.modifier.adder) {
                    adders.push(this._getAdderLabel(adder));
                }
            } else {
                adders.push(this._getAdderLabel(this.modifier.adder));
            }
        }

        if (this.modifier.hasOwnProperty('modifier')) {
            if (Array.isArray(this.modifier.modifier)) {
                for (let m of this.modifier.modifier) {
                    label += `, ${m.alias}`;
                }
            } else {
                label += `, ${this.modifier.modifier.alias}`;
            }
        }

        if (adders.length > 0) {
            label += ` (${adders.join(', ')})`;
        }

        label += `: ${this._formatCost(cost === undefined ? this.cost() : cost)}`;

        return label;
    }

    _formatCost(cost) {
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

    _getAdderLabel(adder) {
        let label = '';

        if (adder.hasOwnProperty('levels') && adder.levels > 0) {
            label += `x${adder.levels} `;
        }

        label += `${adder.alias}${adder.optionAlias === undefined ? '' : adder.optionAlias}`;

        return label;
    }

    _getAdderTotal(cost, subModifier, modifier) {
        let totalAdderCost = cost;

        if (subModifier !== undefined && subModifier !== null) {
            if (Array.isArray(subModifier)) {
                for (let mod of subModifier) {
                    totalAdderCost += this._getAdderTotal(mod.cost, mod, modifier);
                }
            } else {
                if (cost < 0) {
                    let newCost = parseFloat((totalAdderCost / 2).toFixed(2));

                    totalAdderCost = parseFloat((Math.round(newCost * 4) / 4).toFixed(2));
                } else {
                    totalAdderCost *= 2;
                }
            }
        }

        return totalAdderCost;
    }

    _getMinMaxCosts() {
        let costs = {
            min: undefined,
            max: undefined,
        };

        if (this.modifier === null || this.modifier === undefined) {
            return costs;
        }

        if (this.modifier.hasOwnProperty('template')) {
            if (this.modifier.template.hasOwnProperty('mincost') || this.modifier.template.hasOwnProperty('maxcost')) {
                costs.min = this.modifier.template.mincost || undefined;
                costs.max = this.modifier.template.maxcost || undefined;
            } else if (this.modifier.template.hasOwnProperty('option') && this.modifier.hasOwnProperty('optionid')) {
                if (Array.isArray(this.modifier.template.option)) {
                    for (let option of this.modifier.template.option) {
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

    _getCostByOptionOrModifier(basecost, optionOrModifier) {
        if (Array.isArray(optionOrModifier)) {
            for (let item of optionOrModifier) {
                if (common.isInt(item.xmlid)) {
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
