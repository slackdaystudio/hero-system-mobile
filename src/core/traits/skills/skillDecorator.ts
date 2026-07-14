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

import {type CharacterTrait} from '../characterTrait';
import SkillLevels from '../skillLevels';
import SkillLevelsOnly from '../skillLevelsOnly';
import SkillWithAdders from '../skillWithAdders';
import SkillWithSubAdders from '../skillWithSubAdders';
import AutofireSkills from './autofireSkills';
import DefensiveManeuver from './defensiveManeuver';
import RapidAttack from './rapidAttack';
import Roll from './roll';
import TransportFamiliarity from './transportFamiliarity';
import TwoWeaponFighting from './twoWeaponFighting';
import WeaponFamiliarity from './weaponFamiliarity';

// Skills whose roll is not a straight skill check; excluded from the Roll wrap.
const ROLL_BLACKLIST = [
    'AUTOFIRE_SKILLS',
    'WEAPON_FAMILIARITY',
    'COMBAT_LEVELS',
    'CRAMMING',
    'DEFENSE_MANEUVER',
    'MENTAL_COMBAT_LEVELS',
    'PENALTY_SKILL_LEVELS',
    'RAPID_ATTACK_HTH',
    'SKILL_LEVELS',
    'TRANSPORT_FAMILIARITY',
    'TWO_WEAPON_FIGHTING_HTH',
];

/** Skill sub-factory, ported from legacy `decorators/skills/SkillDecorator.js`. */
class SkillDecorator {
    decorate(decorated: CharacterTrait): CharacterTrait {
        switch (decorated.trait.xmlid.toUpperCase()) {
            case 'ANIMAL_HANDLER':
            case 'NAVIGATION':
            case 'WEAPONSMITH':
                decorated = new SkillWithAdders(decorated);
                break;
            case 'AUTOFIRE_SKILLS':
                decorated = new AutofireSkills(decorated);
                break;
            case 'COMBAT_LEVELS':
            case 'MENTAL_COMBAT_LEVELS':
            case 'PENALTY_SKILL_LEVELS':
            case 'SKILL_LEVELS':
                decorated = new SkillLevels(decorated);
                break;
            case 'DEFENSE_MANEUVER':
                decorated = new DefensiveManeuver(decorated);
                break;
            case 'FORGERY':
            case 'GAMBLING':
            case 'SURVIVAL':
                decorated = new SkillWithSubAdders(decorated);
                break;
            case 'RAPID_ATTACK_HTH':
                decorated = new RapidAttack(decorated);
                break;
            case 'TRANSPORT_FAMILIARITY':
                decorated = new TransportFamiliarity(decorated);
                break;
            case 'TWO_WEAPON_FIGHTING_HTH':
                decorated = new TwoWeaponFighting(decorated);
                break;
            case 'WEAPON_FAMILIARITY':
                decorated = new WeaponFamiliarity(decorated);
                break;
            default:
            // do nothing
        }

        // Legacy reads decorated.characterTrait.trait.levelsonly; every decorator in
        // the chain shares the same trait object, so decorated.trait is equivalent.
        if (decorated.trait.levelsonly) {
            decorated = new SkillLevelsOnly(decorated);
        } else if (!ROLL_BLACKLIST.includes(decorated.trait.xmlid.toUpperCase())) {
            decorated = new Roll(decorated);
        }

        return decorated;
    }
}

export const skillDecorator = new SkillDecorator();
