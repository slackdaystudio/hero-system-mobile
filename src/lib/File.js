import { Platform, Alert } from 'react-native';
import { Toast } from 'native-base';
import DocumentPicker from 'react-native-document-picker';
import RNFetchBlob from 'rn-fetch-blob';
import xml2js from 'react-native-xml2js';
import { zip, unzip } from 'react-native-zip-archive';
import { common } from './Common';
import { character as characterLib } from './Character';
import { heroDesignerCharacter } from './HeroDesignerCharacter';
import { permission } from './Permission';
import { Buffer } from 'buffer';
import iconv from 'iconv-lite';

// Copyright 2018-Present Philip J. Guinchard
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

const DIR_CHARACTER = 'character'

const DIR_SOUNDS = 'sounds';

const ANDROID_ROOT_DIR = `${RNFetchBlob.fs.dirs.SDCardDir}/HEROSystemMobile`;

const ANDROID_CHARACTER_DIR = `${ANDROID_ROOT_DIR}/${DIR_CHARACTER}`;

const ANDROID_SOUND_DIR = `${ANDROID_ROOT_DIR}/${DIR_SOUNDS}`;

const DEFAULT_ROOT_DIR = RNFetchBlob.fs.dirs.DocumentDir;

const DEFAULT_CHARACTER_DIR = `${DEFAULT_ROOT_DIR}/${DIR_CHARACTER}`;

const DEFAULT_SOUND_DIR = `${DEFAULT_ROOT_DIR}/DIR_SOUNDS`;

const EXT_CHARACTER = 'hsmc';

const EXT_JSON = 'json';

class File {
    async importCharacter(startLoad, endLoad) {
        let character = null;

        try {
            let writePermission = await permission.askForWrite();

            if (!writePermission) {
                common.toast('Unable to load character: write permission is denied.');

                return;
            }

            const result = await DocumentPicker.pick({
                type: [
                    DocumentPicker.types.allFiles,
                    'public.item',
                ],
            });

            if (result === null) {
                return;
            }

            if (result.name.toLowerCase().endsWith('.xml')) {
                character = await this._read(result.uri, startLoad, endLoad);
            } else if (result.name.toLowerCase().endsWith('.hdc')) {
                character = await this._read(result.uri, startLoad, endLoad, true);
            } else {
                common.toast('Unsupported file type: ' + result.type);

                return;
            }

            await this._saveCharacter(character, result.name);

            return character;
        } catch (error) {
            const isCancel = await DocumentPicker.isCancel(error);

            if (!isCancel) {
                common.toast(error.message);
            }
        }
    }

    async listCharacters() {
        let path = null;
        let characters = null;

        try {
            path = await this._getPath(DEFAULT_CHARACTER_DIR);
            characters = await RNFetchBlob.fs.ls(path);

            characters.sort();
        } catch (error) {
            Alert.alert(error.message);
        }

        return characters;
    }

    async loadCharacter(characterName, startLoad, endLoad) {
        let character = null;

        try {
	        startLoad();

            let path = await this._getPath(DEFAULT_CHARACTER_DIR);
            let canonicalFromName = `${path}/${characterName}`;
            let canonicalToName = `${path}/tmp`;

            await unzip(canonicalFromName, canonicalToName);

            character = await RNFetchBlob.fs.readFile(`${canonicalToName}/${characterName.slice(0, -5)}.${EXT_JSON}`);

            await RNFetchBlob.fs.unlink(canonicalToName);

            return JSON.parse(character);
        } catch (error) {
            common.toast(error.message)
        } finally {
            endLoad(character);
        }
    }

    async saveCharacter(character, filename) {
        try {
            let path = await this._getPath(DEFAULT_CHARACTER_DIR);

            await this._saveCharacter(character, filename);

            return true;
        } catch (error) {
            Alert.alert(error.message)
        }

        return false;
    }

    async deleteCharacter(filename) {
        try {
            let path = await this._getPath(DEFAULT_CHARACTER_DIR);

            await RNFetchBlob.fs.unlink(`${path}/${filename}`);
        } catch (error) {
            Alert.alert(error.message)
        }
    }

    async _read(uri, startLoad, endLoad, isHdc = false) {
        let character = null;

        try {
            startLoad();

            let filePath = uri.startsWith('file://') ? uri.substring(7) : uri;

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
        let character = null;

        try {
            character = await new Promise((resolve, reject) => parser.parseString(rawXml, (error, result) => {
                if (error) {
                    reject(error);
                }

                resolve(result);
            }));

            common.toast('Character successfully loaded');
        } catch (error) {
            common.toast(error.message);
        }

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
                },
            ],
            attrValueProcessors: [
                (value) => {
                    return this._parseXmlValue(value);
                },
            ],
            tagNameProcessors: [
                (name) => {
                    return common.toCamelCase(name);
                },
            ],
            valueProcessors: [
                (value) => {
                    return this._parseXmlValue(value);
                },
            ],
        });
        let character = null;

        try {
            character = await new Promise((resolve, reject) => parser.parseString(rawXml, (error, result) => {
                if (error) {
                    reject(error);
                }

                resolve(result);
            }));

            common.toast('Character successfully loaded');
        } catch (error) {
            common.toast(error.message);
        }

        return heroDesignerCharacter.getCharacter(character);
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

    async _saveCharacter(character, filename) {
        let characterPath = await this._getFileName(filename, DEFAULT_CHARACTER_DIR);
        let zipPath = await this._getFileName(filename, DEFAULT_CHARACTER_DIR, EXT_CHARACTER);

        await RNFetchBlob.fs.writeFile(characterPath, JSON.stringify(character));
        await zip(characterPath, zipPath);
        await RNFetchBlob.fs.unlink(characterPath);
    }

    async _getPath(defaultPath) {
        let path = defaultPath;
        let writePermission = await permission.askForWrite();

        if (writePermission) {
            if (path === DEFAULT_CHARACTER_DIR) {
                path = Platform.OS === 'android' ? ANDROID_CHARACTER_DIR : DEFAULT_CHARACTER_DIR;
            } else if (path === DEFAULT_SOUND_DIR) {
                path = Platform.OS === 'android' ? ANDROID_SOUND_DIR : DEFAULT_SOUND_DIR;
            } else if (path === DEFAULT_ROOT_DIR) {
                path = Platform.OS === 'android' ? ANDROID_ROOT_DIR : DEFAULT_ROOT_DIR;
            } else {
                throw `Unknown path: {$path}`;
            }
        }

        await this._makeSaveLocation(path);

        return path;
    }

    async _makeSaveLocation(location) {
        try {
            const exists =  await RNFetchBlob.fs.exists(location);

            if (!exists) {
                await RNFetchBlob.fs.mkdir(location);
            }
        } catch (error) {
            Alert.alert(error.message);
        }
    }

    async _getFileName(filename, directoryName, extension=EXT_JSON) {
        let validExtensions = ['xml', 'hdc'];
        let path = await this._getPath(directoryName);

        if (validExtensions.includes(filename.toLowerCase().slice(-3))) {
            filename = filename.slice(0, -4);
        }

        return `${path}/${filename.replace(/[/\\?%*:|"<>]/g, '_')}.${extension}`;
    }
}

export let file = new File();
