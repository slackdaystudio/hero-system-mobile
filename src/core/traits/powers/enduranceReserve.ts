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

import {TraitDecorator} from '../traitDecorator';

/** Endurance Reserve (reserve + recovery cost), ported from legacy `powers/EnduranceReserve.js`. */
export default class EnduranceReserve extends TraitDecorator {
    cost(): number {
        const trait = this.characterTrait.trait;

        let cost = Math.ceil((trait.levels / trait.template.lvlval) * trait.template.lvlcost);
        cost += Math.ceil((trait.power.levels / trait.template.endurancereserverec.lvlval) * trait.template.endurancereserverec.lvlcost);

        return cost;
    }
}
