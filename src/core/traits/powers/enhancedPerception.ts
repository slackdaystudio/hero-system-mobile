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
import {heroDesignerCharacter} from 'core/hero';
import {type RollDescriptor} from '../characterTrait';
import {TraitDecorator} from '../traitDecorator';

/** Enhanced Perception, ported from legacy `powers/EnhancedPerception.js`. */
export default class EnhancedPerception extends TraitDecorator {
    roll(): RollDescriptor {
        const characteristics = this.characterTrait.getCharacter().characteristics;
        let base = 0;

        for (const characteristic of characteristics) {
            if (characteristic.shortName === 'INT') {
                const totalRoll = heroDesignerCharacter.getRollTotal(characteristic, this.characterTrait.getCharacter())!;

                base += parseInt(totalRoll.substring(0, totalRoll.length - 1), 10);

                break;
            }
        }

        return {
            roll: `${base + this.characterTrait.trait.levels}-`,
            type: RollType.SkillCheck,
        };
    }
}
