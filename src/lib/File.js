import {Platform} from 'react-native';
import {errorCodes, keepLocalCopy, pick, types} from '@react-native-documents/picker';
import RNFS from 'react-native-fs';
import xml2js from 'react-native-xml2js';
import {zip, unzip} from 'react-native-zip-archive';
import {isBase64} from 'is-base64';
import {common} from './Common';
import {heroDesignerCharacter} from './HeroDesignerCharacter';
import {character as libCharacter} from './Character';
import {combatDetails} from './CombatDetails';
import {Buffer} from 'buffer';
import iconv from 'iconv-lite';
import sanitize from 'sanitize-filename';

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

const DEFAULT_ROOT_DIR = RNFS.DocumentDirectoryPath;

const DEFAULT_CHARACTER_DIR = `${DEFAULT_ROOT_DIR}/${DIR_CHARACTER}`;

const DEFAULT_SOUND_DIR = `${DEFAULT_ROOT_DIR}/${DIR_SOUNDS}`;

const EXT_HD = 'hdc';

const EXT_CHARACTER = 'hsmc';

const EXT_JSON = 'json';

class File {
    async importCharacter(startLoad, endLoad) {
        let character = null;

        try {
            const [result] = await pick({
                type: [types.allFiles, 'public.item'],
                copyTo: 'cachesDirectory',
            });

            if (result === null) {
                return;
            }

            const [localCopy] = await keepLocalCopy({
                files: [
                    {
                        uri: result.uri,
                        fileName: result.name ?? 'fallbackName',
                    },
                ],
                destination: 'cachesDirectory',
            });

            result.fileCopyUri = Platform.OS === 'ios' ? decodeURIComponent(localCopy.localUri) : localCopy.localUri;

            if (result.name.toLowerCase().endsWith(`.${EXT_HD}`)) {
                const rawXml = await this._getRawXm(localCopy.localUri);
                const parsedXml = await this._loadHdcCharacter(rawXml);

                if (parsedXml.hasOwnProperty('image')) {
                    parsedXml.portrait = this._getDataUri(parsedXml);

                    delete parsedXml.image;
                }

                character = heroDesignerCharacter.getCharacter(parsedXml);

                await this._saveCharacter(character, result.name);
            } else if (result.name.toLowerCase().endsWith(`.${EXT_CHARACTER}`)) {
                character = await this._read(result.name, localCopy.localUri, startLoad, endLoad, EXT_CHARACTER);
            } else {
                common.toast('Unsupported file type: ' + result.type);

                return;
            }

            if (!result.name.toLowerCase().endsWith(`.${EXT_CHARACTER}`)) {
                await this._initCharacterState(character, result.name);
                await this._saveCharacter(character, result.name);
            }

            return character;
        } catch (error) {
            if (error.code !== errorCodes.OPERATION_CANCELED) {
                common.toast(error.message);
            }
        }
    }

    async listCharacters() {
        let path = null;
        let characters = null;
        let charData = null;

        try {
            path = await this._getPath(DEFAULT_CHARACTER_DIR);
            characters = await RNFS.readDir(path);

            // Users may have old XML exported characters in thier dir, filter them out but leave them in place
            charData = await this._filterCharacters(characters);
        } catch (error) {
            console.error(error.message);
        }

        charData.sort((a, b) => a.name > b.name);

        return charData;
    }

    async loadCharacter(characterName, startLoad, endLoad) {
        let character = null;

        try {
            startLoad();

            let path = await this._getPath(DEFAULT_CHARACTER_DIR);
            let canonicalFromName = `${path}/${characterName}`;
            let canonicalToName = `${path}/tmp`;

            await unzip(canonicalFromName, canonicalToName);

            character = await RNFS.readFile(`${canonicalToName}/${characterName.slice(0, -5)}.${EXT_JSON}`);

            await RNFS.unlink(canonicalToName);

            return JSON.parse(character);
        } catch (error) {
            console.error(error.message);
        } finally {
            endLoad(character);
        }
    }

    async saveCharacter(character, filename) {
        try {
            await this._getPath(DEFAULT_CHARACTER_DIR);
            await this._saveCharacter(character, filename);

            return true;
        } catch (error) {
            console.error(error.message);
        }

        return false;
    }

    async deleteCharacter(filename) {
        try {
            let path = await this._getPath(DEFAULT_CHARACTER_DIR);

            await RNFS.unlink(`${path}/${filename}`);
        } catch (error) {
            console.error(error.message);
        }
    }

