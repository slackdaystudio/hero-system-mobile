import { Platform, PermissionsAndroid, Alert } from 'react-native';
import RNFetchBlob from 'rn-fetch-blob';
import { common } from './Common';
import { heroDesignerTemplate } from './HeroDesignerTemplate';
import { SKILL_ROLL_BASE } from '../decorators/skills/Roll';
import { store } from '../../App';

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

export const TYPE_CHARACTERISTIC = 1;

export const TYPE_MOVEMENT = 2;

export const GENERIC_OBJECT =  'GENERIC_OBJECT';

export const TYPE_ADVANTAGES = 0;

export const TYPE_LIMITATIONS = 1;

export const SKILL_ENHANCERS = [
    'SCIENTIST',
    'JACK_OF_ALL_TRADES',
    'LINGUIST',
    'SCHOLAR',
    'TRAVELER',
    'WELL_CONNECTED',
];

const MISSING_CHARACTERISTIC_DESCRIPTIONS = {
    'ocv': 'Offensive Combat Value represents a character’s general accuracy in combat.',
    'dcv': 'Defensive Combat Value represents how difficult it is to hit a character in combat.',
    'omcv': 'Offensive Mental Combat Value represents a character’s general accuracy in Mental Combat.',
    'dmcv': 'Defensive Mental Combat Value represents how difficult it is to hit a character in Mental Combat.',
};

const CHARACTERISTIC_NAMES = {
    'str': 'Strength',
    'dex': 'Dexterity',
    'con': 'Constitution',
    'int': 'Intelligence',
    'ego': 'Ego',
    'pre': 'Presence',
    'com': 'Comeliness',
    'ocv': 'OCV',
    'dcv': 'DCV',
    'omcv': 'OMCV',
    'dmcv': 'DMCV',
    'spd': 'Speed',
    'pd': 'PD',
    'ed': 'ED',
    'rec': 'Recovery',
    'end': 'Endurance',
    'body': 'Body',
    'stun': 'Stun',
    'custom1': 'Custom1',
    'custom2': 'Custom2',
    'custom3': 'Custom3',
    'custom4': 'Custom4',
    'custom5': 'Custom5',
    'custom6': 'Custom6',
    'custom7': 'Custom7',
    'custom8': 'Custom8',
    'custom9': 'Custom9',
    'custom10': 'Custom10',
};

const BASE_MOVEMENT_MODES = {
    'running': 'Running',
    'swimming': 'Swimming',
    'leaping': 'Leaping',
};

const CHARACTER_TRAITS = {
    'skills': 'skill',
    'perks': 'perk',
    'talents': 'talent',
    'martialArts': 'maneuver',
    'powers': 'power',
    'equipment': 'powers',
};

class HeroDesignerCharacter {
    getCharacter(heroDesignerCharacter) {
        const template = heroDesignerTemplate.getTemplate(heroDesignerCharacter.template);

        let character = {
            version: heroDesignerCharacter.version,
            characterInfo: heroDesignerCharacter.characterInfo,
            characteristics: [],
            movement: [],
            skills: [],
            perks: [],
            talents: [],
            martialArts: [],
            powers: [],
            equipment: [],
            disadvantages: [],
        };

        this._normalizeCharacterData(heroDesignerCharacter);
        this._normalizeTemplateData(template);

        this._populateMovementAndCharacteristics(character, heroDesignerCharacter.characteristics, template);
        this._populateTrait(character, template, heroDesignerCharacter.skills, 'skills', 'skill', 'skills');
        this._populateTrait(character, template, heroDesignerCharacter.perks, 'perks', 'perk', 'perks');
        this._populateTrait(character, template, heroDesignerCharacter.talents, 'talents', 'talent', 'talents');
        this._populateTrait(character, template, heroDesignerCharacter.martialarts, 'martialArts', 'maneuver', 'maneuver');
        this._populateTrait(character, template, heroDesignerCharacter.powers, 'powers', 'power', 'powers');
        this._populateTrait(character, template, heroDesignerCharacter.disadvantages, 'disadvantages', 'disad', 'disad');
        this._populateTrait(character, template, heroDesignerCharacter.equipment, 'equipment', 'powers', 'power');

        // if (__DEV__) {
        //     this._askForWritePermission().then(writePermissionGranted => {
        //         if (writePermissionGranted) {
        //             RNFetchBlob.fs.writeFile(RNFetchBlob.fs.dirs.DownloadDir + '/test.json', JSON.stringify(character));
        //             RNFetchBlob.fs.writeFile(RNFetchBlob.fs.dirs.DownloadDir + '/template.json', JSON.stringify(template));
        //         }
        //     }).catch(error => {
        //         common.toast(error.message);
        //     });
        // }

        return character;
    }

