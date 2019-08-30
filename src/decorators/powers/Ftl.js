import { Alert } from 'react-native';
import CharacterTrait from '../CharacterTrait';
import { common } from '../../lib/Common';

export default class Ftl extends CharacterTrait {
    constructor(characterTrait) {
        super(characterTrait.trait, characterTrait.listKey, characterTrait.getCharacter);

        this.characterTrait = characterTrait;
    }

    cost() {
        return this.characterTrait.cost();
    }

    costMultiplier() {
        return this.characterTrait.costMultiplier();
    }

    activeCost() {
        return this.characterTrait.activeCost();
    }

    realCost() {
        return this.characterTrait.realCost();
    }

    label() {
        return this.characterTrait.label();
    }

    attributes() {
        let attributes = this.characterTrait.attributes();

        attributes.push({
            label: this._getSpeed(),
            value: ''
        });

        return attributes;
    }

    definition() {
        return this.characterTrait.definition();
    }

    roll() {
        return this.characterTrait.roll();
    }

    advantages() {
        return this.characterTrait.advantages();
    }

    limitations() {
        return this.characterTrait.limitations();
    }

    _getSpeed() {
        let speed = this.characterTrait.trait.template.lvlpower ** Math.round(this.characterTrait.trait.levels / this.characterTrait.trait.template.lvlval);
        let units = 'year';

		if (speed > 31536000) {
			units = "second";
			speed = speed / 31536000;
		} else if (speed > 525600) {
			units = "minute";
			speed = speed / 525600;
		} else if (speed > 8760) {
			units = "hour";
			speed = speed / 8760;
		} else if (speed > 365) {
			units = "day";
			speed = speed / 365;
		} else if (speed > 52) {
			units = "week";
			speed = speed / 52;
		} else if (speed > 12) {
			units = "month";
			speed = speed / 12;
		}

		speed = common.roundInPlayersFavor(speed);

		return `${speed} Light Years/${units}`
    }
}