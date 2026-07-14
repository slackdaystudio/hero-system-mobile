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

/** An elemental-control slot: real cost is active cost minus the pool base.
 *  Ported from legacy `powers/ElementalControlItem.js`. */
export default class ElementalControlItem extends TraitDecorator {
    realCost(): number {
        return Math.floor((this.activeCost() - this.characterTrait.parentTrait!.basecost) / (1 - this.limitations()!.reduce((a: number, b: {cost: number}) => a + b.cost, 0)));
    }
}
