import { common } from './Common';
import { heroDesignerTemplate } from './HeroDesignerTemplate';
import { SKILL_ROLL_BASE } from '../decorators/skills/Roll';

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
    'disadvantages': 'disad'
};

const FIGURED_CHARACTERISTCS = ['PD', 'ED', 'SPD', 'REC', 'END', 'STUN'];

class HeroDesignerCharacter {
    getCharacter(heroDesignerCharacter) {
        const template = heroDesignerTemplate.getTemplate(heroDesignerCharacter.template);

        let character = {
            version: heroDesignerCharacter.version,
            template: template.baseTemplateName,
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
            portrait: null
        };

        this._normalizeCharacterData(heroDesignerCharacter);
        this._normalizeTemplateData(template);

        this._populateMovementAndCharacteristics(character, heroDesignerCharacter.characteristics, template);
        this._populateTrait(character, template, heroDesignerCharacter.skills, 'skills', 'skill', 'skills');
        this._populateTrait(character, template, heroDesignerCharacter.perks, 'perks', 'perk', 'perks');
        this._populateTrait(character, template, heroDesignerCharacter.talents, 'talents', 'talent', 'talents');
        this._populateTrait(character, template, heroDesignerCharacter.martialarts, 'martialArts', 'maneuver', 'maneuver');
        this._populateTrait(character, template, heroDesignerCharacter.powers, 'powers', 'power', 'powers');
        this._populateTrait(character, template, heroDesignerCharacter.disadvantages, 'disadvantages', 'disad', 'disadvantages');
        this._populateTrait(character, template, heroDesignerCharacter.equipment, 'equipment', 'powers', 'power');

        if (heroDesignerCharacter.hasOwnProperty('portrait')) {
            character.portrait = heroDesignerCharacter.portrait;
        }

        return character;
    }

    isFifth(character) {
        if (character !== null && Array.isArray(character.characteristics) && character.characteristics[0].definition.startsWith('(Hero System Fifth Edition')) {
            return true;
        }

        return false;
    }

    isCharacteristic(item) {
        return Object.keys(CHARACTERISTIC_NAMES).includes(item.xmlid.toLowerCase());
    }

