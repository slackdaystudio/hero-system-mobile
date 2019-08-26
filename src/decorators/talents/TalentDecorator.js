import CombatSense from './CombatSense';
import LightningReflexes from './LightningReflexes';
import StrikingAppearance from './StrikingAppearance';
import TwelveOrLessRoll from '../TwelveOrLessRoll';

const COMBAT_SENSE = 'COMBAT_SENSE';

const DANGER_SENSE = 'DANGER_SENSE';

const LIGHTNING_REFLEXES_ALL = 'LIGHTNING_REFLEXES_ALL';

const STRIKING_APPEARANCE = 'STRIKING_APPEARANCE';

const UNIVERSAL_TRANSLATOR = 'UNIVERSAL_TRANSLATOR';

class TalentDecorator {
    decorate(decorated) {
        switch (decorated.trait.xmlid.toUpperCase()) {
            case COMBAT_SENSE:
                decorated = new CombatSense(decorated);
                decorated = new TwelveOrLessRoll(decorated);
                break;
            case DANGER_SENSE:
            case UNIVERSAL_TRANSLATOR:
                decorated = new TwelveOrLessRoll(decorated);
                break;
            case LIGHTNING_REFLEXES_ALL:
                decorated = new LightningReflexes(decorated);
                break;
            case STRIKING_APPEARANCE:
                decorated = new StrikingAppearance(decorated);
                break;
            default:
                // do nothing
        }

        return decorated;
    }
}

export let talentDecorator = new TalentDecorator();