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

import {toMap} from 'core/util';
import {type Attribute, type Obj} from '../characterTrait';
import {TraitDecorator} from '../traitDecorator';

/**
 * Entangle, ported from legacy `powers/Entangle.js`.
 *
 * Legacy also defines a `roll()` here, but the factory wraps this decorator in an
 * `EffectRoll` immediately afterwards in both engines, so that override is dead
 * code and is not ported (it returned a bare string, not a `RollDescriptor`).
 */
export default class Entangle extends TraitDecorator {
    attributes(): Attribute[] {
        const attributes = this.characterTrait.attributes();

        attributes.push({label: 'PD/ED', value: this.getDefenses()});

        return attributes;
    }

    private getDefenses(): string {
        const trait = this.characterTrait.trait;
        const adderMap = toMap(trait.adder);
        const modifierMap = toMap(trait.modifier);
        let pd = trait.levels;
        let ed = trait.levels;

        if (modifierMap.has('NODEFENSE')) {
            return '0/0';
        }

        if (adderMap.has('ADDITIONALPD')) {
            pd += (adderMap.get('ADDITIONALPD') as Obj).levels;
        }

        if (adderMap.has('ADDITIONALED')) {
            ed += (adderMap.get('ADDITIONALED') as Obj).levels;
        }

        return `${pd}/${ed}`;
    }
}
