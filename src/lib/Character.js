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

                parser.parseString(this._stripBreakingChars(file), (error, result) => {
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

    isFifthEdition(characteristics) {
        for (let characteristic of characteristics) {
            if (characteristic.name === 'comeliness' && characteristic.total !== '') {
                return true;
            }
        }

        return false;
    }

    _stripBreakingChars(xml) {
        // First we replace common breaking characters
        xml.replace(/(‘|’)/g, "'"); // single smart quotes
        xml.replace(/(“|”)/g, '"'); // double smart quotes
        xml.replace(/–/g, '-'); // em dash
        xml.replace(/…/g, '...'); // triple dot

        return xml;
    }
}

export let character = new Character();