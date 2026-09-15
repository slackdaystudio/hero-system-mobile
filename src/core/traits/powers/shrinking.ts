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

import {toCm, toKg} from 'core/util';
import {type Attribute} from '../characterTrait';
import {TraitDecorator} from '../traitDecorator';

/** Below this, a height/mass is printed in exponential notation rather than rounded. */
const CUT_OFF_POINT = 0.0009;

/**
 * Shrinking, ported from legacy `powers/Shrinking.js`. Every figure comes off the
 * template's per-level increases applied to the character's own height and weight.
 */
export default class Shrinking extends TraitDecorator {
    attributes(): Attribute[] {
        const attributes = this.characterTrait.attributes();
        const trait = this.characterTrait.trait;
        const template = trait.template;
        const info = this.characterTrait.getCharacter().characterInfo;

        const height = this.alteredHeight(toCm(info.height), template.heightincrease, trait.levels, template.heightincreaselevels);
        const mass = this.alteredMass(toKg(info.weight), template.massmultiplier, trait.levels, template.massmultiplierlevels);

        attributes.push({label: 'Height', value: `${height} m`});
        attributes.push({label: 'Weight', value: `${mass} kg`});
        attributes.push({label: 'Perception Rolls', value: (trait.levels / template.perincreaselevels) * template.perincrease});
        attributes.push({label: 'DCV', value: `+${template.dcvincrease * (trait.levels / template.dcvincreaselevels)}`});
        attributes.push({label: 'Knockback', value: `+${template.kbincrease * (trait.levels / template.kbincreaselevels)}m`});

        return attributes;
    }

    private alteredMass(kg: number, massMultiplier: number, levels: number, massMultiplierLevels: number): number | string {
        const weight = (kg * 1000 * massMultiplier ** (levels / massMultiplierLevels)) / 1000;

        return weight > CUT_OFF_POINT ? Math.round(weight * 10000) / 10000 : weight.toExponential(3);
    }

    private alteredHeight(cm: number, heightMultiplier: number, levels: number, heightMultiplierLevels: number): number | string {
        const height = cm * heightMultiplier ** (levels / heightMultiplierLevels);

        return height > CUT_OFF_POINT ? Math.round(height * 100) / 10000 : height.toExponential(3);
    }
}