    isCharacteristic(item) {
        return Object.keys(CHARACTERISTIC_NAMES).includes(item.xmlid.toLowerCase());
    }

    isMultipowerItem(item, character) {
        if (item.hasOwnProperty('parentid') && character.powers.length > 0) {
            let powersMap = common.toMap(character.powers, 'id');

            if (powersMap.has(item.parentid)) {
                return powersMap.get(item.parentid).originalType === 'multipower';
            }
        }

        return false;
    }

    getCharacteristicFullName(abbreviation) {
        abbreviation = abbreviation.toLowerCase();

        return CHARACTERISTIC_NAMES.hasOwnProperty(abbreviation) ? CHARACTERISTIC_NAMES[abbreviation] : '';
    }

    hasSecondaryCharacteristics(powers) {
        for (let power of powers) {
            if (!power.affectsPrimary && power.affectsTotal) {
                return true;
            }
        }

        return false;
    }

    getCharacteristicTotalByShortName(shortName, character) {
        let characteristic = null;
        let powersMap = common.toMap(common.flatten(character.powers, 'powers'));

        for (let characteristic of character.characteristics) {
            if (shortName.toUpperCase() === characteristic.shortName.toUpperCase()) {
                return this.getCharacteristicTotal(characteristic, powersMap);
            }
        }

        return 0;
    }

    getCharacteristicTotal(characteristic, powersMap) {
        let value = characteristic.value;
        let showSecondary = store.getState().character.showSecondary;

        if (powersMap.has(characteristic.shortName.toUpperCase())) {
            let char = powersMap.get(characteristic.shortName.toUpperCase());

            if ((char.affectsPrimary && char.affectsTotal) || (!char.affectsPrimary && char.affectsTotal && showSecondary)) {
                value += char.levels;
            }
        }

        if (powersMap.has('DENSITYINCREASE')) {
            let densityIncrease = powersMap.get('DENSITYINCREASE');

            if ((densityIncrease.affectsPrimary && densityIncrease.affectsTotal) ||
                 (!densityIncrease.affectsPrimary && densityIncrease.affectsTotal && showSecondary)) {
                switch (characteristic.shortName.toUpperCase()) {
                    case 'STR':
                        value += densityIncrease.levels * 5;
                        break;
                    case 'PD':
                    case 'ED':
                        value += densityIncrease.levels;
                        break;
                    default:
                         // Do nothing
                }
            }
        }

        if (powersMap.has('FORCEFIELD')) {
            let resistantDefence = powersMap.get('FORCEFIELD');

            if ((resistantDefence.affectsPrimary && resistantDefence.affectsTotal) ||
                 (!resistantDefence.affectsPrimary && resistantDefence.affectsTotal && showSecondary)) {
                switch (characteristic.shortName.toUpperCase()) {
                    case 'PD':
                        value += resistantDefence.pdlevels;
                        break;
                    case 'ED':
                        value += resistantDefence.edlevels;
                        break;
                    default:
                         // Do nothing
                }
            }
        }

        return value;
    }

    getRollTotal(characteristic, powersMap) {
        if (characteristic.roll) {
            return `${Math.round(this.getCharacteristicTotal(characteristic, powersMap) / 5) + SKILL_ROLL_BASE}-`;
        }

        return null;
    }

