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
import TraitWithSkillRoll from '../traitWithSkillRoll';
import TwelveOrLessRoll from '../twelveOrLessRoll';
import CombatSense from './combatSense';
import LightningReflexes from './lightningReflexes';
import StrikingAppearance from './strikingAppearance';

/** Talent sub-factory, ported from legacy `decorators/talents/TalentDecorator.js`. */
class TalentDecorator {
    decorate(decorated: CharacterTrait): CharacterTrait {
        switch (decorated.trait.xmlid.toUpperCase()) {
            case 'COMBAT_SENSE':
                decorated = new CombatSense(decorated);
                decorated = new TwelveOrLessRoll(decorated);
                break;
            case 'DANGER_SENSE':
            case 'UNIVERSAL_TRANSLATOR':
                decorated = new TwelveOrLessRoll(decorated);
                break;
            case 'LIGHTNING_REFLEXES_ALL':
                decorated = new LightningReflexes(decorated);
                break;
            case 'STRIKING_APPEARANCE':
                decorated = new StrikingAppearance(decorated);
                break;
            case 'CUSTOMTALENT':
                decorated = new TraitWithSkillRoll(decorated);
                break;
            default:
            // do nothing
        }

        return decorated;
    }
}

export const talentDecorator = new TalentDecorator();
