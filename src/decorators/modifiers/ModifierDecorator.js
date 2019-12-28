import { Alert } from 'react-native';
import Aoe from './Aoe';
import Dot from './Dot';
import Modifier from './Modifier';

const AOE = 'AOE';

const DAMAGEOVERTIME = 'DAMAGEOVERTIME';

class ModifierDecorator {
    decorate(modifier, trait) {
        let decorated = new Modifier(modifier, trait);

        switch (modifier.xmlid.toUpperCase()) {
            case AOE:
                decorated = new Aoe(decorated);
                break;
            case DAMAGEOVERTIME:
                decorated = new Dot(decorated);
                break;
            default:
                // do nothing
        }

        return decorated;
    }
}

export let modifierDecorator = new ModifierDecorator();