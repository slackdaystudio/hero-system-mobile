import { AsyncStorage, Alert } from 'react-native';
import { DocumentPicker, DocumentPickerUtil } from 'react-native-document-picker';

class Character {
	constructor() {
		this.characterMap = new Map();
	}
	
    load() {
        DocumentPicker.show({filetype: ['text/xml', 'application/xml']},(error,result) => {
           AsyncStorage.setItem('characterFile', JSON.stringify(result));
        });
    }
}

export let character = new Character();