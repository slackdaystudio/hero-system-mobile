import { AsyncStorage, Alert } from 'react-native';
import { Toast } from 'native-base';
import { DocumentPicker } from 'react-native-document-picker';
import RNFS from 'react-native-fs';
import xml2js from 'react-native-xml2js';

class Character {
    load() {
        DocumentPicker.show({filetype: ['text/xml', 'application/xml']},(error, result) => {
            if (result === null) {
                return;
            }

            RNFS.readFile(result.uri, 'ascii').then(file => {
                let parser = xml2js.Parser({explicitArray: false});

                parser.parseString(file, (error, result) => {
                    AsyncStorage.setItem('character', JSON.stringify(result));
                    AsyncStorage.setItem('combat', JSON.stringify({
                        stun: this.getCharacteristic(result.character.characteristics.characteristic, 'stun'),
                        body: this.getCharacteristic(result.character.characteristics.characteristic, 'body'),
                        endurance: this.getCharacteristic(result.character.characteristics.characteristic, 'endurance')
                    }));
                });
            }).catch((error) => {
                Toast.show({
                    text: error.message,
                    position: 'bottom',
                    buttonText: 'OK'
                });
            });
        });
    }

    isFifthEdition(characteristics) {
        for (let characteristic of characteristics) {
            if (characteristic.name === 'comeliness' && characteristic.total !== '') {
                return true;
            }
        }

        return false;
    }

    getCharacteristic(characteristics, name) {
        for (let characteristic of characteristics) {
            if (characteristic.name === name) {
                let total = characteristic.total;

                if (total.indexOf('/') !== -1) {
                    total = total.split('/')[1];
                }

                return total;
            }
        }

        return 0;
    }
}

export let character = new Character();