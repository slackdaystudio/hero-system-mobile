import Absorption from './Absorption';
import Armor from './Armor';
import Barrier from './Barrier';
import Characteristic from './Characteristic';
import Clinging from './Clinging';
import Concealed from './Concealed';
import CustomPower from './CustomPower';
import DamageNegation from './DamageNegation';
import DensityIncrease from './DensityIncrease';
import Detect from './Detect';
import Duplication from './Duplication';
import EnduranceReserve from './EnduranceReserve';
import EnhancedPerception from './EnhancedPerception';
import Entangle from './Entangle';
import ExtraLimbs from './ExtraLimbs';
import FindWeakness from './FindWeakness';
import Flash from './Flash';
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
import Telescopic from './Telescopic';
import SenseAffectingPower from './SenseAffectingPower';
import MagnifiedSense from './MagnifiedSense';
import AffectsTotals from '../AffectsTotals';
import ExtraAttributes from '../ExtraAttributes';
import EffectRoll from '../EffectRoll';
import Movement from '../Movement';
import NegativeLevels from '../NegativeLevels';
import UnusualDefense from '../UnusualDefense';
import Skill from '../Skill';
import { heroDesignerCharacter } from '../../lib/HeroDesignerCharacter';
import { talentDecorator } from '../talents/TalentDecorator';
import { perkDecorator } from '../perks/PerkDecorator';
import { NORMAL_DAMAGE, KILLING_DAMAGE, EFFECT } from '../../lib/DieRoller';

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

const ABSORPTION = 'ABSORPTION';

const ARMOR = 'ARMOR';

const AID = 'AID';

const BARRIER = 'FORCEWALL';

const BLAST = 'ENERGYBLAST';

const CLINGING = 'CLINGING';

const CONCEALED = 'CONCEALED';

const CUSTOMPOWER = 'CUSTOMPOWER';

const DAMAGENEGATION = 'DAMAGENEGATION';

const DENSITYINCREASE = 'DENSITYINCREASE';

const DETECT = 'DETECT';

const DISPEL = 'DISPEL';

const DRAIN = 'DRAIN';

const DUPLICATION = 'DUPLICATION';

const EGOATTACK = 'EGOATTACK';

const ENDURANCERESERVE = 'ENDURANCERESERVE';

const ENHANCEDPERCEPTION = 'ENHANCEDPERCEPTION';

const ENTANGLE = 'ENTANGLE';

const EXTRALIMBS = 'EXTRALIMBS';

const FINDWEAKNESS = 'FINDWEAKNESS';

const FLASH = 'FLASH';

const FLASHDEFENSE = 'FLASHDEFENSE';

const FLIGHT = 'FLIGHT';

const FORCEFIELD = 'FORCEFIELD';

const FTL = 'FTL';

const GLIDING = 'GLIDING';

const HKA = 'HKA';

const HANDTOHANDATTACK = 'HANDTOHANDATTACK';

const HEALING = 'HEALING';

const KBRESISTANCE = 'KBRESISTANCE';

const LACKOFWEAKNESS = 'LACKOFWEAKNESS';

const LEAPING = 'LEAPING';

const LUCK = 'LUCK';

const MENTALDEFENSE = 'MENTALDEFENSE';

const MENTALILLUSIONS = 'MENTALILLUSIONS';

const MICROSCOPIC = 'MICROSCOPIC';

const MINDCONTROL = 'MINDCONTROL';

const MINDSCAN = 'MINDSCAN';

const MULTIFORM = 'MULTIFORM';

const NEGATIVECOMBATSKILLLEVELS = 'NEGATIVECOMBATSKILLLEVELS';

const NEGATIVEPENALTYSKILLLEVELS = 'NEGATIVEPENALTYSKILLLEVELS';

const NEGATIVESKILLLEVELS = 'NEGATIVESKILLLEVELS';

const POSSESSION = 'POSSESSION';

const POWERDEFENSE = 'POWERDEFENSE';

