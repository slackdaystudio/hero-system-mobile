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

import {getMultiplierCost, totalAdders} from 'core/util';
import {TraitDecorator} from '../traitDecorator';

/** Duplication, ported from legacy `powers/Duplication.js`. */
export default class Duplication extends TraitDecorator {
    cost(): number {
        const trait = this.characterTrait.trait;
        let cost = 0;

        if (trait.points === 0) {
            cost = 1;
        } else {
            cost = Math.round(trait.points / trait.template.lvlval);
        }

        cost = cost < 1 ? 1 : cost;
        cost += totalAdders(trait.adder);
        cost += getMultiplierCost(trait.number, trait.template.multiplierval, trait.template.multipliercost);

        return cost;
    }
}
