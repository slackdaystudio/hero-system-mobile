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
import {TraitDecorator} from '../traitDecorator';

/** Clinging, ported from legacy `powers/Clinging.js`. */
export default class Clinging extends TraitDecorator {
    /**
     * H10 (docs/KNOWN_DEVIATIONS.md) — intentional divergence: legacy ended `return cost + 1`,
     * which put Clinging's floor at 11. 5E prices it at **10 base, +1 per +3 STR**, and the
     * template says so itself — `basecost: 10`, `lvlcost: 1`, `lvlval: 3`, and a **`mincost: 10`**
     * that the stray +1 made unreachable. Nothing in the rules adds a point.
     */
    cost(): number {
        const trait = this.characterTrait.trait;

        return trait.basecost + getMultiplierCost(trait.levels, trait.template.lvlval, trait.template.lvlcost);
    }
}
