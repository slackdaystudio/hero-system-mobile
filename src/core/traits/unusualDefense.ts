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

import {heroDesignerCharacter} from 'core/hero';
import {roundInPlayersFavor} from 'core/util';
import {type Attribute} from './characterTrait';
import {TraitDecorator} from './traitDecorator';

/**
 * Flash/Mental/Power Defense, ported from legacy `UnusualDefense.js`. 5E Mental
 * Defense adds EGO/5 on top of the points bought, which 6E dropped.
 */
export default class UnusualDefense extends TraitDecorator {
    attributes(): Attribute[] {
        const attributes = this.characterTrait.attributes();
        const character = this.characterTrait.getCharacter();
        let points = this.characterTrait.trait.levels;

        if (this.characterTrait.trait.xmlid === 'MENTALDEFENSE' && heroDesignerCharacter.isFifth(character)) {
            points += roundInPlayersFavor(heroDesignerCharacter.getCharacteristicTotal('EGO', character) / 5);
        }

        attributes.push({label: 'Points', value: points});

        return attributes;
    }
}