    _populateMovementAndCharacteristics(character, characteristics, template) {
        let templateCharacteristic = null;
        let formattedCharacteristic = null;
        let type = null;
        let name = null;
        let definition = null;
        let value = 0;
        let cost = 0;
        let roll = null;

        for (let [key, characteristic] of Object.entries(characteristics)) {
            type = CHARACTERISTIC_NAMES.hasOwnProperty(key.toLowerCase()) ? TYPE_CHARACTERISTIC : TYPE_MOVEMENT;
            templateCharacteristic = template.characteristics[key.toLowerCase()];
            name = type === TYPE_CHARACTERISTIC ? CHARACTERISTIC_NAMES[key.toLowerCase()] : BASE_MOVEMENT_MODES[key.toLowerCase()];
            definition = templateCharacteristic.definition;
            roll = false;

            if (templateCharacteristic.lvlval > 1) {
                value = characteristic.levels + templateCharacteristic.base;
                cost = Math.round((value - templateCharacteristic.base) / templateCharacteristic.lvlval);
            } else {
                value = characteristic.levels * templateCharacteristic.lvlval + templateCharacteristic.base;
                cost = templateCharacteristic.lvlcost * characteristic.levels;
            }

            if (templateCharacteristic.base === 10 && name.toLowerCase() !== 'body') {
                roll = true;
            }

            if (definition === null && Object.keys(MISSING_CHARACTERISTIC_DESCRIPTIONS).includes(key.toLowerCase())) {
                definition = MISSING_CHARACTERISTIC_DESCRIPTIONS[key.toLowerCase()];
            }

            formattedCharacteristic = {
                type: type,
                name: name,
                shortName: characteristic.alias,
                value: value,
                cost: cost,
                base: templateCharacteristic.base,
                definition: definition,
                roll: roll,
                ncm: null,
            };

            if (type === TYPE_MOVEMENT) {
                formattedCharacteristic.ncm = this._getCharacteristicNcm(templateCharacteristic);

                character.movement.push(formattedCharacteristic);
            } else {
                character.characteristics.push(formattedCharacteristic);
            }
        }
    }

    _getCharacteristicNcm(templateCharacteristic) {
        if (Array.isArray(templateCharacteristic.adder)) {
            let adder = templateCharacteristic.adder.filter(adder => adder.xmlid === 'IMPROVEDNONCOMBAT')[0];

            return adder.lvlval * adder.lvlmultiplier;
        }

        return templateCharacteristic.adder.lvlval * templateCharacteristic.adder.lvlmultiplier;
    }

    _populateTrait(character, template, trait, traitKey, traitSubKey, characterSubTrait) {
        if (trait === null) {
            return;
        } else if (!Array.isArray(trait[traitSubKey])) {
            trait[traitSubKey] = [trait[traitSubKey]];
        }

        trait[traitSubKey] = trait[traitSubKey].concat(this._getLists(trait));

        for (let skillEnhancer of SKILL_ENHANCERS) {
            if (trait.hasOwnProperty(common.toCamelCase(skillEnhancer))) {
                trait[traitSubKey].push(trait[common.toCamelCase(skillEnhancer)]);
            }
        }

        trait[traitSubKey].sort((a, b) => a.position > b.position);

        for (let value of Object.values(trait[traitSubKey])) {
            if (value.xmlid.toUpperCase() === GENERIC_OBJECT || SKILL_ENHANCERS.includes(value.xmlid.toUpperCase())) {
                value.type = 'list';
                value[characterSubTrait] = [];

                if (value.originalType.toUpperCase() === 'VPP') {
                    value.template = this._buildVppTemplate(value, template);
                }

                character[traitKey].push(value);

                continue;
            } else if (value.xmlid.toUpperCase() === 'COMPOUNDPOWER') {
                this._getCompoundPowers(value, template, traitKey, traitSubKey);
            }

            let templateTrait = this._getTemplateTrait(value, template, traitKey, traitSubKey);

            this._addModifierTemplate(value.modifier, template);

            value.type = traitSubKey;
            value.template = templateTrait;

            if (value.hasOwnProperty('parentid')) {
                character[traitKey].filter(t => t.id === value.parentid).shift()[characterSubTrait].push(value);
            } else {
                character[traitKey].push(value);
            }
        }
    }

    _getCompoundPowers(compoundPower, template, traitKey, traitSubKey) {
        let powersMap = common.toMap(template.powers.power);

        if (compoundPower.hasOwnProperty('power')) {
            compoundPower.powers = compoundPower.power;

            delete compoundPower.power;
        } else {
            compoundPower.powers = [];
        }

        for (let [key, value] of Object.entries(compoundPower)) {
            if (key === 'powers' || value === null || value === undefined) {
                continue;
            }

            if (value.constructor === Object) {
                if (powersMap.has(key) || Object.keys(CHARACTERISTIC_NAMES).includes(key)) {
                    compoundPower.powers.push(value);

                    delete compoundPower[key];
                }
            }
        }

        this._getCompoundPower(compoundPower, template, traitKey, traitSubKey);
    }

