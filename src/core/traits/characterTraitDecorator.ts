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

import {heroDesignerCharacter} from 'core/hero';
import BaseCost from './baseCost';
import {CharacterTrait, hasOwn, type Obj} from './characterTrait';
import Complication from './complication';
import CompoundPower from './compoundPower';
import Maneuver from './maneuver';
import ModifierCalculator from './modifierCalculator';
import NakedModifier from './nakedModifier';
import Skill from './skill';
import VariablePowerPool from './variablePowerPool';
import ElementalControlItem from './powers/elementalControlItem';
import MultipowerItem from './powers/multipowerItem';
import {perkDecorator} from './perks/perkDecorator';
import {powerDecorator} from './powers/powerDecorator';
import {skillDecorator} from './skills/skillDecorator';
import {talentDecorator} from './talents/talentDecorator';

/**
 * Builds a trait's decorator stack, ported from legacy
 * `decorators/CharacterTraitDecorator.js`. Wraps a base `CharacterTrait` in
 * layers (base cost/skill → maneuver/complication → category sub-factory →
 * ModifierCalculator → special/framework) selected by the trait's type/xmlid.
 */
class CharacterTraitDecorator {
    decorate(item: Obj, listKey: string, getCharacter: () => Obj): CharacterTrait {
        let decorated: CharacterTrait = new CharacterTrait(item, listKey, getCharacter);

        if (decorated.trait.type === 'skill' || hasOwn(decorated.trait, 'skills')) {
            decorated = new Skill(decorated);
        } else {
            decorated = new BaseCost(decorated);
        }

        if (decorated.trait.type === 'maneuver' || hasOwn(decorated.trait, 'maneuver')) {
            decorated = new Maneuver(decorated);
        }

        if (decorated.trait.type === 'disad') {
            decorated = new Complication(decorated);
        }

        decorated = this.decorateItem(decorated);
        decorated = new ModifierCalculator(decorated);

        if (decorated.trait.xmlid.toUpperCase() === 'COMPOUNDPOWER') {
            decorated = new CompoundPower(decorated, this);
        } else if (decorated.trait.xmlid.toUpperCase() === 'NAKEDMODIFIER') {
            decorated = new NakedModifier(decorated);
        }

        if (heroDesignerCharacter.isPowerFrameworkItem(decorated.trait, decorated.getCharacter(), 'multipower')) {
            decorated = new MultipowerItem(decorated);
        } else if (heroDesignerCharacter.isPowerFrameworkItem(decorated.trait, decorated.getCharacter(), 'elementalControl')) {
            decorated = new ElementalControlItem(decorated);
        } else if (hasOwn(decorated.trait, 'originalType') && decorated.trait.originalType.toUpperCase() === 'VPP') {
            decorated = new VariablePowerPool(decorated);
        }

        return decorated;
    }

    private decorateItem(decorated: CharacterTrait): CharacterTrait {
        if (decorated.trait.type === 'skill' || hasOwn(decorated.trait, 'skills')) {
            decorated = skillDecorator.decorate(decorated);
        } else if (decorated.trait.type === 'perk' || hasOwn(decorated.trait, 'perks')) {
            decorated = perkDecorator.decorate(decorated);
        } else if (decorated.trait.type === 'talent' || hasOwn(decorated.trait, 'talents')) {
            decorated = talentDecorator.decorate(decorated);
        } else if (decorated.trait.type === 'power' || decorated.trait.type === 'powers' || hasOwn(decorated.trait, 'powers')) {
            decorated = powerDecorator.decorate(decorated);
        }

        return decorated;
    }
}

export const characterTraitDecorator = new CharacterTraitDecorator();
