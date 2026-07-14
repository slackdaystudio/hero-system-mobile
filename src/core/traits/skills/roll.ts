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
import {hasOwn, type RollDescriptor} from '../characterTrait';
import {TraitDecorator} from '../traitDecorator';

const SKILL_FAMILIARITY_BASE = 8;
const SKILL_PROFICIENCY_BASE = 10;
const SKILL_GENERAL_CHARACTERISTIC = 11;

/** Skill-roll number computation, ported from legacy `decorators/skills/Roll.js`. */
export default class Roll extends TraitDecorator {
    roll(): RollDescriptor {
        let roll: number | string | null = null;
        const trait = this.characterTrait.trait;

        if (trait.xmlid.toUpperCase() === 'CUSTOMSKILL') {
            if (trait.roll > 0) {
                roll = trait.roll;
            }
        } else if (trait.proficiency) {
            roll = SKILL_PROFICIENCY_BASE;
        } else if (trait.familiarity || trait.everyman) {
            roll = SKILL_FAMILIARITY_BASE;
        } else if (hasOwn(trait, 'characteristic') && trait.characteristic === 'GENERAL') {
            if (trait.xmlid.toUpperCase() !== 'COMBAT_LEVELS') {
                roll = SKILL_GENERAL_CHARACTERISTIC;
            }
        } else if (hasOwn(trait, 'characteristic')) {
            const characteristic = this.characterTrait
                .getCharacter()
                .characteristics.filter((c: {shortName: string}) => c.shortName.toLowerCase() === trait.characteristic.toLowerCase())
                .shift();

            roll = parseInt(heroDesignerCharacter.getRollTotal(characteristic, this.characterTrait.getCharacter())!.slice(0, -1), 10);
        }

        if (roll !== null) {
            roll = `${(roll as number) + trait.levels}-`;
        }

        return {
            roll: roll as unknown as string,
            type: RollType.SkillCheck,
        };
    }
}