    _getCompoundPower(compoundPower, template, traitKey, traitSubKey) {
        let templateTrait = null;

        if (Array.isArray(compoundPower.powers)) {
            for (let power of compoundPower.powers) {
                templateTrait = this._getTemplateTrait(power, template, traitKey, traitSubKey);

                this._addModifierTemplate(power.modifier, template);

                power.type = traitSubKey;
                power.template = templateTrait;
                power.parentid = compoundPower.id;
            }
        } else {
            templateTrait = this._getTemplateTrait(compoundPower.powers, template, traitKey, traitSubKey);

            this._addModifierTemplate(compoundPower.powers.modifier, template);

            compoundPower.powers.type = traitSubKey;
            compoundPower.powers.template = templateTrait;
            compoundPower.powers.parentid = compoundPower.id;
        }
    }

    _getTemplateTrait(value, template, traitKey, traitSubKey) {
        let templateTrait = null;

        if (traitKey === 'powers' || traitKey === 'equipment') {
            for (let key of Object.keys(template.characteristics)) {
                if (value.xmlid.toLowerCase() === key.toLowerCase()) {
                    templateTrait = template.characteristics[key];
                    break;
                }
            }

            if (templateTrait === null) {
                for (let [key, subKey] of Object.entries(CHARACTER_TRAITS)) {
                    if (key === 'equipment') {
                        key = 'powers';
                        subKey = 'power';
                    }

                    templateTrait = template[key][subKey].filter(t => {
                        if (t.xmlid.toUpperCase() === GENERIC_OBJECT) {
                            return false;
                        }

                        return t.xmlid.toLowerCase() === value.xmlid.toLowerCase();
                    }).shift();

                    if (templateTrait !== undefined) {
                        break;
                    }
                }
            }
        } else {
            templateTrait = template[traitKey][traitSubKey].filter(t => {
                if (t.xmlid.toUpperCase() === GENERIC_OBJECT) {
                    return false;
                }

                return t.xmlid.toLowerCase() === value.xmlid.toLowerCase();
            }).shift();
        }

        return templateTrait;
    }

    _addModifierTemplate(modifier, template) {
        if (modifier === undefined || modifier === null) {
            return;
        }

        if (Array.isArray(modifier)) {
            for (let mod of modifier) {
                this._addModifierTemplate(mod, template);
            }
        } else {
            for (let mod of template.modifiers.modifier) {
                if (mod.xmlid.toUpperCase() === modifier.xmlid.toUpperCase()) {
                    modifier.template = mod;
                    break;
                }
            }
        }
    }

    _normalizeTemplateData(template) {
        let normalizedEntries;

        for (let [listKey, subListKey] of Object.entries(CHARACTER_TRAITS)) {
            normalizedEntries = [];

            if (listKey === 'powers') {
                this._normalizeTemplatePowers(template);
                continue;
            } if (listKey === 'equipment') {
                continue;
            }

            for (let [key, item] of Object.entries(template[listKey])) {
                if (Array.isArray(item)) {
                    for (let i of item) {
                        this._normalizeTemplateItem(normalizedEntries, key, i);
                    }
                } else {
                    if (!item.hasOwnProperty('xmlid')) {
                        item.xmlid = common.toSnakeCase(key).toUpperCase();
                    }

                    normalizedEntries.push(item);

                    delete template[listKey][key];
                }
            }

            template[listKey][subListKey] = template[listKey][subListKey].concat(normalizedEntries);
        }
    }


    _normalizeTemplateItem(normalizedEntries, key, item) {
        if (Array.isArray(item)) {
            for (let i of item) {
                this._normalizeTemplateItem(normalizedEntries, key, i);
            }
        } else {
            if (!item.hasOwnProperty('xmlid')) {
                if (key === 'maneuver') {
                    item.xmlid = common.toSnakeCase(item.display).toUpperCase();
                } else {
                    item.xmlid = key.toUpperCase();
                }
            }

            normalizedEntries.push(item);
        }
    }

    _normalizeTemplatePowers(template) {
        const blacklisted = ['sensegroup', 'sense']; // For some reason these are listed in powers

        template.senses = {};
        template.powers.power = [];
        template.characteristics.running.xmlid = 'RUNNING';
        template.powers.power.push(template.characteristics.running);
        template.characteristics.swimming.xmlid = 'SWIMMING';
        template.powers.power.push(template.characteristics.swimming);
        template.characteristics.leaping.xmlid = 'LEAPING';
        template.powers.power.push(template.characteristics.leaping);

        for (let [key, power] of Object.entries(template.powers)) {
            if (blacklisted.includes(key)) {
                // template.senses[key] = power;  // Uncomment to generate the senses.json file
                continue;
            }

            if (key !== 'power') {
                this._normalizeTemplatePower(template, key, power);

                delete template.powers[key];
            }
        }
    }

