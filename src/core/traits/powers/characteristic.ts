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

import {roundInPlayersFavor, totalAdders} from 'core/util';
import {heroDesignerCharacter} from 'core/hero';
import {TraitDecorator} from '../traitDecorator';

/** A characteristic bought as a power (e.g. bonus STR), ported from legacy `powers/Characteristic.js`. */
export default class Characteristic extends TraitDecorator {
    cost(): number {
        const trait = this.characterTrait.trait;

        if (trait.levels === 0) {
            const value = heroDesignerCharacter.getCharacteristicTotal(trait.xmlid, this.characterTrait.getCharacter());

            return roundInPlayersFavor((value / trait.template.lvlval) * trait.template.lvlcost);
        }

        let cost = (trait.levels / trait.template.lvlval) * trait.template.lvlcost;

        cost += totalAdders(trait.adder);

        return Math.ceil(cost);
    }

    label(): string {
        return `${heroDesignerCharacter.getCharacteristicFullName(this.characterTrait.trait.xmlid)}: +${this.characterTrait.trait.levels}`;
    }
}