const RAPID = 'RAPID';

const REFLECTION = 'REFLECTION';

const REGENERATION = 'REGENERATION';

const RKA = 'RKA';

const RUNNING = 'RUNNING';

const SHRINKING = 'SHRINKING';

const STRETCHING = 'STRETCHING';

const SUCCOR = 'SUCCOR';

const SUMMON = 'SUMMON';

const SUPPRESS = 'SUPPRESS';

const SWIMMING = 'SWIMMING';

const SWINGING = 'SWINGING';

const TELEKINESIS = 'TELEKINESIS';

const TELEPATHY = 'TELEPATHY';

const TELEPORTATION = 'TELEPORTATION';

const TELESCOPIC = 'TELESCOPIC';

const TRANSFER = 'TRANSFER';

const TRANSFORM = 'TRANSFORM';

const TUNNELING = 'TUNNELING';

class PowerDecorator {
    decorate(decorated) {
        switch (decorated.trait.xmlid.toUpperCase()) {
            case ABSORPTION:
                decorated = new Absorption(decorated);
                break;
            case ARMOR:
                decorated = new Armor(decorated);
                break;
            case BLAST:
            case EGOATTACK:
                decorated = new EffectRoll(decorated, NORMAL_DAMAGE);
                break;
            case TRANSFER:
            case TRANSFORM:
            case RKA:
                decorated = new EffectRoll(decorated, KILLING_DAMAGE);
                break;
            case AID:
            case DISPEL:
            case DRAIN:
            case HEALING:
            case LUCK:
            case MENTALILLUSIONS:
            case MINDCONTROL:
            case MINDSCAN:
            case SUCCOR:
            case SUPPRESS:
            case TELEPATHY:
                decorated = new EffectRoll(decorated, EFFECT);
                break;
            case BARRIER:
                decorated = new Barrier(decorated);
                break;
            case CLINGING:
                decorated = new Clinging(decorated);
                break;
            case CONCEALED:
                decorated = new Concealed(decorated);
                decorated = new SenseAffectingPower(decorated);
                break;
            case CUSTOMPOWER:
                decorated = new CustomPower(decorated);
                break;
            case DAMAGENEGATION:
                decorated = new DamageNegation(decorated);
                break;
            case DENSITYINCREASE:
                decorated = new DensityIncrease(decorated);
                decorated = new AffectsTotals(decorated);
                break;
            case DETECT:
                decorated = new Detect(decorated);
                break;
            case DUPLICATION:
                decorated = new Duplication(decorated);
                break;
            case ENDURANCERESERVE:
                decorated = new EnduranceReserve(decorated);
                break;
            case ENHANCEDPERCEPTION:
                decorated = new EnhancedPerception(decorated);
                decorated = new SenseAffectingPower(decorated);
                break;
            case ENTANGLE:
                decorated = new Entangle(decorated);
                decorated = new EffectRoll(decorated, EFFECT);
                break;
            case EXTRALIMBS:
                decorated = new ExtraLimbs(decorated);
                break;
            case FINDWEAKNESS:
                decorated = new FindWeakness(decorated);
                break;
            case FLASH:
                decorated = new EffectRoll(decorated, EFFECT);
                decorated = new Flash(decorated);
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
            case GLIDING:
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
            case LACKOFWEAKNESS:
            case NEGATIVECOMBATSKILLLEVELS:
            case NEGATIVEPENALTYSKILLLEVELS:
            case NEGATIVESKILLLEVELS:
                decorated = new NegativeLevels(decorated);
                break;
            case LEAPING:
                decorated = new Leaping(decorated);
                decorated = new Movement(decorated);
                decorated = new AffectsTotals(decorated);
                break;
            case MICROSCOPIC:
            case RAPID:
                decorated = new SenseAffectingPower(decorated);
                decorated = new MagnifiedSense(decorated);
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
            case TELESCOPIC:
                decorated = new Telescopic(decorated);
                decorated = new SenseAffectingPower(decorated);
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
