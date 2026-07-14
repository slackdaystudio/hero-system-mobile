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
import {type Attribute} from '../characterTrait';
import {TraitDecorator} from '../traitDecorator';

/** Follower / Vehicle-or-Base perk, ported from legacy `decorators/perks/FollowerAndBase.js`. */
export default class FollowerAndBase extends TraitDecorator {
    cost(): number {
        let cost = this.characterTrait.cost();

        cost += Math.round(this.characterTrait.trait.basepoints / this.characterTrait.trait.template.lvlval);

        if (this.characterTrait.trait.number > 1) {
            cost += getMultiplierCost(this.characterTrait.trait.number, this.characterTrait.trait.template.multiplierval, this.characterTrait.trait.template.multipliercost);
        }

        return cost;
    }

    attributes(): Attribute[] {
        const attributes = this.characterTrait.attributes();

        attributes.push({label: 'Base Points', value: this.characterTrait.trait.basepoints});
        attributes.push({label: 'Complications', value: this.characterTrait.trait.disadpoints});
        attributes.push({label: 'Number', value: this.characterTrait.trait.number});

        return attributes;
    }
}
