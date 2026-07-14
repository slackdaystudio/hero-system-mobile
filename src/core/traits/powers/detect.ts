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
import {type RollDescriptor} from '../characterTrait';
import {TraitDecorator} from '../traitDecorator';

/** Detect sense, ported from legacy `powers/Detect.js`. */
export default class Detect extends TraitDecorator {
    roll(): RollDescriptor {
        let base = 11;

        // Faithful to legacy: the `!== null || !== undefined` guard is always true.
        if (this.characterTrait.trait.modifier !== null || this.characterTrait.trait.modifier !== undefined) {
            const modifierMap = toMap(this.characterTrait.trait.modifier);

            if (modifierMap.has('FOCUS')) {
                base = 9;
            }
        }

        return {
            roll: `${base + this.characterTrait.trait.levels}-`,
            type: RollType.SkillCheck,
        };
    }
}
