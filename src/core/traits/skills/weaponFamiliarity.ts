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

import {hasOwn, type Obj} from '../characterTrait';
import {TraitDecorator} from '../traitDecorator';

/** Weapon Familiarity cost (from adders), ported from legacy `skills/WeaponFamiliarity.js`. */
export default class WeaponFamiliarity extends TraitDecorator {
    cost(): number {
        return this.totalAdders(this.characterTrait.trait.adder);
    }

    private totalAdders(adder: Obj | Obj[] | undefined | null): number {
        let cost = 0;

        if (adder === undefined || adder === null) {
            return cost;
        }

        if (Array.isArray(adder)) {
            for (const a of adder) {
                cost += a.basecost;

                if (hasOwn(a, 'adder')) {
                    cost += this.totalAdders(a.adder);
                }
            }
        } else {
            cost += adder.basecost;

            if (hasOwn(adder, 'adder')) {
                cost += this.totalAdders(adder.adder);
            }
        }

        return cost;
    }
}
