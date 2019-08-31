import Absorption from './Absorption';
import Barrier from './Barrier';
import Clinging from './Clinging';
import DamageNegation from './DamageNegation';
import DensityIncrease from './DensityIncrease';
import Duplication from './Duplication';
import EnduranceReserve from './EnduranceReserve';
import Entangle from './Entangle';
import ExtraLimbs from './ExtraLimbs';
import FlashDefense from './FlashDefense';
import Ftl from './Ftl';
import HandKillingAttack from './HandKillingAttack';
import HandToHandAttack from './HandToHandAttack';
import KnockbackResistance from './KnockbackResistance';
import Leaping from './Leaping';
import ExtraAttributes from '../ExtraAttributes';
import EffectRoll from '../EffectRoll';
import Movement from '../Movement';

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

const ENDURANCERESERVE = 'ENDURANCERESERVE';

const ENTANGLE = 'ENTANGLE';

const EXTRALIMBS = 'EXTRALIMBS';

const FLASH = 'FLASH';

const FLASHDEFENSE = 'FLASHDEFENSE';

const FLIGHT = 'FLIGHT';

const FTL = 'FTL';

const HKA = 'HKA';

const HANDTOHANDATTACK = 'HANDTOHANDATTACK';

const HEALING = 'HEALING';

const KBRESISTANCE = 'KBRESISTANCE';

const LEAPING = 'LEAPING';

const LUCK = 'LUCK';

const RKA = 'RKA';

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
            case FLASH:
            case HEALING:
            case LUCK:
            case RKA:
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
            case ENDURANCERESERVE:
                decorated = new EnduranceReserve(decorated);
                break;
            case ENTANGLE:
                decorated = new Entangle(decorated);
                break;
            case EXTRALIMBS:
                decorated = new ExtraLimbs(decorated);
                break;
            case FTL:
                decorated = new Ftl(decorated);
                break;
            case FLASHDEFENSE:
                decorated = new FlashDefense(decorated);
                break;
            case FLIGHT:
                decorated = new Movement(decorated);
                break;
            case HKA:
                decorated = new HandKillingAttack(decorated);
                break;
            case HANDTOHANDATTACK:
                decorated = new HandToHandAttack(decorated);
                break;
            case KBRESISTANCE:
                decorated = new KnockbackResistance(decorated);
                break;
            case LEAPING:
                decorated = new Leaping(decorated);
                decorated = new Movement(decorated);
                break;
            default:
                // do nothing
        }

        return decorated;
    }
}

export let powerDecorator = new PowerDecorator();