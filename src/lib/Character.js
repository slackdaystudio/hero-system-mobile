import { Platform, AsyncStorage, Alert } from 'react-native';
import { Toast } from 'native-base';
import { DocumentPicker, DocumentPickerUtil } from 'react-native-document-picker';
import RNFS from 'react-native-fs';
import xml2js from 'react-native-xml2js';
import { common } from './Common';

class Character {
    load() {
        if (common.isIPad()) {
            DocumentPicker.show({
                top: 0,
                left: 0,
                filetype: ['public.xml']
            }, (error, uri) => {
                this._read(uri);
            });
        } else {
            DocumentPicker.show({filetype: [DocumentPickerUtil.allFiles()]},(error, result) => {
                if (result === null) {
                    return;
                }

                if (result.type === 'text/xml' || result.type === 'application/xml') {
                    this._read(result.uri);
                } else {
                    Toast.show({
                        text: 'Unsupported file type: ' + result.type,
                        position: 'bottom',
                        buttonText: 'OK'
                    });

                    return;
                }
            });
        }
    }

    isFifthEdition(characteristics) {
        for (let characteristic of characteristics) {
            if (characteristic.name === 'comeliness' && characteristic.total !== '') {
                return true;
            }
        }

        return false;
    }

    getDefenses(character) {
        let pd = this.getCharacteristic(character.characteristics.characteristic, 'pd', false).notes.split(' ');
        let ed = this.getCharacteristic(character.characteristics.characteristic, 'ed', false).notes.split(' ');

        return [
            {
                label: 'Physical Defense',
                value: pd[0]
            }, {
                label: 'R. Physical Defense',
                value: (pd.length === 4 ? pd[2].slice(1) : 0)
            }, {
                label: 'Energy Defense',
                value: ed[0]
            }, {
                label: 'R. Energy Defense',
                value: (ed.length === 4 ? ed[2].slice(1) : 0)
            }
        ];
    }

    getCharacteristic(characteristics, name, totalOnly = true) {
        for (let characteristic of characteristics) {
            if (characteristic.name === name) {
                if (totalOnly) {
                    let total = characteristic.total;

                    if (total.indexOf('/') !== -1) {
                        total = total.split('/')[1];
                    }

                    return total;
                }

                return characteristic;
            }
        }

        return 0;
    }

    _read(uri) {
        RNFS.readFile(uri, 'ascii').then(file => {
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
    }
}

export let character = new Character();