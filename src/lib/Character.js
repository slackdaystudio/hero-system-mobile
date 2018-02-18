import { AsyncStorage, Alert } from 'react-native';
import Expo from 'expo';

class Character {
	constructor() {
		this.characterMap = new Map();
	}
	
	load() {
		let result = Expo.DocumentPicker.getDocumentAsync({}).then((result) => {
			if (result.type === 'success') {
				Alert.alert('Success: ' + result.uri);
				AsyncStorage.setItem('characterFile', JSON.stringify(result));
			}			
		}).catch((e) => {
			Alert.alert(e);
		});
	}
}

export let character = new Character();