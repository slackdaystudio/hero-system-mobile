import AnimalHandler from './AnimalHandler';
import AutofireSkills from './AutofireSkills';
import CombatLevels from './CombatLevels';
import DefensiveManeuver from './DefensiveManeuver';
import WeaponFamiliarity from './WeaponFamiliarity';
import Roll from './Roll';
import Skill from '../Skill';

const ANIMAL_HANDLER = 'ANIMAL_HANDLER';

const AUTOFIRE_SKILLS = 'AUTOFIRE_SKILLS';

const COMBAT_LEVELS = 'COMBAT_LEVELS';

const DEFENSE_MANEUVER = 'DEFENSE_MANEUVER';

const FORGERY = 'FORGERY';

const WEAPON_FAMILIARITY = 'WEAPON_FAMILIARITY';

const ROLL_BLACKLIST = [
    AUTOFIRE_SKILLS,
    WEAPON_FAMILIARITY,
    COMBAT_LEVELS,
    DEFENSE_MANEUVER
]

class SkillDecorator {
    decorate(decorated) {
        switch (decorated.trait.xmlid.toUpperCase()) {
            case ANIMAL_HANDLER:
                decorated = new AnimalHandler(decorated);
                break;
            case AUTOFIRE_SKILLS:
                decorated = new AutofireSkills(decorated);
                break;
            case COMBAT_LEVELS:
                decorated = new CombatLevels(decorated);
                break;
            case DEFENSE_MANEUVER:
                decorated = new DefensiveManeuver(decorated);
                break;
            case FORGERY:
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