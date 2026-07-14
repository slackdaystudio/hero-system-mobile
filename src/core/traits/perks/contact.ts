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

import {RollType} from 'core/dice';
import {type Obj, type RollDescriptor} from '../characterTrait';
import {TraitDecorator} from '../traitDecorator';

/** Contact perk, ported from legacy `decorators/perks/Contact.js`. */
export default class Contact extends TraitDecorator {
    cost(): number {
        return this.characterTrait.cost() * this.costMultiplier();
    }

    costMultiplier(): number {
        return this.getModifierMultiplier(this.characterTrait.trait.modifier);
    }

    roll(): RollDescriptor {
        const baseRoll = this.characterTrait.trait.levels > 1 ? 11 : 8;
        let levels = 0;

        if (this.characterTrait.trait.levels > 2) {
            levels = this.characterTrait.trait.levels - 2;
        }

        return {
            roll: `${baseRoll + levels}-`,
            type: RollType.SkillCheck,
        };
    }

    // Faithful to legacy: the array branch recurses but discards the result, so
    // only a single ORGANIZATION modifier ever adjusts the multiplier.
    private getModifierMultiplier(modifier: Obj | Obj[] | undefined | null): number {
        let multiplier = this.characterTrait.costMultiplier();

        if (modifier === undefined || modifier === null) {
            return multiplier;
        }

        if (Array.isArray(modifier)) {
            for (const m of modifier) {
                this.getModifierMultiplier(m);
            }
        } else {
            if (modifier.xmlid.toUpperCase() === 'ORGANIZATION') {
                multiplier += modifier.basecost;
            }
        }

        return multiplier;
    }
}
