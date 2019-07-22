import { Platform, PermissionsAndroid, Alert } from 'react-native';
import { Toast } from 'native-base';
import AsyncStorage from '@react-native-community/async-storage';
import DocumentPicker from 'react-native-document-picker';
import RNFetchBlob from 'rn-fetch-blob'
import xml2js from 'react-native-xml2js';
import { common } from './Common';
import { character } from './Character';

class File {
    async loadCharacter(startLoad, endLoad) {
        try {
            const result = await DocumentPicker.pick({
                type: [DocumentPicker.types.allFiles],
            });

            if (result === null) {
                return;
            }

            if (result.name.toLowerCase().endsWith('.xml')) {
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
        } catch (error) {
            const isCancel = await DocumentPicker.isCancel(error);

            if (!isCancel) {
                Alert.alert(error.message);
            }
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
            
            let data = await RNFetchBlob.fs.readFile(filePath, 'utf8');
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
