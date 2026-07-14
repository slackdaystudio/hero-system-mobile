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

import {type Obj} from '../characterTrait';
import {TraitDecorator} from '../traitDecorator';

/** Possession, ported from legacy `powers/Possession.js`. */
export default class Possession extends TraitDecorator {
    cost(): number {
        let cost = this.trait.basecost;

        cost += this.addAdder(this.characterTrait.trait.adder);

        return Math.ceil(cost);
    }

    private addAdder(adder: Obj | Obj[] | undefined | null): number {
        let cost = 0;

        if (adder === undefined || adder === null) {
            return cost;
        }

        if (Array.isArray(adder)) {
            for (const a of adder) {
                cost += this.addAdder(a);
            }
        } else {
            cost += adder.basecost;

            if (adder.levels > 0) {
                cost = (adder.levels / adder.lvlval) * adder.lvlcost;
            }
        }

        return cost;
    }
}