    isPowerFrameworkItem(item, character, type) {
        if (item.hasOwnProperty('parentid') && character.powers.length > 0) {
            let powersMap = common.toMap(character.powers, 'id');

            if (powersMap.has(item.parentid)) {
                return powersMap.get(item.parentid).originalType === type;
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

    getTotalDefense(character, type, withResistant=true) {
        if (type === null || type === undefined) {
            return withResistant ? '0/0' : '0';
        }

        let nonResistant = this.getCharacteristicTotal(type, character);
        let resistant = 0;

        if (!withResistant) {
            return nonResistant.toString();
        }

        let powersMap = common.toMap(common.flatten(character.powers, 'powers'));
        let characteristic = this.getCharacteristicByShortName(type, character);
        let showSecondary = character.showSecondary;

        if (powersMap.has('ARMOR')) {
            resistant = this._getTotalArmorDefenseIncrease(characteristic.shortName.toUpperCase(), powersMap.get('ARMOR'), resistant, showSecondary);
        }

        if (powersMap.has('FORCEFIELD')) {
            resistant = this._getTotalResistantDefensesIncrease(characteristic.shortName.toUpperCase(), powersMap.get('FORCEFIELD'), resistant, showSecondary);
        }

        if (powersMap.has(type.toUpperCase())) {
            resistant = this._getResistantDefense(resistant, powersMap.get(type.toUpperCase()), character, showSecondary);
        }

        if (powersMap.has('COMPOUNDPOWER')) {
            resistant = this._getDefenseFromCompoundPower(resistant, powersMap.get('COMPOUNDPOWER'), type.toUpperCase(), true, showSecondary);
        }

        if (powersMap.has('NAKEDMODIFIER')) {
            resistant = this._getDefenseFromCompoundPower(resistant, powersMap.get('NAKEDMODIFIER'), type.toUpperCase(), true, showSecondary);
        }

        return `${nonResistant}/${resistant}`;
    }

    getTotalUnusualDefense(character, powerXmlId, withResistant=true) {
        let nonResistant = 0;
        let resistant = 0;
        let powersMap = common.toMap(common.flatten(character.powers, 'powers'));
        let unusualDefense = null;
        let showSecondary = character.showSecondary;

        if (powersMap.has(powerXmlId)) {
            unusualDefense = powersMap.get(powerXmlId);

            if (Array.isArray(unusualDefense)) {
                for (let ud of unusualDefense) {
                    nonResistant += ud.levels;

                    if (this._isResistent(ud)) {
                        resistant += ud.levels;
                    }
                }
            } else {
                nonResistant = unusualDefense.levels;

                if (this._isResistent(unusualDefense)) {
                    resistant = unusualDefense.levels;
                }
            }
        }

        if (powersMap.has('FORCEFIELD')) {
            nonResistant += powersMap.get('FORCEFIELD').mdlevels || 0;
            resistant += powersMap.get('FORCEFIELD').mdlevels || 0;
        }

        if (powersMap.has('COMPOUNDPOWER')) {
            nonResistant = this._getDefenseFromCompoundPower(nonResistant, powersMap.get('COMPOUNDPOWER'), powerXmlId, false, showSecondary);
            resistant = this._getDefenseFromCompoundPower(resistant, powersMap.get('COMPOUNDPOWER'), powerXmlId, true, showSecondary);
        }

        return `${nonResistant}/${resistant}`;
    }

    getCharacteristicByShortName(shortName, character) {
        let characteristic = null;

        for (let char of character.characteristics) {
            if (char.shortName.toUpperCase() === shortName.toUpperCase()) {
                characteristic = char;
                break;
            }
        }

        return characteristic;
    }

    getCharacteristicBaseValue(shortName, character) {
        let characteristic = this.getCharacteristicByShortName(shortName, character);

        return characteristic === null ? 0 : characteristic.value;
    }

    getAdditionalCharacteristicPoints(shortName, character) {
        let characteristic = this.getCharacteristicByShortName(shortName, character);
        let total = this.getCharacteristicTotal(shortName, character);

        return total - characteristic.value;
    }

    getCharacteristicTotal(shortName, character) {
        let characteristic = null;
        let powersMap = common.toMap(common.flatten(character.powers, 'powers'));

        for (let characteristic of character.characteristics) {
            if (shortName.toUpperCase() === characteristic.shortName.toUpperCase()) {
                return this._getCharacteristicTotal(characteristic, powersMap, character.showSecondary, character);
            }
        }

        return 0;
    }

    getRollTotal(characteristic, character) {
        if (characteristic.roll) {
            let powersMap = common.toMap(common.flatten(character.powers, 'powers'));

            return `${Math.round(this._getCharacteristicTotal(characteristic, powersMap, character.showSecondary, character) / 5) + SKILL_ROLL_BASE}-`;
        }

        return null;
    }

    _getCharacteristicTotal(characteristic, powersMap, showSecondary, character) {
        let value = characteristic.value;

        if (powersMap.has(characteristic.shortName.toUpperCase())) {
            value = this._getTotalCharacteristicPoints(powersMap.get(characteristic.shortName.toUpperCase()), value, showSecondary);
        }

        if (powersMap.has('ARMOR')) {
            value = this._getTotalArmorDefenseIncrease(characteristic.shortName.toUpperCase(), powersMap.get('ARMOR'), value, showSecondary);
        }

        if (powersMap.has('DENSITYINCREASE')) {
            value = this._getTotalDensityIncreaseCharacteristcs(characteristic, powersMap.get('DENSITYINCREASE'), value, showSecondary);
        }

        if (powersMap.has('FORCEFIELD')) {
            value = this._getTotalResistantDefensesIncrease(characteristic.shortName.toUpperCase(), powersMap.get('FORCEFIELD'), value, showSecondary);
        }

        if (powersMap.has('COMPOUNDPOWER')) {
            value = this._getTotalCompoundPowerIncrease(characteristic, powersMap.get('COMPOUNDPOWER'), value, showSecondary);
        }

        if (this.isFifth(character)) {
            if (FIGURED_CHARACTERISTCS.includes(characteristic.shortName.toUpperCase())) {
                let total = 0;

                switch(characteristic.shortName.toUpperCase()) {
                    case 'PD':
                        total = common.roundInPlayersFavor(this.getAdditionalCharacteristicPoints('STR', character) / 5);
                        value += total;
                        break;
                    case 'ED':
                        total = common.roundInPlayersFavor(this.getAdditionalCharacteristicPoints('CON', character) / 5);
                        value += total;
                        break;
                    case 'SPD':
                        total = this.getAdditionalCharacteristicPoints('DEX', character) / 10;
                        value += Math.floor(total);
                        break;
                    case 'REC':
                        total = common.roundInPlayersFavor(this.getAdditionalCharacteristicPoints('STR', character) / 5);
                        total += common.roundInPlayersFavor(this.getAdditionalCharacteristicPoints('CON', character) / 5);
                        value += total;
                        break;
                    case 'END':
                        total = this.getAdditionalCharacteristicPoints('CON', character) * 2;
                        value += total;
                        break;
                    case 'STUN':
                        total = this.getAdditionalCharacteristicPoints('BODY', character);
                        total += this.getAdditionalCharacteristicPoints('STR', character) / 2;
                        total += this.getAdditionalCharacteristicPoints('CON', character) / 2;
                        value += total;
                        break;
                }
            }
        }

        return Math.round(value);
    }

    _getTotalCharacteristicPoints(characteristic, value, showSecondary) {
        if (Array.isArray(characteristic)) {
            for (let char of characteristic) {
                value += this._getTotalCharacteristicPoints(char, value, showSecondary)
            }
        } else {
            if ((characteristic.affectsPrimary && characteristic.affectsTotal) ||
                (!characteristic.affectsPrimary && characteristic.affectsTotal && showSecondary)) {
                value += characteristic.levels;
            }
        }

        return value;
    }

    _getTotalDensityIncreaseCharacteristcs(characteristic, densityIncrease, value, showSecondary) {
        if (Array.isArray(densityIncrease)) {
            for (let di of densityIncrease) {
                value += this._getTotalDensityIncreaseCharacteristcs(characteristic, di, value, showSecondary);
            }
        } else {
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

        return value;
    }

    _getTotalArmorDefenseIncrease(type, resistantDefence, value, showSecondary) {
        if (Array.isArray(resistantDefence)) {
            for (let rd of resistantDefence) {
                value += this._getTotalArmorDefenseIncrease(type, rd, value, showSecondary);
            }
        } else {
            if ((resistantDefence.affectsPrimary && resistantDefence.affectsTotal) ||
                 (!resistantDefence.affectsPrimary && resistantDefence.affectsTotal && showSecondary)) {
                switch (type.toUpperCase()) {
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

    _getTotalResistantDefensesIncrease(type, resistantDefence, value, showSecondary) {
        if (Array.isArray(resistantDefence)) {
            for (let rd of resistantDefence) {
                value = this._getTotalResistantDefensesIncrease(type, rd, value, showSecondary);
            }
        } else {
            if ((resistantDefence.affectsPrimary && resistantDefence.affectsTotal) ||
                 (!resistantDefence.affectsPrimary && resistantDefence.affectsTotal && showSecondary)) {
                switch (type.toUpperCase()) {
                    case 'PD':
                        value += resistantDefence.pdlevels;
                        break;
                    case 'ED':
                        value += resistantDefence.edlevels;
                        break;
                    case 'MD':
                        value += resistantDefence.mdlevels;
                        break;
                    case 'PwD':
                        value += resistantDefence.powdlevels;
                        break;
                    default:
                         // Do nothing
                }
            }
        }

        return value;
    }

    _getTotalCompoundPowerIncrease(characteristic, power, value, showSecondary) {
        if (Array.isArray(power)) {
            for (let p of power) {
                value = this._getTotalCompoundPowerIncrease(characteristic, p, value, showSecondary);
            }
        } else {
            if (Array.isArray(power.powers)) {
                for (let cp of power.powers) {
                    if (cp.xmlid.toUpperCase() === characteristic.shortName.toUpperCase()) {
                        if ((cp.affectsPrimary && cp.affectsTotal) || (!cp.affectsPrimary && cp.affectsTotal && showSecondary)) {
                            value += cp.levels;
                        }
                    } else if (cp.xmlid.toUpperCase() === 'FORCEFIELD') {
                        value = this._getTotalResistantDefensesIncrease(characteristic.shortName.toUpperCase(), cp, value, showSecondary);
                    } else if (cp.xmlid.toUpperCase() === 'DENSITYINCREASE') {
                        value = this._getTotalDensityIncreaseCharacteristcs(characteristic, cp, value, showSecondary);
                    } else if (cp.xmlid.toUpperCase() === 'ARMOR') {
                        value = this._getTotalArmorDefenseIncrease(characteristic.shortName.toUpperCase(), cp, value, showSecondary);
                    }
                }
            } else {
                if (power.xmlid.toUpperCase() === characteristic.shortName.toUpperCase()) {
                    if ((power.affectsPrimary && power.affectsTotal) || (!power.affectsPrimary && power.affectsTotal && showSecondary)) {
                        value += power.levels;
                    }
                } else if (power.xmlid.toUpperCase() === 'FORCEFIELD') {
                    value = this._getTotalResistantDefensesIncrease(characteristic.shortName.toUpperCase(), power, value, showSecondary);
                } else if (power.xmlid.toUpperCase() === 'DENSITYINCREASE') {
                    value = this._getTotalDensityIncreaseCharacteristcs(characteristic, power, value, showSecondary);
                } else if (power.xmlid.toUpperCase() === 'ARMOR') {
                    value = this._getTotalArmorDefenseIncrease(characteristic.shortName.toUpperCase(), power, value, showSecondary);
                }
            }
        }

        return value;
    }

    _getDefenseFromCompoundPower(value, power, id, resistant, showSecondary) {
        if (Array.isArray(power)) {
            for (let p of power) {
                value = this._getDefenseFromCompoundPower(value, p, id, resistant, showSecondary);
            }
        } else {
            if (Array.isArray(power.powers)) {
                for (let cp of power.powers) {
                    value = this._getDefense(cp, id, value, resistant, showSecondary);
                }
            } else {
                value = this._getDefense(power, id, value, resistant, showSecondary);
            }
        }

        return value;
    }

    _getDefense(power, id, value, resistant, showSecondary) {
        if (power.xmlid.toUpperCase() === id.toUpperCase()) {
            if ((power.affectsPrimary && power.affectsTotal) || (!power.affectsPrimary && power.affectsTotal && showSecondary)) {
                if (!resistant || (resistant && this._isResistent(power))) {
                    value += power.levels;
                }
            }
        } else if (power.xmlid.toUpperCase() === 'FORCEFIELD' || power.xmlid.toUpperCase() === 'ARMOR') {
            if ((power.affectsPrimary && power.affectsTotal) || (!power.affectsPrimary && power.affectsTotal && showSecondary)) {
                if (id.toUpperCase() === 'PD' || id.toUpperCase() === 'ED') {
                    value += power[`${id.toLowerCase()}levels`];
                } else if (id.toUpperCase() === 'MENTALDEFENSE') {
                    value += power.mdlevels || 0;
                } else if (id.toUpperCase() === 'POWERDEFENSE') {
                    value += power.powdlevels || 0;
                }
            }
        } else if (power.xmlid.toUpperCase() === 'NAKEDMODIFIER') {
            if (power.input !== null && power.input !== undefined && power.input.toUpperCase() === id.toUpperCase()) {
                if ((power.affectsPrimary && power.affectsTotal) || (!power.affectsPrimary && power.affectsTotal && showSecondary)) {
                    if (!resistant || (resistant && this._isResistent(power))) {
                        value += power.levels;
                    }
                }
            }
        }

        return value;
    }

    _getResistantDefense(resistant, power, character, showSecondary) {
        if (Array.isArray(power)) {
            for (let p of power) {
                resistant = this._getResistantDefense(resistant, p, character, showSecondary);
            }
        } else {
            if ((power.affectsPrimary && power.affectsTotal) || (!power.affectsPrimary && power.affectsTotal && showSecondary)) {
                if (this._isResistent(power)) {
                    if (this.isCharacteristic(power) && power.levels === 0) {
                        resistant += this.getCharacteristicTotal(power.xmlid, character);
                    } else {
                        resistant += power.levels;
                    }
                }
            }
        }

        return resistant;
    }

    _isResistent(power) {
        if (power.xmlid.toUpperCase() === 'FORCEFIELD' || power.xmlid.toUpperCase() === 'ARMOR') {
            return true;
        }

        if (power.hasOwnProperty('modifier')) {
            if (Array.isArray(power.modifier)) {
                for (let m of power.modifier) {
                    if (m.xmlid.toUpperCase() === 'RESISTANT') {
                        return true;
                    }
                }
            } else {
                return power.modifier.xmlid === 'RESISTANT';
            }
        }

        return false;
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
            let { definition, roll, value, cost, base } = this._getCharacteristicFields(characteristic, templateCharacteristic, character);

            if (base === 10 && name.toLowerCase() !== 'body') {
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
                base: base,
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

    _getCharacteristicFields(characteristic, templateCharacteristic, character) {
        if (templateCharacteristic.definition !== null && templateCharacteristic.definition.startsWith('(Hero System Fifth Edition')) {
            return this._updateCharacteristic(characteristic, templateCharacteristic, character);
        }

        return {
            definition: templateCharacteristic.definition,
            roll: false,
            value: characteristic.levels + templateCharacteristic.base,
            cost: Math.round(characteristic.levels / templateCharacteristic.lvlval * templateCharacteristic.lvlcost),
            base: templateCharacteristic.base,
        };
    }

    _updateCharacteristic(characteristic, templateCharacteristic, character) {
        let bonus = 0;
        let value = characteristic.levels + templateCharacteristic.base;
        let cost = Math.round(characteristic.levels / templateCharacteristic.lvlval * templateCharacteristic.lvlcost);
        let base = templateCharacteristic.base;

        switch(characteristic.alias.toUpperCase()) {
            case 'PD':
                bonus = common.roundInPlayersFavor(this.getCharacteristicBaseValue('STR', character) / 5);
                value += bonus;
                base += bonus;
                break;
            case 'ED':
                bonus = common.roundInPlayersFavor(this.getCharacteristicBaseValue('CON', character) / 5);
                value += bonus;
                base += bonus;
                break;
            case 'SPD':
                bonus = 1 + this.getCharacteristicBaseValue('DEX', character) / 10;
                value += Math.floor(bonus) - 1;
                base = bonus;
                cost = value * 10 - bonus * 10;
                break;
            case 'REC':
                bonus = common.roundInPlayersFavor(this.getCharacteristicBaseValue('STR', character) / 5);
                bonus += common.roundInPlayersFavor(this.getCharacteristicBaseValue('CON', character) / 5);
                value += bonus;
                base += bonus;
                break;
            case 'END':
                bonus = this.getCharacteristicBaseValue('CON', character) * 2;
                value += bonus;
                base += bonus;
                break;
            case 'STUN':
                bonus = this.getCharacteristicBaseValue('BODY', character);
                bonus += this.getCharacteristicBaseValue('STR', character) / 2;
                bonus += this.getCharacteristicBaseValue('CON', character) / 2;
                value += Math.round(bonus);
                base += Math.round(bonus);
                break;
            case 'LEAPING':
                bonus = this.getCharacteristicBaseValue('STR', character) / 5;
                let fractionalPart = parseFloat((bonus % 1).toFixed(1));

                if (fractionalPart >= 0.6) {
                    bonus = Math.trunc(bonus) + 0.5;
                } else {
                    bonus = Math.trunc(bonus);
                }

                value += bonus;
                base += bonus;
                break;
            default:
                // do nothing
        }

        return {
            definition: templateCharacteristic.definition,
            roll: false,
            value: value,
            cost: cost,
            base: base,
        };
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
            if (trait[traitSubKey] === undefined) {
                trait[traitSubKey] = [];
            } else {
                trait[traitSubKey] = [trait[traitSubKey]];
            }
        }

        trait[traitSubKey] = this._getLists(trait, trait[traitSubKey]);

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
            if (Array.isArray(compoundPower.power)) {
                compoundPower.powers = [];

                for (let power of compoundPower.power) {
                    power.originalType = 'power';

                    compoundPower.powers.push(power);
                }
            } else {
                compoundPower.power.originalType = 'power';

                compoundPower.powers = [compoundPower.power];
            }

            delete compoundPower.power;
        } else {
            compoundPower.powers = [];
        }

        const locations = ['skill', 'perk', 'talent'];

        for (let subItemKey of locations) {
            if (compoundPower.hasOwnProperty(subItemKey)) {
                if (Array.isArray(compoundPower[subItemKey])) {
                    for (let power of compoundPower[subItemKey]) {
                        power.originalType = subItemKey;

                        compoundPower.powers.push(power);
                    }
                } else {
                    compoundPower[subItemKey].originalType = subItemKey;

                    compoundPower.powers.push(compoundPower[subItemKey]);
                }

                delete compoundPower[subItemKey];
            }
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


        for (let power of compoundPower.powers) {
            templateTrait = this._getTemplateTrait(power, template, traitKey, traitSubKey);

            this._addModifierTemplate(power.modifier, template);

            power.type = traitSubKey;
            power.template = templateTrait;
            power.parentid = compoundPower.id;
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

        if (heroDesignerCharacter[listKey].hasOwnProperty(subListKey)) {
            if (!Array.isArray(heroDesignerCharacter[listKey][subListKey])) {
                let subListItem = heroDesignerCharacter[listKey][subListKey];

                heroDesignerCharacter[listKey][subListKey] = [subListItem];
            }
        } else {
            heroDesignerCharacter[listKey][subListKey] = [];
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

    _getLists(data, list) {
        if (data.hasOwnProperty('list')) {
            if (Array.isArray(data.list)) {
                list = list.concat(data.list);
            } else {
                list.push(data.list);
            }
        }

        return list;
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
}

export let heroDesignerCharacter = new HeroDesignerCharacter();
