import { AsyncStorage } from 'react-native';
import { Toast } from 'native-base';
import { DocumentPicker } from 'react-native-document-picker';
import RNFS from 'react-native-fs';
import xml2js from 'react-native-xml2js';

class Character {
    load() {
        DocumentPicker.show({filetype: ['text/xml', 'application/xml']},(error, result) => {
            if (result.status === 'cancel') {

            }

            RNFS.readFile(result.uri).then(file => {
                let parser = xml2js.Parser({explicitArray: false});

                parser.parseString(file, (error, result) => {
                    AsyncStorage.setItem('character', JSON.stringify(result));
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

    isSixthEdition(characteristics) {
        for (let characteristic in characteristics) {
            if (characteristic.name === 'comeliness' && characteristic.total === '') {
                return false;
            }
        }

        return true;
    }
}

export let character = new Character();