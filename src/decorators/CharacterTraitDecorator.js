import { Alert } from 'react-native';
import BaseCost from './BaseCost';
import CharacterTrait from './CharacterTrait';
import ModifierCalculator from './ModifierCalculator';
import Skill from './Skill';
import Maneuver from './Maneuver';
import VariablePowerPool from './VariablePowerPool';
import MultipowerItem from './powers/MultipowerItem';
import NakedModifier from './NakedModifier';
import CompoundPower from './CompoundPower';
import Complication from './Complication';
import { skillDecorator } from './skills/SkillDecorator';
import { perkDecorator } from './perks/PerkDecorator';
import { talentDecorator } from './talents/TalentDecorator';
import { powerDecorator } from './powers/PowerDecorator';
import { heroDesignerCharacter } from '../lib/HeroDesignerCharacter';

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

class CharacterTraitDecorator {
    decorate(item, listKey, getCharacter) {
        let decorated = new CharacterTrait(item, listKey, getCharacter);

        if (decorated.trait.type === 'skill' || decorated.trait.hasOwnProperty('skills')) {
            decorated = new Skill(decorated);
        } else {
            decorated = new BaseCost(decorated);
        }

        if (decorated.trait.type === 'maneuver' || decorated.trait.hasOwnProperty('maneuver')) {
            decorated = new Maneuver(decorated);
        }

        if (decorated.trait.type === 'disad') {
            decorated = new Complication(decorated);
        }

        decorated = this._decorateItem(decorated);
        decorated = new ModifierCalculator(decorated);

        if (decorated.trait.xmlid.toUpperCase() === 'COMPOUNDPOWER') {
            decorated = new CompoundPower(decorated, this);
        } else if (decorated.trait.xmlid.toUpperCase() === 'NAKEDMODIFIER') {
            decorated = new NakedModifier(decorated);
        }

        if (heroDesignerCharacter.isMultipowerItem(decorated.trait, decorated.getCharacter())) {
            decorated = new MultipowerItem(decorated);
        } else if (decorated.trait.hasOwnProperty('originalType') && decorated.trait.originalType.toUpperCase() === 'VPP') {
            decorated = new VariablePowerPool(decorated);
        }

        return decorated;
    }

    _decorateItem(decorated) {
        if (decorated.trait.type === 'skill' || decorated.trait.hasOwnProperty('skills')) {
            decorated = skillDecorator.decorate(decorated);
        } else if (decorated.trait.type === 'perk' || decorated.trait.hasOwnProperty('perks')) {
            decorated = perkDecorator.decorate(decorated);
        } else if (decorated.trait.type === 'talent' || decorated.trait.hasOwnProperty('talents')) {
            decorated = talentDecorator.decorate(decorated);
        } else if (decorated.trait.type === 'power' || decorated.trait.type === 'powers' || decorated.trait.hasOwnProperty('powers')) {
            decorated = powerDecorator.decorate(decorated);
        }

        return decorated;
    }
}

export let characterTraitDecorator = new CharacterTraitDecorator();
