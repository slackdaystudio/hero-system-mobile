import CharacterTrait from './CharacterTrait';
import { common } from '../lib/Common';
import { EFFECT } from '../lib/DieRoller';

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

export default class Complication extends CharacterTrait {
    constructor(characterTrait) {
        super(characterTrait.trait, characterTrait.listKey, characterTrait.getCharacter);

        this.characterTrait = characterTrait;
    }

    cost() {
        return this.characterTrait.cost();
    }

    costMultiplier() {
        return this.characterTrait.costMultiplier();
    }

    activeCost() {
        return this.characterTrait.activeCost();
    }

    realCost() {
        return this.characterTrait.realCost();
    }

    label() {
        let label = this.characterTrait.label();

        if (this.characterTrait.trait.hasOwnProperty('input')) {
            switch (this.characterTrait.trait.xmlid.toUpperCase()) {
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

            label += `: ${this.characterTrait.trait.input}`;
        } else if (this.characterTrait.trait.xmlid.toUpperCase() === 'RIVALRY') {
            let adderMap = common.toMap(this.characterTrait.trait.adder);

            label = `Rivalry: ${adderMap.get('DESCRIPTION').optionAlias.slice(1)}`;
        }

        return label;
    }

    attributes() {
        let attributes = this.characterTrait.attributes();

        if (this.characterTrait.trait.xmlid.toUpperCase() === 'GENERICDISADVANTAGE') {
            attributes.unshift({
                label: 'Custom Complication',
                value: '',
            });
        } else {
            let label = this.characterTrait.trait.template.display;

            if (this.characterTrait.trait.xmlid.toUpperCase() === 'UNLUCK') {
                label = label.replace('[LVL]', this.characterTrait.trait.levels);
            }

            attributes.unshift({
                label: label,
                value: '',
            });
        }

        return attributes;
    }

    definition() {
        return this.characterTrait.definition();
    }

    roll() {
        if (this.characterTrait.trait.xmlid.toUpperCase() === 'UNLUCK') {
            return {
                roll: `${this.characterTrait.trait.levels}d6`,
                type: EFFECT,
            };
        }

        return this.characterTrait.roll();
    }

    advantages() {
        return this.characterTrait.advantages();
    }

    limitations() {
        return this.characterTrait.limitations();
    }
}
