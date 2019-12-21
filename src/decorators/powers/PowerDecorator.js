import Absorption from './Absorption';
import Barrier from './Barrier';
import Characteristic from './Characteristic';
import Clinging from './Clinging';
import DamageNegation from './DamageNegation';
import DensityIncrease from './DensityIncrease';
import Duplication from './Duplication';
import EnduranceReserve from './EnduranceReserve';
import Entangle from './Entangle';
import ExtraLimbs from './ExtraLimbs';
import Ftl from './Ftl';
import HandKillingAttack from './HandKillingAttack';
import HandToHandAttack from './HandToHandAttack';
import KnockbackResistance from './KnockbackResistance';
import Leaping from './Leaping';
import MultiForm from './MultiForm';
import Possession from './Possession';
import Reflection from './Reflection';
import Regeneration from './Regeneration';
import ResistantProtection from './ResistantProtection';
import Shrinking from './Shrinking';
import Stretching from './Stretching';
import Summon from './Summon';
import Telekinesis from './Telekinesis';
import AffectsTotals from '../AffectsTotals'
import ExtraAttributes from '../ExtraAttributes';
import EffectRoll from '../EffectRoll';
import Movement from '../Movement';
import UnusualDefense from '../UnusualDefense';
import Skill from '../Skill';
import { heroDesignerCharacter } from '../../lib/HeroDesignerCharacter';
import { talentDecorator } from '../talents/TalentDecorator';
import { perkDecorator } from '../perks/PerkDecorator';
import { NORMAL_DAMAGE, KILLING_DAMAGE, FREE_FORM } from '../../lib/DieRoller';

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

const EGOATTACK = 'EGOATTACK';

const ENDURANCERESERVE = 'ENDURANCERESERVE';

const ENTANGLE = 'ENTANGLE';

const EXTRALIMBS = 'EXTRALIMBS';

const FLASH = 'FLASH';

const FLASHDEFENSE = 'FLASHDEFENSE';

const FLIGHT = 'FLIGHT';

const FORCEFIELD = 'FORCEFIELD';

const FTL = 'FTL';

const HKA = 'HKA';

const HANDTOHANDATTACK = 'HANDTOHANDATTACK';

const HEALING = 'HEALING';

const KBRESISTANCE = 'KBRESISTANCE';

const LEAPING = 'LEAPING';

const LUCK = 'LUCK';

const MENTALDEFENSE = 'MENTALDEFENSE';

const MENTALILLUSIONS = 'MENTALILLUSIONS';

const MINDCONTROL = 'MINDCONTROL';

const MINDSCAN = 'MINDSCAN';

const MULTIFORM = 'MULTIFORM';

const POSSESSION = 'POSSESSION';

const POWERDEFENSE = 'POWERDEFENSE';

const REFLECTION = 'REFLECTION';

const REGENERATION = 'REGENERATION';

const RKA = 'RKA';

const RUNNING = 'RUNNING';

const SHRINKING = 'SHRINKING';

const STRETCHING = 'STRETCHING';

const SUMMON = 'SUMMON';

const SWIMMING = 'SWIMMING';

const SWINGING = 'SWINGING';

const TELEKINESIS = 'TELEKINESIS';

const TELEPATHY = 'TELEPATHY';

const TELEPORTATION = 'TELEPORTATION';

const TRANSFORM = 'TRANSFORM';

const TUNNELING = 'TUNNELING';

class PowerDecorator {
    decorate(decorated) {
        switch (decorated.trait.xmlid.toUpperCase()) {
            case ABSORPTION:
                decorated = new Absorption(decorated);
                break;
            case BLAST:
            case EGOATTACK:
                decorated = new EffectRoll(decorated, NORMAL_DAMAGE);
                break;
            case TRANSFORM:
            case RKA:
                decorated = new EffectRoll(decorated, KILLING_DAMAGE);
                break;
            case AID:
            case DISPEL:
            case DRAIN:
            case FLASH:
            case HEALING:
            case LUCK:
            case MENTALILLUSIONS:
            case MINDCONTROL:
            case MINDSCAN:
            case TELEPATHY:
                decorated = new EffectRoll(decorated, FREE_FORM);
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
                decorated = new AffectsTotals(decorated);
                break;
            case DUPLICATION:
                decorated = new Duplication(decorated);
                break;
            case ENDURANCERESERVE:
                decorated = new EnduranceReserve(decorated);
                break;
            case ENTANGLE:
                decorated = new Entangle(decorated);
                decorated = new EffectRoll(decorated, FREE_FORM);
                break;
            case EXTRALIMBS:
                decorated = new ExtraLimbs(decorated);
                break;
            case FTL:
                decorated = new Ftl(decorated);
                break;
            case FLASHDEFENSE:
            case MENTALDEFENSE:
            case POWERDEFENSE:
                decorated = new UnusualDefense(decorated);
                break;
            case FLIGHT:
            case SWINGING:
            case TELEPORTATION:
            case TUNNELING:
                decorated = new Movement(decorated);
                break;
            case FORCEFIELD:
                decorated = new ResistantProtection(decorated);
                decorated = new AffectsTotals(decorated);
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
                decorated = new AffectsTotals(decorated);
                break;
            case MULTIFORM:
                decorated = new MultiForm(decorated);
                break;
            case POSSESSION:
                decorated = new Possession(decorated);
                break;
            case REFLECTION:
                decorated = new Reflection(decorated);
                break;
            case REGENERATION:
                decorated = new Regeneration(decorated);
                break;
            case RUNNING:
            case SWIMMING:
                decorated = new AffectsTotals(decorated);
                break;
            case SHRINKING:
                decorated = new Shrinking(decorated);
                break;
            case STRETCHING:
                decorated = new Stretching(decorated);
                break;
            case SUMMON:
                decorated = new Summon(decorated);
                break;
            case TELEKINESIS:
                decorated = new Telekinesis(decorated);
                break;
            default:
                if (heroDesignerCharacter.isCharacteristic(decorated.trait)) {
                    decorated = new Characteristic(decorated);
                    decorated = new AffectsTotals(decorated);
                } else if (decorated.trait.originalType === 'talent') {
                    decorated = talentDecorator.decorate(decorated);
                } else if (decorated.trait.originalType === 'perk') {
                    decorated = perkDecorator.decorate(decorated);
                } else if (decorated.trait.originalType === 'skill') {
                    decorated = new Skill(decorated);
                }
        }

        return decorated;
    }
}

export let powerDecorator = new PowerDecorator();