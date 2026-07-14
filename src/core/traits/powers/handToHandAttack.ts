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
import {heroDesignerCharacter} from 'core/hero';
import {type RollDescriptor} from '../characterTrait';
import {TraitDecorator} from '../traitDecorator';

/** Hand-to-Hand Attack, ported from legacy `powers/HandToHandAttack.js`. */
export default class HandToHandAttack extends TraitDecorator {
    roll(): RollDescriptor {
        const character = this.characterTrait.getCharacter();
        const adderMap = toMap(this.characterTrait.trait.adder);
        let dice = this.characterTrait.trait.levels;
        const roll: RollDescriptor = {roll: '', type: RollType.NormalDamage};
        let partialDie = false;

        dice += heroDesignerCharacter.getCharacteristicTotal('STR', character) / 5;

        if (parseFloat((dice % 1).toFixed(1)) !== 0.0) {
            partialDie = parseFloat((dice % 1).toFixed(1)) >= 0.6;
            dice = Math.trunc(dice);
        }

        if (adderMap.has('PLUSONEPIP')) {
            roll.roll = partialDie ? `${dice + 1}d6` : `${dice}d6+1`;
        } else if (adderMap.has('PLUSONEHALFDIE')) {
            roll.roll = partialDie ? `${dice + 1}d6` : `${dice}½d6`;
        } else {
            roll.roll = `${dice}d6`;
        }

        return roll;
    }
}
