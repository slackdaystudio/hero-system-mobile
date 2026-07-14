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
import Contact from './contact';
import FollowerAndBase from './followerAndBase';
import ResourcePoints from './resourcePoints';

/** Perk sub-factory, ported from legacy `decorators/perks/PerkDecorator.js`. */
class PerkDecorator {
    decorate(decorated: CharacterTrait): CharacterTrait {
        switch (decorated.trait.xmlid.toUpperCase()) {
            case 'FOLLOWER':
            case 'VEHICLE_BASE':
                decorated = new FollowerAndBase(decorated);
                break;
            case 'CONTACT':
                decorated = new Contact(decorated);
                break;
            case 'RESOURCE_POOL':
                decorated = new ResourcePoints(decorated);
                break;
            case 'CUSTOMPERK':
                decorated = new TraitWithSkillRoll(decorated);
                break;
            default:
            // do nothing
        }

        return decorated;
    }
}

export const perkDecorator = new PerkDecorator();
