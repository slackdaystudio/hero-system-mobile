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

import {CharacterTrait, type Obj, type RollDescriptor} from './characterTrait';
import {TraitDecorator} from './traitDecorator';

/**
 * Damage/effect dice-string builder shared by all attack powers, ported from
 * legacy `decorators/EffectRoll.js`. The roll type (normal/killing/effect) is
 * chosen by the power sub-factory.
 */
export default class EffectRoll extends TraitDecorator {
    private rollType: number;

    constructor(characterTrait: CharacterTrait, rollType: number) {
        super(characterTrait);

        this.rollType = rollType;
    }

    roll(): RollDescriptor {
        const baseDice = this.characterTrait.trait.levels;
        const partialDie = this.getPartialDie(this.characterTrait.trait.adder);
        let roll = `${baseDice}d6`;

        if (partialDie === '½') {
            roll = `${baseDice}${partialDie}d6`;
        } else if (partialDie === '1') {
            roll = `${baseDice}d6+${partialDie}`;
        } else if (partialDie === '-1') {
            roll = `${baseDice + 1}d6${partialDie}`;
        }

        return {
            roll,
            type: this.rollType,
        };
    }

    private getPartialDie(adder: Obj | Obj[] | undefined | null): string | null {
        let partialDie: string | null = null;

        if (adder === undefined || adder === null) {
            return partialDie;
        }

        if (Array.isArray(adder)) {
            for (const a of adder) {
                partialDie = this.getPartialDie(a);

                if (partialDie !== null) {
                    break;
                }
            }
        } else {
            if (adder.xmlid === 'PLUSONEHALFDIE') {
                partialDie = '½';
            } else if (adder.xmlid.toUpperCase() === 'PLUSONEPIP') {
                partialDie = '1';
            } else if (adder.xmlid.toUpperCase() === 'MINUSONEPIP') {
                partialDie = '-1';
            }
        }

        return partialDie;
    }
}
