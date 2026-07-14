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
    cost(): number {
        let cost = this.characterTrait.trait.basecost;

        cost += getMultiplierCost(this.characterTrait.trait.levels, this.characterTrait.trait.template.lvlval, this.characterTrait.trait.template.lvlcost);

        return cost + 1;
    }
}
