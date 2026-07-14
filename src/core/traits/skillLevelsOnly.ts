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

import {hasOwn, type Attribute} from './characterTrait';
import {TraitDecorator} from './traitDecorator';

/** Levels-only skill cost, ported from legacy `decorators/SkillLevelsOnly.js`. */
export default class SkillLevelsOnly extends TraitDecorator {
    cost(): number {
        let levelCost = 0;
        let levelValue = 0;
        const trait = this.characterTrait.trait;

        if (Array.isArray(trait.template.characteristicChoice.item)) {
            for (const item of trait.template.characteristicChoice.item) {
                if (item.characteristic.toUpperCase() === trait.characteristic.toUpperCase()) {
                    levelCost = item.lvlcost;
                    levelValue = item.lvlval;
                    break;
                }
            }
        } else {
            levelCost = trait.template.characteristicChoice.item.lvlcost;
            levelValue = trait.template.characteristicChoice.item.lvlval;
        }

        if (hasOwn(trait, 'adder')) {
            return (trait.levels / levelValue) * levelCost + (this.characterTrait.cost() - (trait.levels / levelValue) * levelCost);
        }

        return (trait.levels / levelValue) * levelCost;
    }

    label(): string {
        return `${this.characterTrait.label()} (+${this.characterTrait.trait.levels})`;
    }

    attributes(): Attribute[] {
        const attributes = this.characterTrait.attributes();

        attributes.push({label: 'Total Levels', value: this.characterTrait.trait.levels});

        return attributes;
    }
}
