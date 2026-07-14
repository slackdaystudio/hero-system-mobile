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
import {hasOwn, type RollDescriptor} from './characterTrait';
import {TraitDecorator} from './traitDecorator';

/**
 * Generic skill-roll producer for perks/talents that carry a stored `roll`,
 * ported from legacy `decorators/TraitWithSkillRoll.js`.
 */
export default class TraitWithSkillRoll extends TraitDecorator {
    roll(): RollDescriptor {
        let roll = null;

        if (hasOwn(this.characterTrait.trait, 'roll') && this.characterTrait.trait.roll > 0) {
            roll = `${this.characterTrait.trait.roll}-`;
        }

        return {
            roll: roll as unknown as string,
            type: RollType.SkillCheck,
        };
    }
}
