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

import {getMultiplierCost} from 'core/util';
import {hasOwn, type Obj, type RollDescriptor} from './characterTrait';
import {TraitDecorator} from './traitDecorator';

/**
 * The canonical non-skill cost engine, ported from legacy `decorators/BaseCost.js`:
 * base cost + per-level cost (from the template `option`/`lvlcost`/`lvlval`/
 * `mincost`) + recursive adder/sub-adder totals. Most powers sit on top of this.
 */
export default class BaseCost extends TraitDecorator {
    cost(): number {
        let cost = this.characterTrait.cost();
        const trait = this.characterTrait.trait;

        if (trait.levels > 0) {
            let levelCost = 0;

            if (hasOwn(trait, 'option') && hasOwn(trait.template, 'option')) {
                for (const option of trait.template.option) {
                    if (option.xmlid.toUpperCase() === trait.option.toUpperCase()) {
                        levelCost = option.lvlcost || trait.lvlcost;
                        break;
                    }
                }
            } else if (hasOwn(trait.template, 'lvlcost')) {
                levelCost = trait.template.lvlcost;
            } else if (hasOwn(trait, 'adder')) {
                levelCost += this.getLevelCost(trait.adder);
            }

            if (hasOwn(trait.template, 'mincost')) {
                levelCost = levelCost < trait.template.mincost ? trait.template.mincost : levelCost;
            }

            if (hasOwn(trait.template, 'lvlval') && trait.template.lvlval !== 0) {
                cost += (trait.levels / trait.template.lvlval) * levelCost;
            }
        }

        cost += this.addAdder(trait.adder);

        return Math.round(cost);
    }

    roll(): RollDescriptor | null {
        return null;
    }

    private getLevelCost(adder: Obj | Obj[] | null | undefined): number {
        let levelCost = 0;

        if (adder === null || adder === undefined) {
            return levelCost;
        }

        if (Array.isArray(adder)) {
            for (const a of adder) {
                levelCost += this.getLevelCost(a);
            }
        } else {
            const templateAdders = this.characterTrait.trait.template.adder;

            if (Array.isArray(templateAdders)) {
                for (const ta of templateAdders) {
                    if (ta.required && ta.xmlid.toUpperCase() === adder.xmlid.toUpperCase()) {
                        levelCost += adder.basecost;
                        break;
                    }
                }
            }
        }

        return levelCost;
    }

    private addAdder(adder: Obj | Obj[] | null | undefined): number {
        let adderTotal = 0;

        if (adder === undefined || adder === null) {
            return adderTotal;
        }

        if (Array.isArray(adder)) {
            for (const a of adder) {
                adderTotal += this.addAdder(a);
            }
        } else {
            if (adder.levels > 0) {
                adderTotal += getMultiplierCost(adder.levels, adder.lvlval, adder.lvlcost);
            } else {
                adderTotal += adder.basecost;
            }

            if (hasOwn(adder, 'adder')) {
                adderTotal += this.addSubAdder(adder.adder);
            }
        }

        return adderTotal;
    }

    private addSubAdder(subAdder: Obj | Obj[]): number {
        let subTotal = 0;

        if (Array.isArray(subAdder)) {
            for (const s of subAdder) {
                subTotal += this.addSubAdder(s);
            }
        } else {
            subTotal += subAdder.basecost;
        }

        return subTotal;
    }
}
