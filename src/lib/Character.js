import {file} from './File';

class Character {
    async import(startLoad, endLoad) {
        return await file.importCharacter(startLoad, endLoad);
    }

    isHeroDesignerCharacter(character) {
        if (character === null || character === undefined) {
            return false;
        }

        return character.hasOwnProperty('version');
    }

    isFifthEdition(characteristics) {
        for (let characteristic of characteristics) {
            if (characteristic.name === 'comeliness' && characteristic.total !== '') {
                return true;
            }
        }

        return false;
    }
}

export let character = new Character();
