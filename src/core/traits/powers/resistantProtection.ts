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

import {totalAdders} from 'core/util';
import {type Attribute} from '../characterTrait';
import {TraitDecorator} from '../traitDecorator';

/** Resistant Protection / Force Field, ported from legacy `powers/ResistantProtection.js`. */
export default class ResistantProtection extends TraitDecorator {
    cost(): number {
        const trait = this.characterTrait.trait;

        let cost = trait.basecost;
        cost += Math.ceil(trait.levels / trait.template.lvlval) * trait.template.lvlcost;
        cost += totalAdders(trait.adder);

        return cost;
    }

    attributes(): Attribute[] {
        const attributes = this.characterTrait.attributes();
        const trait = this.characterTrait.trait;

        if (trait.pdlevels > 0) {
            attributes.push({label: 'Physical Defense', value: trait.pdlevels});
        }

        if (trait.edlevels > 0) {
            attributes.push({label: 'Energy Defense', value: trait.edlevels});
        }

        if (trait.mdlevels > 0) {
            attributes.push({label: 'Mental Defense', value: trait.mdlevels});
        }

        if (trait.powdlevels > 0) {
            attributes.push({label: 'Power Defense', value: trait.powdlevels});
        }

        return attributes;
    }
}
