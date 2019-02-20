import { Platform, PermissionsAndroid, AsyncStorage, Alert } from 'react-native';
import { Toast } from 'native-base';
import { DocumentPicker, DocumentPickerUtil } from 'react-native-document-picker';
import RNFetchBlob from 'rn-fetch-blob'
import xml2js from 'react-native-xml2js';
import { common } from './Common';
import { character } from './Character';

class File {
    loadCharacter(startLoad, endLoad) {
        if (common.isIPad()) {
            DocumentPicker.show({
                top: 0,
                left: 0,
                filetype: ['public.data']
            }, (error, uri) => {
                this._read(uri.uri, startLoad, endLoad);
            });
        } else {
            DocumentPicker.show({filetype: [DocumentPickerUtil.allFiles()]},(error, result) => {
                if (result === null) {
                    return;
                }


		        if (result.fileName.toLowerCase().endsWith('.xml')) {
                    this._read(result.uri, startLoad, endLoad);
                } else {
                    Toast.show({
                        text: 'Unsupported file type: ' + result.type,
                        position: 'bottom',
                        buttonText: 'OK',
                        duration: 3000
                    });

                    return;
                }
            });
        }
    }

    async _read(uri, startLoad, endLoad) {
        startLoad();

        try {
            let filePath = uri.startsWith('file://') ? uri.substring(7) : uri; ;

            if (Platform.OS === 'ios' && !common.isIPad() && /\/org\.diceless\.herogmtools\-Inbox/.test(filePath) === false) {
                let arr = uri.split('/');
                const dirs = RNFetchBlob.fs.dirs;
                filePath = `${dirs.DocumentDir}/${arr[arr.length - 1]}`;
            }
            
            let data = await RNFetchBlob.fs.readFile(decodeURI(filePath), 'utf8');
            let parser = xml2js.Parser({explicitArray: false});

            parser.parseString(data, (error, result) => {
                AsyncStorage.setItem('character', JSON.stringify(result));
                AsyncStorage.setItem('combat', JSON.stringify({
                    stun: character.getCharacteristic(result.character.characteristics.characteristic, 'stun'),
                    body: character.getCharacteristic(result.character.characteristics.characteristic, 'body'),
                    endurance: character.getCharacteristic(result.character.characteristics.characteristic, 'endurance')
                }));

                Toast.show({
                    text: 'Character successfully loaded',
                    position: 'bottom',
                    buttonText: 'OK',
                    duration: 3000
                });

                endLoad();
            });
        } catch (error) {
            Alert.alert(error.message);
        } finally {
            endLoad();
        }
    }
}

export let file = new File();
