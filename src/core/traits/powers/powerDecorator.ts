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
import AffectsTotals from '../affectsTotals';
import {type CharacterTrait} from '../characterTrait';
import EffectRoll from '../effectRoll';
import Movement from '../movement';
import NegativeLevels from '../negativeLevels';
import UnusualDefense from '../unusualDefense';
import {perkDecorator} from '../perks/perkDecorator';
import {skillDecorator} from '../skills/skillDecorator';
import {talentDecorator} from '../talents/talentDecorator';
import Absorption from './absorption';
import Armor from './armor';
import Barrier from './barrier';
import Characteristic from './characteristic';
import Clinging from './clinging';
import Concealed from './concealed';
import CustomPower from './customPower';
import DamageNegation from './damageNegation';
import DensityIncrease from './densityIncrease';
import Detect from './detect';
import Duplication from './duplication';
import EnduranceReserve from './enduranceReserve';
import EnhancedPerception from './enhancedPerception';
import Entangle from './entangle';
import ExtraLimbs from './extraLimbs';
import FindWeakness from './findWeakness';
import Flash from './flash';
import Ftl from './ftl';
import HandKillingAttack from './handKillingAttack';
import HandToHandAttack from './handToHandAttack';
import KnockbackResistance from './knockbackResistance';
import Leaping from './leaping';
import MagnifiedSense from './magnifiedSense';
import MultiForm from './multiForm';
import Possession from './possession';
import Reflection from './reflection';
import Regeneration from './regeneration';
import ResistantProtection from './resistantProtection';
import SenseAffectingPower from './senseAffectingPower';
import Shrinking from './shrinking';
import Stretching from './stretching';
import Summon from './summon';
import Telekinesis from './telekinesis';
import Telescopic from './telescopic';

/** Power sub-factory, ported from legacy `decorators/powers/PowerDecorator.js`. */
class PowerDecorator {
    decorate(decorated: CharacterTrait): CharacterTrait {
        switch (decorated.trait.xmlid.toUpperCase()) {
            case 'ABSORPTION':
                decorated = new Absorption(decorated);
                break;
            case 'ARMOR':
                decorated = new Armor(decorated);
                break;
            case 'ENERGYBLAST':
            case 'EGOATTACK':
                decorated = new EffectRoll(decorated, RollType.NormalDamage);
                break;
            case 'TRANSFER':
            case 'TRANSFORM':
            case 'RKA':
                decorated = new EffectRoll(decorated, RollType.KillingDamage);
                break;
            case 'AID':
            case 'DISPEL':
            case 'DRAIN':
            case 'HEALING':
            case 'LUCK':
            case 'MENTALILLUSIONS':
            case 'MINDCONTROL':
            case 'MINDSCAN':
            case 'SUCCOR':
            case 'SUPPRESS':
            case 'TELEPATHY':
                decorated = new EffectRoll(decorated, RollType.Effect);
                break;
            case 'FORCEWALL':
                decorated = new Barrier(decorated);
                break;
            case 'CLINGING':
                decorated = new Clinging(decorated);
                break;
            case 'CONCEALED':
                decorated = new Concealed(decorated);
                decorated = new SenseAffectingPower(decorated);
                break;
            case 'CUSTOMPOWER':
                decorated = new CustomPower(decorated);
                break;
            case 'DAMAGENEGATION':
                decorated = new DamageNegation(decorated);
                break;
            case 'DENSITYINCREASE':
                decorated = new DensityIncrease(decorated);
                decorated = new AffectsTotals(decorated);
                break;
            case 'DETECT':
                decorated = new Detect(decorated);
                break;
            case 'DUPLICATION':
                decorated = new Duplication(decorated);
                break;
            case 'ENDURANCERESERVE':
                decorated = new EnduranceReserve(decorated);
                break;
            case 'ENHANCEDPERCEPTION':
                decorated = new EnhancedPerception(decorated);
                decorated = new SenseAffectingPower(decorated);
                break;
            case 'ENTANGLE':
                decorated = new Entangle(decorated);
                decorated = new EffectRoll(decorated, RollType.Effect);
                break;
            case 'EXTRALIMBS':
                decorated = new ExtraLimbs(decorated);
                break;
            case 'FINDWEAKNESS':
                decorated = new FindWeakness(decorated);
                break;
            case 'FLASH':
                decorated = new EffectRoll(decorated, RollType.Effect);
                decorated = new Flash(decorated);
                break;
            case 'FTL':
                decorated = new Ftl(decorated);
                break;
            case 'FLASHDEFENSE':
            case 'MENTALDEFENSE':
            case 'POWERDEFENSE':
                decorated = new UnusualDefense(decorated);
                break;
            case 'FLIGHT':
            case 'GLIDING':
            case 'SWINGING':
            case 'TELEPORTATION':
            case 'TUNNELING':
                decorated = new Movement(decorated);
                break;
            case 'FORCEFIELD':
                decorated = new ResistantProtection(decorated);
                decorated = new AffectsTotals(decorated);
                break;
            case 'HKA':
                decorated = new HandKillingAttack(decorated);
                break;
            case 'HANDTOHANDATTACK':
                decorated = new HandToHandAttack(decorated);
                break;
            case 'KBRESISTANCE':
                decorated = new KnockbackResistance(decorated);
                break;
            case 'LACKOFWEAKNESS':
            case 'NEGATIVECOMBATSKILLLEVELS':
            case 'NEGATIVEPENALTYSKILLLEVELS':
            case 'NEGATIVESKILLLEVELS':
                decorated = new NegativeLevels(decorated);
                break;
            case 'LEAPING':
                decorated = new Leaping(decorated);
                decorated = new Movement(decorated);
                decorated = new AffectsTotals(decorated);
                break;
            case 'MICROSCOPIC':
            case 'RAPID':
                decorated = new SenseAffectingPower(decorated);
                decorated = new MagnifiedSense(decorated);
                break;
            case 'MULTIFORM':
                decorated = new MultiForm(decorated);
                break;
            case 'POSSESSION':
                decorated = new Possession(decorated);
                break;
            case 'REFLECTION':
                decorated = new Reflection(decorated);
                break;
            case 'REGENERATION':
                decorated = new Regeneration(decorated);
                break;
            case 'RUNNING':
            case 'SWIMMING':
                decorated = new AffectsTotals(decorated);
                break;
            case 'SHRINKING':
                decorated = new Shrinking(decorated);
                break;
            case 'STRETCHING':
                decorated = new Stretching(decorated);
                break;
            case 'SUMMON':
                decorated = new Summon(decorated);
                break;
            case 'TELEKINESIS':
                decorated = new Telekinesis(decorated);
                break;
            case 'TELESCOPIC':
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
                    decorated = skillDecorator.decorate(decorated);
                }
        }

        return decorated;
    }
}

export const powerDecorator = new PowerDecorator();
