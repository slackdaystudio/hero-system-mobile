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

import {roundInPlayersFavor} from 'core/util';
import {TraitDecorator} from './traitDecorator';

/** Naked advantage (advantage applied to a chunk of Active Points), ported from
 *  legacy `decorators/NakedModifier.js`. */
export default class NakedModifier extends TraitDecorator {
    cost(): number {
        return this.characterTrait.trait.levels || 0;
    }

    activeCost(): number {
        return roundInPlayersFavor(this.cost() * (1 + this.advantages()!.reduce((a: number, b: {cost: number}) => a + b.cost, 0))) - this.cost();
    }

    realCost(): number {
        return roundInPlayersFavor(this.activeCost() / (1 - this.limitations()!.reduce((a: number, b: {cost: number}) => a + b.cost, 0)));
    }
}
