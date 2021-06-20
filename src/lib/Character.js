import {file} from './File';

class Character {
    async import(startLoad, endLoad) {
        return file.importCharacter(startLoad, endLoad);
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