    _normalizeTemplatePower(template, key, power) {
        if (Array.isArray(power)) {
            for (let p of power) {
                this._normalizeTemplatePower(template, key, p);
            }
        } else {
            if (!power.hasOwnProperty('xmlid')) {
                power.xmlid = key.toUpperCase();
            }

            template.powers.power.push(power);
        }
    }

    _normalizeCharacterData(heroDesignerCharacter) {
        for (let [listKey, subListKey] of Object.entries(CHARACTER_TRAITS)) {
            if (listKey === 'powers' || listKey === 'martialArts' || listKey === 'equipment') {
                this._normalizeCharacterItems(heroDesignerCharacter, listKey.toLowerCase(), subListKey);

                continue;
            }

            if (heroDesignerCharacter.hasOwnProperty(listKey.toLowerCase()) && heroDesignerCharacter[listKey] !== null) {
                for (let [key, item] of Object.entries(heroDesignerCharacter[listKey.toLowerCase()])) {
                    this._normalizeCharacterDataItem(heroDesignerCharacter, item, key);
                }
            }
        }
    }

    _normalizeCharacterDataItem(heroDesignerCharacter, item, key) {
        if (Array.isArray(item)) {
            for (let i of item) {
                this._normalizeCharacterDataItem(heroDesignerCharacter, i, key);
            }
        } else {
            if (!item.hasOwnProperty('xmlid')) {
                item.xmlid = common.toSnakeCase(item.display).toUpperCase();
            }

            item.originalType = key;
        }
    }

    _normalizeCharacterItems(heroDesignerCharacter, listKey, subListKey) {
        if (heroDesignerCharacter[listKey] === null || heroDesignerCharacter[listKey] === undefined) {
            return;
        }

        for (let [key, item] of Object.entries(heroDesignerCharacter[listKey])) {
            if (key !== subListKey) {
                this._normalizeCharacterItem(heroDesignerCharacter, item, listKey, subListKey, key);

                delete heroDesignerCharacter[listKey][key];
            } else if (key.toUpperCase() === 'MANEUVER') {
                if (Array.isArray(item)) {
                    for (let i of item) {
                        if (i.xmlid.toUpperCase() === 'MANEUVER') {
                            i.xmlid = common.toSnakeCase(i.display).toUpperCase();
                        }
                    }
                } else {
                    if (item.xmlid.toUpperCase() === 'MANEUVER') {
                        item.xmlid = common.toSnakeCase(item.display).toUpperCase();
                    }
                }
            }
        }
    }

    _normalizeCharacterItem(heroDesignerCharacter, item, listKey, subListKey, originalType) {
        if (Array.isArray(item)) {
            for (let i of item) {
                this._normalizeCharacterItem(heroDesignerCharacter, i, listKey, subListKey, originalType);
            }
        } else {
            item.originalType = originalType;

            if (listKey === 'equipment') {
                if (!heroDesignerCharacter[listKey].hasOwnProperty('powers')) {
                    heroDesignerCharacter[listKey].powers = [];
                }

                heroDesignerCharacter[listKey].powers.push(item);
            } else {
                heroDesignerCharacter[listKey][subListKey].push(item);
            }
        }
    }

    _getLists(data) {
        let lists = [];

        if (data.hasOwnProperty('list')) {
            if (typeof data.list === 'string') {
                lists.push(data.list);
            } else {
                lists = lists.concat(data.list);
            }
        }

        return lists;
    }

    _buildVppTemplate(power, template) {
        let mods = [];
        let adds = [{
            'xmlid': 'CONTROLCOST',
            'basecost': power.adder.baseCost,
            'levels': power.adder.levels,
            'lvlcost': power.adder.lvlcost,
            'lvlval': power.adder.lvlval,
        }];

        for (let modifier of template.modifiers.modifier) {
            if (modifier.hasOwnProperty('type') && modifier.type.toUpperCase() === 'VPP') {
                mods.push(modifier);
            }
        }

        return {
            modifier: mods,
            adder: adds,
        };
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
                        'message': 'HERO System Mobile needs read/write access to your device to save characters',
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

export let heroDesignerCharacter = new HeroDesignerCharacter();
