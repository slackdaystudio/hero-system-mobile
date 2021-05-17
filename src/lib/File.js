import { Platform, Alert } from 'react-native';
import DocumentPicker from 'react-native-document-picker';
import RNFS from 'react-native-fs';
import xml2js from 'react-native-xml2js';
import { zip, unzip } from 'react-native-zip-archive';
import { isBase64 } from 'is-base64';
import { common } from './Common';
import { heroDesignerCharacter } from './HeroDesignerCharacter';
import { combatDetails } from './CombatDetails';
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

const DIR_CHARACTER = 'character';

const DIR_SOUNDS = 'sounds';

const ANDROID_ROOT_DIR = `${RNFS.ExternalStorageDirectoryPath}/HEROSystemMobile`;

const ANDROID_CHARACTER_DIR = `${ANDROID_ROOT_DIR}/${DIR_CHARACTER}`;

const ANDROID_SOUND_DIR = `${ANDROID_ROOT_DIR}/${DIR_SOUNDS}`;

const DEFAULT_ROOT_DIR = RNFS.DocumentDirectoryPath;

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
                common.toast('Unable to import character: write permission is denied.');

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

            await this._initCharacterState(character, result.name);
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
            let writePermission = await permission.askForWrite();

            if (!writePermission) {
                common.toast('Unable to list characters: read permission is denied.');

                return [];
            }

            path = await this._getPath(DEFAULT_CHARACTER_DIR);
            characters = await RNFS.readDir(path);

            characters = characters.sort((a, b) => a.name < b.name);
        } catch (error) {
            Alert.alert(error.message);
        }

        return characters.map(c => {
            return c.name;
        });
    }

    async loadCharacter(characterName, startLoad, endLoad) {
        let character = null;

        try {
            startLoad();

            let writePermission = await permission.askForWrite();

            if (!writePermission) {
                common.toast('Unable to load character: write permission is denied.');

                return;
            }

            let path = await this._getPath(DEFAULT_CHARACTER_DIR);
            let canonicalFromName = `${path}/${characterName}`;
            let canonicalToName = `${path}/tmp`;

            await unzip(canonicalFromName, canonicalToName);

            character = await RNFS.readFile(`${canonicalToName}/${characterName.slice(0, -5)}.${EXT_JSON}`);

            await RNFS.unlink(canonicalToName);

            return JSON.parse(character);
        } catch (error) {
            common.toast(error.message)
        } finally {
            endLoad(character);
        }
    }

    async saveCharacter(character, filename) {
        try {
            let writePermission = await permission.askForWrite();

            if (!writePermission) {
                common.toast('Unable to save character: write permission is denied.');

                return;
            }

            await this._getPath(DEFAULT_CHARACTER_DIR);
            await this._saveCharacter(character, filename);

            return true;
        } catch (error) {
            Alert.alert(error.message);
        }

        return false;
    }

    async deleteCharacter(filename) {
        try {
            let writePermission = await permission.askForWrite();

            if (!writePermission) {
                common.toast('Unable to delete character: write permission is denied.');

                return;
            }

            let path = await this._getPath(DEFAULT_CHARACTER_DIR);

            await RNFS.unlink(`${path}/${filename}`);
        } catch (error) {
            Alert.alert(error.message)
        }
    }

    async _read(uri, startLoad, endLoad, isHdc = false) {
        let character = null;

        try {
            startLoad();

            let filePath = uri.startsWith('file://') ? uri.substring(7) : uri;

            if (Platform.OS === 'ios' && !common.isIPad() && /\/org\.diceless\.herogmtools-Inbox/.test(filePath) === false) {
                let arr = uri.split('/');
                const dirs = RNFS.dirs;
                filePath = `${dirs.DocumentDir}/${arr[arr.length - 1]}`;
            }

            let data = await RNFS.readFile(decodeURI(filePath), 'base64');
            let rawXml = this._decode(data);

            if (isHdc) {
                character = await this._loadHdcCharacter(rawXml);

                this._savePortrait(character);
            } else {
                character = await this._loadXmlExportCharacter(rawXml);
            }
        } catch (error) {
            Alert.alert('Read Error: ' + error.message);
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

            if (character.hasOwnProperty('image')) {
                this._savePortrait(character);

                delete character.image;
            }

            character = heroDesignerCharacter.getCharacter(character);

            common.toast('Character successfully loaded');
        } catch (error) {
            common.toast(error.message);
        }

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
        } else if (isBase64(value)) {
            return value;
        }

        return value.replace(/\r\n\t\t\t\t/gi, '').replace(/\r\n/gi, '\n');
    }

    async _saveCharacter(character, filename) {
        let characterPath = await this._getFileName(filename, DEFAULT_CHARACTER_DIR);
        let exists = await RNFS.exists(characterPath);

        // https://github.com/itinance/react-native-fs/issues/869
        if (exists) {
            await RNFS.unlink(characterPath);
        }

        let zipPath = await this._getFileName(filename, DEFAULT_CHARACTER_DIR, EXT_CHARACTER);

        await RNFS.writeFile(characterPath, JSON.stringify(character));
        await zip([characterPath], zipPath);
        await RNFS.unlink(characterPath);
    }

    _savePortrait(character) {
        if (!character.hasOwnProperty('image')) {
            return;
        }

        let extensionParts = character.image.fileName.split('.');
        let extension = extensionParts[extensionParts.length - 1];

        character.portrait = `data:image/${extension};base64,${character.image._}`;

        delete character.image;
    }

    async _initCharacterState(character, filename) {
        let hsmFilename = `${filename.slice(0, -4)}.hsmc`;
        let path = await this._getPath(DEFAULT_CHARACTER_DIR);
        let exists = await RNFS.exists(`${path}/${hsmFilename}`);

        character.filename = hsmFilename;

        if (exists) {
            let oldCharacter = await this.loadCharacter(hsmFilename, () => {}, () => {});

            character.showSecondary = oldCharacter.showSecondary;
            character.notes = oldCharacter.notes;

            combatDetails.sync(character, oldCharacter);
        } else {
            character.showSecondary = true;
            character.notes = '';
            character.combatDetails = combatDetails.init(character);
        }
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
                throw `Unknown path: ${path}`;
            }
        }

        await this._makeSaveLocation(path);

        return path;
    }

    async _makeSaveLocation(location) {
        try {
            const exists =  await RNFS.exists(location);

            if (!exists) {
                await RNFS.mkdir(location);
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
