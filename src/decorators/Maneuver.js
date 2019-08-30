import { Alert } from 'react-native';
import CharacterTrait from './CharacterTrait';

export default class Maneuver extends CharacterTrait {
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

        if (this.characterTrait.trait.hasOwnProperty('phase')) {
            attributes.push({
                label: 'Phase',
                value: this.characterTrait.trait.phase === '1/2' ? '½' : this.characterTrait.trait.phase
            });
        }

        if (this.characterTrait.trait.hasOwnProperty('ocv')) {
            attributes.push({
                label: 'OCV',
                value: this.characterTrait.trait.ocv
            });
        }

        if (this.characterTrait.trait.hasOwnProperty('dcv')) {
            attributes.push({
                label: 'DCV',
                value: this.characterTrait.trait.dcv
            });
        }

        if (this.characterTrait.trait.hasOwnProperty('range')) {
            attributes.push({
                label: 'Range',
                value: `+${this.characterTrait.trait.range}`
            });
        }

        if (this.characterTrait.trait.hasOwnProperty('effect')) {
            attributes.push({
                label: 'Effect',
                value: this.characterTrait.trait.effect.replace('[WEAPONDC]', `+${this.characterTrait.trait.dc} DC`)
            });
        }

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
}