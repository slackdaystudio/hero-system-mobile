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

import {hasOwn, type RollDescriptor} from './characterTrait';
import {TraitDecorator} from './traitDecorator';

/**
 * Base of all skills, ported from legacy `decorators/Skill.js`: cost by
 * characteristic / familiarity / proficiency / language / custom, plus the
 * skill-specific label.
 */
export default class Skill extends TraitDecorator {
    cost(): number {
        let cost = this.characterTrait.cost();
        const trait = this.characterTrait.trait;

        if (trait.type === 'list') {
            return cost;
        }

        if (trait.xmlid.toUpperCase() === 'CRAMMING') {
            cost = trait.basecost;
        } else if (trait.xmlid.toUpperCase() === 'CUSTOMSKILL') {
            cost = trait.basecost + trait.levels * trait.template.lvlcost;
        } else if (trait.proficiency) {
            cost = 2;
        } else if (trait.familiarity || trait.everyman || trait.nativeTongue) {
            cost = trait.familiarity ? 1 : 0;
        } else if (trait.xmlid.toUpperCase() === 'LANGUAGES') {
            for (const option of trait.template.option) {
                if (option.xmlid.toUpperCase() === trait.optionid.toUpperCase()) {
                    cost = option.basecost;
                    break;
                }
            }
        } else if (hasOwn(trait, 'characteristic')) {
            cost = this.getCostByCharacteristic();
        }

        return cost;
    }

    activeCost(): number {
        return this.cost();
    }

    realCost(): number {
        return this.cost();
    }

    label(): string {
        const name = this.trait.name === null || this.trait.name === '' ? '' : this.trait.name;
        const label = this.trait.name === null || this.trait.name === '' ? this.trait.alias : ` (${this.trait.alias})`;
        const input = this.trait.input === null || this.trait.input === undefined ? '' : `: ${this.trait.input}`;

        return `${name}${label}${input}`;
    }

    roll(): RollDescriptor | null {
        return this.characterTrait.trait.roll;
    }

    private getCostByCharacteristic(): number {
        let basecost = 0;
        let skillLevelCost = 0;
        const trait = this.characterTrait.trait;

        if (Array.isArray(trait.template.characteristicChoice.item)) {
            for (const item of trait.template.characteristicChoice.item) {
                if (item.characteristic.toLowerCase() === trait.characteristic.toLowerCase()) {
                    basecost = item.basecost;
                    skillLevelCost = item.lvlcost;
                }
            }
        } else {
            basecost = trait.template.characteristicChoice.item.basecost;
            skillLevelCost = trait.template.characteristicChoice.item.lvlcost;
        }

        return basecost + trait.levels * skillLevelCost;
    }
}
