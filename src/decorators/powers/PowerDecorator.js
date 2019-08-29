import Absorption from './Absorption';
import Barrier from './Barrier';
import Clinging from './Clinging';
import DamageNegation from './DamageNegation';
import DensityIncrease from './DensityIncrease';
import Duplication from './Duplication';
import ExtraAttributes from '../ExtraAttributes';
import EffectRoll from '../EffectRoll';

const ABSORPTION = 'ABSORPTION';

const AID = 'AID';

const BARRIER = 'FORCEWALL';

const BLAST = 'ENERGYBLAST';

const CLINGING = 'CLINGING';

const DAMAGENEGATION = 'DAMAGENEGATION';

const DENSITYINCREASE = 'DENSITYINCREASE';

const DISPEL = 'DISPEL';

const DRAIN = 'DRAIN';

const DUPLICATION = 'DUPLICATION';

class PowerDecorator {
    decorate(decorated) {
        switch (decorated.trait.xmlid.toUpperCase()) {
            case ABSORPTION:
                decorated = new Absorption(decorated);
                break;
            case AID:
            case BLAST:
            case DISPEL:
            case DRAIN:
                decorated = new EffectRoll(decorated);
                break;
            case BARRIER:
                decorated = new Barrier(decorated);
                break;
            case CLINGING:
                decorated = new Clinging(decorated);
                break;
            case DAMAGENEGATION:
                decorated = new DamageNegation(decorated);
                break;
            case DENSITYINCREASE:
                decorated = new DensityIncrease(decorated);
                break;
            case DUPLICATION:
                decorated = new Duplication(decorated);
                break;
            default:
                // do nothing
        }

        return decorated;
    }
}

export let powerDecorator = new PowerDecorator();