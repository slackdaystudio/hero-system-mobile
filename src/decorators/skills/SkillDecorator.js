import AutofireSkills from './AutofireSkills';
import DefensiveManeuver from './DefensiveManeuver';
import RapidAttack from './RapidAttack';
import TransportFamiliarity from './TransportFamiliarity';
import TwoWeaponFighting from './TwoWeaponFighting';
import WeaponFamiliarity from './WeaponFamiliarity';
import Roll from './Roll';
import Skill from '../Skill';
import SkillLevels from '../SkillLevels';
import SkillWithAdders from '../SkillWithAdders';
import SkillWithSubAdders from '../SkillWithSubAdders';

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

const ANIMAL_HANDLER = 'ANIMAL_HANDLER';

const AUTOFIRE_SKILLS = 'AUTOFIRE_SKILLS';

const COMBAT_LEVELS = 'COMBAT_LEVELS';

const DEFENSE_MANEUVER = 'DEFENSE_MANEUVER';

const FORGERY = 'FORGERY';

const GAMBLING = 'GAMBLING';

const MENTAL_COMBAT_LEVELS = 'MENTAL_COMBAT_LEVELS';

const NAVIGATION = 'NAVIGATION';

const PENALTY_SKILL_LEVELS = 'PENALTY_SKILL_LEVELS';

const RAPID_ATTACK_HTH = 'RAPID_ATTACK_HTH';

const SKILL_LEVELS = 'SKILL_LEVELS';

const SURVIVAL = 'SURVIVAL';

const TRANSPORT_FAMILIARITY = 'TRANSPORT_FAMILIARITY';

const TWO_WEAPON_FIGHTING_HTH = 'TWO_WEAPON_FIGHTING_HTH';

const WEAPON_FAMILIARITY = 'WEAPON_FAMILIARITY';

const WEAPONSMITH = 'WEAPONSMITH';

const ROLL_BLACKLIST = [
    AUTOFIRE_SKILLS,
    WEAPON_FAMILIARITY,
    COMBAT_LEVELS,
    DEFENSE_MANEUVER,
    MENTAL_COMBAT_LEVELS,
    PENALTY_SKILL_LEVELS,
    RAPID_ATTACK_HTH,
    SKILL_LEVELS,
    TRANSPORT_FAMILIARITY,
    TWO_WEAPON_FIGHTING_HTH,
];

class SkillDecorator {
    decorate(decorated) {
        switch (decorated.trait.xmlid.toUpperCase()) {
        case ANIMAL_HANDLER:
        case NAVIGATION:
        case WEAPONSMITH:
            decorated = new SkillWithAdders(decorated);
            break;
        case AUTOFIRE_SKILLS:
            decorated = new AutofireSkills(decorated);
            break;
        case COMBAT_LEVELS:
        case MENTAL_COMBAT_LEVELS:
        case PENALTY_SKILL_LEVELS:
        case SKILL_LEVELS:
            decorated = new SkillLevels(decorated);
            break;
        case DEFENSE_MANEUVER:
            decorated = new DefensiveManeuver(decorated);
            break;
        case FORGERY:
        case GAMBLING:
        case SURVIVAL:
            decorated = new SkillWithSubAdders(decorated);
            break;
        case RAPID_ATTACK_HTH:
            decorated = new RapidAttack(decorated);
            break;
        case TRANSPORT_FAMILIARITY:
            decorated = new TransportFamiliarity(decorated);
            break;
        case TWO_WEAPON_FIGHTING_HTH:
            decorated = new TwoWeaponFighting(decorated);
            break;
        case WEAPON_FAMILIARITY:
            decorated = new WeaponFamiliarity(decorated);
            break;
        default:
                // do nothing
        }

        if (!ROLL_BLACKLIST.includes(decorated.trait.xmlid.toUpperCase())) {
            decorated = new Roll(decorated);
        }

        return decorated;
    }
}

export let skillDecorator = new SkillDecorator();
