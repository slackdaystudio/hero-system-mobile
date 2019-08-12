import { Platform, PermissionsAndroid, Alert } from 'react-native';
import { Toast } from 'native-base';
import AsyncStorage from '@react-native-community/async-storage';
import DocumentPicker from 'react-native-document-picker';
import RNFetchBlob from 'rn-fetch-blob'
import xml2js from 'react-native-xml2js';
import { common } from './Common';
import { character } from './Character';
import { Buffer } from 'buffer';
import iconv from 'iconv-lite';

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
                await this._read(result.uri, startLoad, endLoad);
            } else if (result.name.toLowerCase().endsWith('.hdc')  || result.name.toLowerCase().endsWith('.hdt')) {
                let hasWritePermission = await this._askForWritePermission();

                if (hasWritePermission) {
                    await this._read(result.uri, startLoad, endLoad, true);
                }
            } else {
                common.toast('Unsupported file type: ' + result.type);

                return;
            }
        } catch (error) {
            const isCancel = await DocumentPicker.isCancel(error);

            if (!isCancel) {
                common.toast(error.message);
            }
        }
    }

    async _read(uri, startLoad, endLoad, isHdc=false) {
        startLoad();

        try {
            let filePath = uri.startsWith('file://') ? uri.substring(7) : uri; ;

            if (Platform.OS === 'ios' && !common.isIPad() && /\/org\.diceless\.herogmtools\-Inbox/.test(filePath) === false) {
                let arr = uri.split('/');
                const dirs = RNFetchBlob.fs.dirs;
                filePath = `${dirs.DocumentDir}/${arr[arr.length - 1]}`;
            }

            let data = await RNFetchBlob.fs.readFile(decodeURI(filePath), 'base64');
            let rawXml = this._decode(data);

            if (isHdc) {
                this._loadHdcCharacter(rawXml);
            } else {
                this._loadXmlExportCharacter(rawXml);
            }
        } catch (error) {
            Alert.alert('Read Error: ' + error.message);
        } finally {
            endLoad();
        }
    }

    _loadXmlExportCharacter(rawXml) {
        let parser = xml2js.Parser({explicitArray: false});

        parser.parseString(rawXml, (error, result) => {
            AsyncStorage.setItem('character', JSON.stringify(result)).then(() => {
                AsyncStorage.setItem('combat', JSON.stringify({
                    stun: character.getCharacteristic(result.character.characteristics.characteristic, 'stun'),
                    body: character.getCharacteristic(result.character.characteristics.characteristic, 'body'),
                    endurance: character.getCharacteristic(result.character.characteristics.characteristic, 'endurance')
                })).then(() => {
                    common.toast('Character successfully loaded');
                });
            });
        });
    }

    _loadHdcCharacter(rawXml) {
        let parser = xml2js.Parser({
            explicitArray: false,
            mergeAttrs: true,
            emptyTag: null,
            explicitRoot: false,
            attrNameProcessors: [
                (name) => {
                    return common.toCamelCase(name);
                }
            ],
            attrValueProcessors: [
                (value) => {
                    return this._parseXmlValue(value);
                }
            ],
            tagNameProcessors: [
                (name) => {
                    return common.toCamelCase(name);
                }
            ],
            valueProcessors: [
                (value) => {
                    return this._parseXmlValue(value);
                }
            ],
        });

        parser.parseString(rawXml, (error, result) => {
            AsyncStorage.setItem('character', JSON.stringify(result)).then(() => {
                common.toast('Character successfully loaded');
            });
            // RNFetchBlob.fs.writeFile(RNFetchBlob.fs.dirs.SDCardDir + '/HEROSystemMobile' + '/temp.json', JSON.stringify(result), 'utf8').then(() => {
            //     common.toast('Character successfully saved');
            // }).catch(error => {
            //     common.toast(error.message);
            // });
        });
    }

    _decode(base64Payload) {
        let buffer = Buffer.from(base64Payload, 'base64');
        let decoded = iconv.decode(buffer, 'utf-16');

        if (decoded.substring(0, 5) !== '<?xml') {
            decoded = iconv.decode(buffer, 'utf-8');
        }

        if (decoded.substring(0, 5) !== '<?xml') {
            throw 'Unable to decode character payload';
        }

        return decoded;
    }

    _parseXmlValue(value) {
        if (common.isInt(value)) {
            return parseInt(value, 10);
        } else if (common.isFloat(value)) {
            return parseFloat(value);
        } else if (value === 'true' || value === 'false' || value.toLowerCase() == 'yes' || value.toLowerCase() === 'no') {
            return value === 'true' || value.toLowerCase() === 'yes' ? true : false;
        }

        return value.replace(/\r\n\t\t\t\t/gi, '').replace(/\r\n/gi, '\n');
    }

    async _askForWritePermission() {
        if (Platform.OS === 'android') {
            try {
                let check = await PermissionsAndroid.check(PermissionsAndroid.PERMISSIONS.WRITE_EXTERNAL_STORAGE);

                if (check === PermissionsAndroid.RESULTS.GRANTED) {
                    return check;
                }

                const granted = await PermissionsAndroid.request(
                    PermissionsAndroid.PERMISSIONS.WRITE_EXTERNAL_STORAGE,
                    {
                        'title': 'HERO System Mobile File System Permission',
                        'message': 'HERO System Mobile needs read/write access to your device to save characters'
                    }
                );

                return granted;
            } catch (error) {
                common.toast(error.message);
            }
        }

        return null;
    }
}

export let file = new File();
