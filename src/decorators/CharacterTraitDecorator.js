import { Alert } from 'react-native';
import BaseCost from './BaseCost';
import CharacterTrait from './CharacterTrait';
import Modifier from './Modifier';
import Skill from './Skill';
import Maneuver from './Maneuver';
import VariablePowerPool from './VariablePowerPool';
import MultipowerItem from './powers/MultipowerItem';
import NakedModifier from './NakedModifier';
import CompoundPower from './CompoundPower';
import { skillDecorator } from './skills/SkillDecorator';
import { perkDecorator } from './perks/PerkDecorator';
import { talentDecorator } from './talents/TalentDecorator';
import { powerDecorator } from './powers/PowerDecorator';
import { heroDesignerCharacter } from '../lib/HeroDesignerCharacter';

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

        decorated = this._decorateItem(decorated);
        decorated = new Modifier(decorated);

        if (heroDesignerCharacter.isMultipowerItem(decorated.trait, decorated.getCharacter())) {
            decorated = new MultipowerItem(decorated);
        } else if (decorated.trait.hasOwnProperty('originalType') && decorated.trait.originalType.toUpperCase() === 'VPP') {
            decorated = new VariablePowerPool(decorated);
        } else if (decorated.trait.xmlid.toUpperCase() === 'NAKEDMODIFIER') {
            decorated = new NakedModifier(decorated);
        } else if (decorated.trait.xmlid.toUpperCase() === 'COMPOUNDPOWER') {
            decorated = new CompoundPower(decorated, this);
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
        } else if (decorated.trait.type === 'power' || decorated.trait.hasOwnProperty('powers')) {
            decorated = powerDecorator.decorate(decorated);
        }

        return decorated;
    }
}

export let characterTraitDecorator = new CharacterTraitDecorator();