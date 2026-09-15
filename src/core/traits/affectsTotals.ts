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

import {type Attribute} from './characterTrait';
import {TraitDecorator} from './traitDecorator';

/**
 * Notes whether a trait's value reaches the character's totals, ported from legacy
 * `AffectsTotals.js`. Attribute-only — it reports the `affectsTotal`/`affectsPrimary`
 * flags the engine already set, and changes no cost.
 */
export default class AffectsTotals extends TraitDecorator {
    attributes(): Attribute[] {
        const attributes = this.characterTrait.attributes();
        const trait = this.characterTrait.trait;

        if (trait.affectsTotal) {
            attributes.push({label: `Added to ${trait.affectsPrimary ? 'Primary' : 'Secondary'}`, value: ''});
        } else {
            attributes.push({label: 'Not added to totals', value: ''});
        }

        return attributes;
    }
}
