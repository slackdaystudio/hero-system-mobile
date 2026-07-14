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

import {hasOwn} from '../characterTrait';
import {TraitDecorator} from '../traitDecorator';

/** Rapid Attack cost, ported from legacy `skills/RapidAttack.js`. */
export default class RapidAttack extends TraitDecorator {
    cost(): number {
        let cost = 10;
        const trait = this.characterTrait.trait;

        if (hasOwn(trait, 'modifier')) {
            if (Array.isArray(trait.modifier)) {
                for (const modifier of trait.modifier) {
                    if (modifier.xmlid.toUpperCase() === 'HTHONLY' || modifier.xmlid.toUpperCase() === 'RANGEDONLY') {
                        cost--;
                        break;
                    }
                }
            } else {
                if (trait.modifier.xmlid.toUpperCase() === 'HTHONLY' || trait.modifier.xmlid.toUpperCase() === 'RANGEDONLY') {
                    cost--;
                }
            }
        }

        return cost;
    }
}
