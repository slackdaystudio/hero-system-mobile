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

/** Transport Familiarity cost (from adders), ported from legacy `skills/TransportFamiliarity.js`. */
export default class TransportFamiliarity extends TraitDecorator {
    cost(): number {
        let cost = 1;

        if (hasOwn(this.characterTrait.trait, 'adder')) {
            cost = this.totalAdders(this.characterTrait.trait.adder);
        }

        return cost;
    }

    private totalAdders(adder: Obj | Obj[]): number {
        let cost = 0;

        if (Array.isArray(adder)) {
            for (const a of adder) {
                cost += this.totalAdder(a);
            }
        } else {
            cost += this.totalAdder(adder);
        }

        return cost;
    }

    private totalAdder(adder: Obj): number {
        let cost = 0;

        if (hasOwn(adder, 'adder')) {
            cost += this.totalAdders(adder.adder);
        } else {
            cost += adder.basecost;
        }

        return cost;
    }
}
