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

/** Resource pool perk (money/equipment/etc.), ported from legacy `decorators/perks/ResourcePoints.js`. */
export default class ResourcePoints extends TraitDecorator {
    cost(): number {
        let cost = this.characterTrait.cost() || 0;

        if (this.characterTrait.trait.levels > 1) {
            let option = null;

            for (const o of this.characterTrait.trait.template.option) {
                if (o.xmlid.toUpperCase() === this.characterTrait.trait.option.toUpperCase()) {
                    option = o;
                    break;
                }
            }

            cost += Math.ceil(this.characterTrait.trait.levels / option.lvlval) * option.lvlcost;
        }

        return cost;
    }

    // Faithful to legacy: returns a roll descriptor, not a number. costMultiplier
    // is never consumed for resource pools, so the type mismatch is inert.
    costMultiplier(): number {
        return this.characterTrait.roll() as unknown as number;
    }
}
