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

import {hasOwn} from './characterTrait';
import {TraitDecorator} from './traitDecorator';

/** Adder-count skill cost (Animal Handler, Navigation, Weaponsmith), ported from legacy `SkillWithAdders.js`. */
export default class SkillWithAdders extends TraitDecorator {
    cost(): number {
        let cost = 3;
        const trait = this.characterTrait.trait;

        if (hasOwn(trait, 'adder')) {
            if (Array.isArray(trait.adder)) {
                cost = trait.adder.length + 1;
            } else {
                cost = 2;
            }
        }

        cost += (trait.levels / trait.template.characteristicChoice.item.lvlval) * trait.template.characteristicChoice.item.lvlcost;

        return cost;
    }
}
