import { Alert } from 'react-native';
import CharacterTrait from './CharacterTrait';

export default class SkillLevels extends CharacterTrait {
    constructor(characterTrait) {
        super(characterTrait.trait, characterTrait.listKey, characterTrait.getCharacter);

        this.characterTrait = characterTrait;
    }

    cost() {
        let levelCost = 0;
        let levelValue = 0;

        for (let option of this.characterTrait.trait.template.option) {
            if (option.xmlid.toUpperCase() === this.characterTrait.trait.optionid.toUpperCase()) {
                levelCost = option.lvlcost;
                levelValue = option.lvlval;
                break;
            }
        }

        return this.characterTrait.trait.levels / levelValue * levelCost;
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
            label: 'Total Levels',
            value: this.characterTrait.trait.levels
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
}