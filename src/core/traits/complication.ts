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
import {RollType} from 'core/dice';
import {hasOwn, type Attribute, type RollDescriptor} from './characterTrait';
import {TraitDecorator} from './traitDecorator';

/** Disadvantage/complication decorator, ported from legacy `decorators/Complication.js`. */
export default class Complication extends TraitDecorator {
    label(): string {
        let label = this.characterTrait.label();
        const trait = this.characterTrait.trait;

        if (hasOwn(trait, 'input')) {
            switch (trait.xmlid.toUpperCase()) {
                case 'ACCIDENTALCHANGE':
                    label = 'AC';
                    break;
                case 'DEPENDENCE':
                    label = 'Dependence';
                    break;
                case 'DEPENDENTNPC':
                    label = 'DNPC';
                    break;
                case 'DISTINCTIVEFEATURES':
                    label = 'DF';
                    break;
                case 'ENRAGED':
                    label = 'Enraged';
                    break;
                case 'HUNTED':
                    label = 'Hunted';
                    break;
                case 'PHYSICALLIMITATION':
                    label = 'Physical';
                    break;
                case 'PSYCHOLOGICALLIMITATION':
                    label = 'Psychological';
                    break;
                case 'REPUTATION':
                    label = 'Reputation';
                    break;
                case 'SOCIALLIMITATION':
                    label = 'Social';
                    break;
                case 'SUSCEPTIBILITY':
                    label = 'Susceptibility';
                    break;
                case 'VULNERABILITY':
                    label = 'Vulnerability';
                    break;
                default:
                    label = 'Custom';
            }

            label += `: ${trait.input}`;
        } else if (trait.xmlid.toUpperCase() === 'RIVALRY') {
            const adderMap = toMap(trait.adder);

            label = `Rivalry: ${(adderMap.get('DESCRIPTION') as {optionAlias: string}).optionAlias.slice(1)}`;
        }

        return label;
    }

    attributes(): Attribute[] {
        const attributes = this.characterTrait.attributes();
        const trait = this.characterTrait.trait;

        if (trait.xmlid.toUpperCase() === 'GENERICDISADVANTAGE') {
            attributes.unshift({label: 'Custom Complication', value: ''});
        } else {
            let label = trait.template.display;

            if (trait.xmlid.toUpperCase() === 'UNLUCK') {
                label = label.replace('[LVL]', trait.levels);
            }

            attributes.unshift({label, value: ''});
        }

        return attributes;
    }

    roll(): RollDescriptor | null {
        if (this.characterTrait.trait.xmlid.toUpperCase() === 'UNLUCK') {
            return {
                roll: `${this.characterTrait.trait.levels}d6`,
                type: RollType.Effect,
            };
        }

        return this.characterTrait.roll();
    }
}
