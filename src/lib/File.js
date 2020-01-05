import { Platform, PermissionsAndroid, Alert } from 'react-native';
import { Toast } from 'native-base';
import DocumentPicker from 'react-native-document-picker';
import RNFetchBlob from 'rn-fetch-blob'
import xml2js from 'react-native-xml2js';
import { common } from './Common';
import { character as characterLib } from './Character';
import { heroDesignerCharacter } from './HeroDesignerCharacter';
import { Buffer } from 'buffer';
import iconv from 'iconv-lite';

// Copyright 2020 Philip J. Guinchard
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//    http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

class File {
    async loadCharacter(startLoad, endLoad) {
        let character = null;

        try {
            const result = await DocumentPicker.pick({
                type: [DocumentPicker.types.allFiles],
            });

            if (result === null) {
                return;
            }

            if (result.name.toLowerCase().endsWith('.xml')) {
                character = await this._read(result.uri, startLoad, endLoad);
            } else if (result.name.toLowerCase().endsWith('.hdc')) {
                let hasWritePermission = await this._askForWritePermission();

                if (hasWritePermission) {
                    character = await this._read(result.uri, startLoad, endLoad, true);
                }
            } else {
                common.toast('Unsupported file type: ' + result.type);

                return;
            }

            return character;
        } catch (error) {
            const isCancel = await DocumentPicker.isCancel(error);

            if (!isCancel) {
                common.toast(error.message);
            }
        }
    }

    async _read(uri, startLoad, endLoad, isHdc=false) {
        startLoad();
        let character = null;

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
                character = await this._loadHdcCharacter(rawXml);
            } else {
                character = await this._loadXmlExportCharacter(rawXml);
            }
        } catch (error) {
            common.toast('Read Error: ' + error.message);
        } finally {
            endLoad();
        }


        return character;
    }

    async _loadXmlExportCharacter(rawXml) {
        let parser = xml2js.Parser({explicitArray: false});
        let character = await new Promise((resolve, reject) => parser.parseString(rawXml, (error, result) => {
            if (error) {
                reject(error);
            }

            resolve(result);
        }));

        common.toast('Character successfully loaded');

        return character.character;
    }

    async _loadHdcCharacter(rawXml) {
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
        let character = null;

        parser.parseString(rawXml, (error, result) => {
            character = heroDesignerCharacter.getCharacter(result);
        });

        common.toast('Character successfully loaded');

        return character;
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
        if (value.trim() === '' || value === null || value === undefined) {
            return null;
        } else if (common.isInt(value)) {
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
