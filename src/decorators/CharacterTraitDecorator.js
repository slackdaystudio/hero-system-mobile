import { Alert } from 'react-native';
import BaseCost from './BaseCost';
import CharacterTrait from './CharacterTrait';
import Modifier from './Modifier';
import Skill from './Skill';
import { perkDecorator } from './perks/PerkDecorator';

class CharacterTraitDecorator {
    decorate(item, items) {
        let decorated = new CharacterTrait(item, this._getParent(item, items));

        if (decorated.trait.type === 'skill' || decorated.trait.hasOwnProperty('skills')) {
            decorated = new Skill(decorated);
        } else {
            decorated = new BaseCost(decorated);
        }

        decorated = this._decorateItem(decorated);
        decorated = new Modifier(decorated);

        return decorated;
    }

    _decorateItem(decorated) {
        if (decorated.trait.type === 'perk' || decorated.trait.hasOwnProperty('perks')) {
            decorated = perkDecorator.decorate(decorated);
        }

        return decorated;
    }

    _getParent(item, items) {
        let parent = undefined;

        if (item.parentid === undefined || items === undefined) {
            return parent;
        }

        for (let i of items) {
            if (i.id === item.parentid) {
                parent = i;
                break;
            }
        }

        return parent;
    }
}

export let characterTraitDecorator = new CharacterTraitDecorator();