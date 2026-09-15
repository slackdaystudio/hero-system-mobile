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
 * Stretching, ported from legacy `powers/Stretching.js`.
 *
 * Legacy labels both distances in metres unconditionally, where `Movement` picks
 * `"` for 5E and `m` for 6E. That looks like a legacy bug for 5E characters, but it
 * is preserved here — a port is not the place to change behaviour (see
 * docs/KNOWN_DEVIATIONS.md for how a correction gets made).
 */
export default class Stretching extends TraitDecorator {
    attributes(): Attribute[] {
        const attributes = this.characterTrait.attributes();
        const levels = this.characterTrait.trait.levels;

        attributes.push({label: 'Distance', value: `${levels}m`});
        attributes.push({label: 'Non-Combat Distance', value: `${levels * this.getNonCombatDistance()}m`});

        return attributes;
    }

    private getNonCombatDistance(): number {
        let nonCombatDistance = 2;
        const adderMap = toMap(this.characterTrait.trait.adder);

        if (adderMap.has('NONCOMBAT')) {
            nonCombatDistance **= (adderMap.get('NONCOMBAT') as Obj).levels + 1;
        }

        return nonCombatDistance;
    }
}
