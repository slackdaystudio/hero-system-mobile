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

import {type Attribute, type Obj} from '../characterTrait';
import {TraitDecorator} from '../traitDecorator';

/**
 * Damage Negation, ported from legacy `powers/DamageNegation.js`. Note it *replaces*
 * the delegated attributes rather than appending to them — the adders are the whole
 * writeup, exactly as legacy has it.
 */
export default class DamageNegation extends TraitDecorator {
    attributes(): Attribute[] {
        const attributes: Attribute[] = [];

        for (const adder of this.characterTrait.trait.adder as Obj[]) {
            if (adder.levels > 0) {
                attributes.push({label: `-${adder.levels} ${adder.alias}`, value: ''});
            }
        }

        return attributes;
    }
}