    async _filterCharacters(characters) {
        let filtered = [];
        let char = null;
        let path = await this._getPath(DEFAULT_CHARACTER_DIR);
        let canonicalToName = null;
        let canonicalFromName = null;

        for (const character of characters) {
            if (!character.name.endsWith('hsmc')) {
                continue;
            }

            canonicalFromName = `${path}/${character.name}`;
            canonicalToName = `${path}/tmp`;

            try {
                await unzip(canonicalFromName, canonicalToName);

                char = await RNFS.readFile(`${canonicalToName}/${character.name.slice(0, -5)}.${EXT_JSON}`);

                char = JSON.parse(char);

                if (libCharacter.isHeroDesignerCharacter(char)) {
                    filtered.push({
                        name: char.characterInfo.characterName ?? char.characterInfo.alternateIdentities ?? character.name ?? 'Unknown',
                        background: char.characterInfo.background,
                        fileName: character.name,
                        portrait: char.portrait,
                    });
                }
            } catch (error) {
                common.toast(`Error: could not process file "${character.name}".  Possibly corrupt.`, 'error', 'HERO System Mobile', 15000);

                canonicalToName = `${path}/corrupt`;

                if (!(await RNFS.exists(canonicalToName))) {
                    RNFS.mkdir(canonicalToName);
                }

                await RNFS.moveFile(canonicalFromName, `${canonicalToName}/${character.name}`);
            }
        }

        if (canonicalToName) {
            await RNFS.unlink(canonicalToName);
        }

        if (filtered.length > 1) {
            filtered.sort((a, b) => a.name.localeCompare(b.name));
        }

        return filtered;
    }

    async _read(name, uri, startLoad, endLoad, type) {
        let character = null;

        try {
            startLoad();

            if (type === EXT_CHARACTER) {
                character = this._importCharacter(name, uri);
            }
        } catch (error) {
            console.error('Read Error: ' + error.message);
        } finally {
            endLoad();
        }

        return character;
    }

    async _getRawXm(uri) {
        let data = await RNFS.readFile(uri, 'base64');

        return this._decode(data);
    }

    async _loadHdcCharacter(rawXml) {
        let parser = new xml2js.Parser({
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

        return new Promise((resolve, reject) => {
            parser.parseString(rawXml, (error, character) => {
                if (error) {
                    return reject(error);
                } else {
                    return resolve(character);
                }
            });
        });
    }

    async _importCharacter(name, filepath) {
        const importPath = await this._getPath(DEFAULT_CHARACTER_DIR);
        const importFilename = `file://${Platform.OS === 'ios' ? importPath : decodeURIComponent(importPath)}/${name}`;
        const exists = await RNFS.exists(importFilename);

        // https://github.com/itinance/react-native-fs/issues/869
        if (exists) {
            await RNFS.unlink(importFilename);
        }

        await RNFS.copyFile(filepath, importFilename);

        return await this.loadCharacter(
            name,
            () => {},
            () => {},
        );
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
        } else if (value === 'true' || value === 'false' || value.toLowerCase() === 'yes' || value.toLowerCase() === 'no') {
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

        character.filename = zipPath.split('/').slice(-1)[0];

        await RNFS.writeFile(characterPath, JSON.stringify(character));
        await zip([characterPath], zipPath);
        await RNFS.unlink(characterPath);

        return characterPath;
    }

    _getDataUri(character) {
        if (!character.hasOwnProperty('image')) {
            return;
        }

        let extensionParts = character.image.fileName.split('.');
        let extension = extensionParts[extensionParts.length - 1];

        return `data:image/${extension};base64,${{...character.image}._.replace(/\r\n|\n|\r/g, '')}`;
    }

    async _initCharacterState(character, filename) {
        let hsmFilename = `${filename.slice(0, -4)}.hsmc`;
        let path = await this._getPath(DEFAULT_CHARACTER_DIR);
        let exists = await RNFS.exists(`${path}/${hsmFilename}`);

        character.filename = hsmFilename;

        if (exists) {
            let oldCharacter = await this.loadCharacter(
                hsmFilename,
                () => {},
                () => {},
            );

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

        if (path === DEFAULT_CHARACTER_DIR) {
            path = DEFAULT_CHARACTER_DIR;
        } else if (path === DEFAULT_SOUND_DIR) {
            path = DEFAULT_SOUND_DIR;
        } else if (path === DEFAULT_ROOT_DIR) {
            path = DEFAULT_ROOT_DIR;
        } else {
            throw `Unknown path: ${path}`;
        }

        await this._makeSaveLocation(path);

        return path;
    }

    async _makeSaveLocation(location) {
        try {
            const exists = await RNFS.exists(location);

            if (!exists) {
                await RNFS.mkdir(location);
            }
        } catch (error) {
            console.error(error.message);
        }
    }

    async _getFileName(filename, directoryName, extension = EXT_JSON) {
        let validExtensions = ['xml', 'hdc'];
        let path = await this._getPath(directoryName);

        if (validExtensions.includes(filename.toLowerCase().slice(-3))) {
            filename = filename.slice(0, -4);
        }

        return `${path}/${sanitize(filename, {replacement: '_'})}.${extension}`;
    }
}

export let file = new File();
