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

import {getTemplate} from 'core/templates';
import {roundInPlayersFavor, toCamelCase, toMap, toSnakeCase} from 'core/util';
import {
    BASE_MOVEMENT_MODES,
    CHARACTER_TRAITS,
    CHARACTERISTIC_NAMES,
    GENERIC_OBJECT,
    MISSING_CHARACTERISTIC_DESCRIPTIONS,
    SKILL_ENHANCERS,
    TYPE_CHARACTERISTIC,
    TYPE_MOVEMENT,
} from './constants';
import type {Character, Characteristic, ParsedCharacter} from './types';

// The character model is a dynamic, XML-derived object graph; the pipeline below
// mutates it in place exactly as the legacy engine does. `Obj` is the working
// view for that manipulation; the public `getCharacter` stays fully typed.
type Obj = Record<string, any>;

const hasOwn = (obj: object, key: string): boolean => Object.prototype.hasOwnProperty.call(obj, key);

/**
 * The HERO Designer character model, ported from legacy
 * `src/lib/HeroDesignerCharacter.js`.
 *
 * `getCharacter` takes a parsed `.hdc` document and produces the normalized
 * character the rest of the app (and the trait decorators) consume: template
 * resolved (via the ported `core/templates`), characteristics/movement split
 * out, every trait category flattened into a typed array and enriched with its
 * matched template entry. Pure and deterministic — no RNG, no side effects.
 */
export class HeroDesignerCharacter {
    getCharacter(parsed: ParsedCharacter): Character {
        const template = getTemplate(parsed.template) as Obj;

        const character: Character = {
            version: parsed.version,
            template: template.baseTemplateName,
            characterInfo: parsed.characterInfo,
            characteristics: [],
            movement: [],
            skills: [],
            perks: [],
            talents: [],
            martialArts: [],
            powers: [],
            equipment: [],
            disadvantages: [],
            portrait: null,
        };

        this.normalizeCharacterData(parsed as Obj);
        this.normalizeTemplateData(template);

        this.populateMovementAndCharacteristics(character, (parsed as Obj).characteristics, template);
        this.populateTrait(character, template, (parsed as Obj).skills, 'skills', 'skill', 'skills');
        this.populateTrait(character, template, (parsed as Obj).perks, 'perks', 'perk', 'perks');
        this.populateTrait(character, template, (parsed as Obj).talents, 'talents', 'talent', 'talents');
        this.populateTrait(character, template, (parsed as Obj).martialarts, 'martialArts', 'maneuver', 'maneuver');
        this.populateTrait(character, template, (parsed as Obj).powers, 'powers', 'power', 'powers');
        this.populateTrait(character, template, (parsed as Obj).disadvantages, 'disadvantages', 'disad', 'disadvantages');
        this.populateTrait(character, template, (parsed as Obj).equipment, 'equipment', 'powers', 'power');

        if (hasOwn(parsed, 'portrait')) {
            character.portrait = parsed.portrait ?? null;
        }

        return character;
    }

    isFifth(character: Obj): boolean {
        return (
            character !== null &&
            Array.isArray(character.characteristics) &&
            character.characteristics[0].definition.startsWith('(Hero System Fifth Edition')
        );
    }

    isCharacteristic(item: Obj): boolean {
        return Object.keys(CHARACTERISTIC_NAMES).includes(item.xmlid.toLowerCase());
    }

    getCharacteristicByShortName(shortName: string, character: Obj): Obj | null {
        let characteristic = null;

        for (const char of character.characteristics) {
            if (char.shortName.toUpperCase() === shortName.toUpperCase()) {
                characteristic = char;
                break;
            }
        }

        return characteristic;
    }

    getCharacteristicBaseValue(shortName: string, character: Obj): number {
        const characteristic = this.getCharacteristicByShortName(shortName, character);

        return characteristic === null ? 0 : characteristic.value;
    }

    private populateMovementAndCharacteristics(character: Obj, characteristics: Obj, template: Obj): void {
        for (const [key, characteristic] of Object.entries(characteristics) as Array<[string, Obj]>) {
            const type = hasOwn(CHARACTERISTIC_NAMES, key.toLowerCase()) ? TYPE_CHARACTERISTIC : TYPE_MOVEMENT;
            const templateCharacteristic = template.characteristics[key.toLowerCase()];
            const name = type === TYPE_CHARACTERISTIC ? CHARACTERISTIC_NAMES[key.toLowerCase()] : BASE_MOVEMENT_MODES[key.toLowerCase()];
            let {definition, roll, value, cost, base} = this.getCharacteristicFields(characteristic, templateCharacteristic, character);

            if (base === 10 && name.toLowerCase() !== 'body') {
                roll = true;
            }

            if (definition === null && Object.keys(MISSING_CHARACTERISTIC_DESCRIPTIONS).includes(key.toLowerCase())) {
                definition = MISSING_CHARACTERISTIC_DESCRIPTIONS[key.toLowerCase()];
            }

            const formattedCharacteristic: Characteristic = {
                type,
                name,
                shortName: characteristic.alias,
                value,
                cost,
                base,
                definition,
                roll,
                ncm: null,
            };

            if (type === TYPE_MOVEMENT) {
                formattedCharacteristic.ncm = this.getCharacteristicNcm(templateCharacteristic);

                character.movement.push(formattedCharacteristic);
            } else {
                character.characteristics.push(formattedCharacteristic);
            }
        }
    }

    private getCharacteristicFields(
        characteristic: Obj,
        templateCharacteristic: Obj,
        character: Obj,
    ): {definition: string | null; roll: boolean; value: number; cost: number; base: number} {
        if (templateCharacteristic.definition !== null && templateCharacteristic.definition.startsWith('(Hero System Fifth Edition')) {
            return this.updateCharacteristic(characteristic, templateCharacteristic, character);
        }

        return {
            definition: templateCharacteristic.definition,
            roll: false,
            value: characteristic.levels + templateCharacteristic.base,
            cost: Math.round((characteristic.levels / templateCharacteristic.lvlval) * templateCharacteristic.lvlcost),
            base: templateCharacteristic.base,
        };
    }

    private updateCharacteristic(
        characteristic: Obj,
        templateCharacteristic: Obj,
        character: Obj,
    ): {definition: string | null; roll: boolean; value: number; cost: number; base: number} {
        let bonus = 0;
        let value = characteristic.levels + templateCharacteristic.base;
        let cost = Math.round((characteristic.levels / templateCharacteristic.lvlval) * templateCharacteristic.lvlcost);
        let base = templateCharacteristic.base;

        switch (characteristic.alias.toUpperCase()) {
            case 'PD':
                bonus = roundInPlayersFavor(this.getCharacteristicBaseValue('STR', character) / 5);
                value += bonus;
                base += bonus;
                break;
            case 'ED':
                bonus = roundInPlayersFavor(this.getCharacteristicBaseValue('CON', character) / 5);
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
                bonus = roundInPlayersFavor(this.getCharacteristicBaseValue('STR', character) / 5);
                bonus += roundInPlayersFavor(this.getCharacteristicBaseValue('CON', character) / 5);
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
            case 'LEAPING': {
                bonus = this.getCharacteristicBaseValue('STR', character) / 5;
                const fractionalPart = parseFloat((bonus % 1).toFixed(1));

                if (fractionalPart >= 0.6) {
                    bonus = Math.trunc(bonus) + 0.5;
                } else {
                    bonus = Math.trunc(bonus);
                }

                value += bonus;
                base += bonus;
                break;
            }
            default:
            // do nothing
        }

        return {
            definition: templateCharacteristic.definition,
            roll: false,
            value,
            cost,
            base,
        };
    }

    private getCharacteristicNcm(templateCharacteristic: Obj): number {
        if (Array.isArray(templateCharacteristic.adder)) {
            const adder = templateCharacteristic.adder.filter((a: Obj) => a.xmlid === 'IMPROVEDNONCOMBAT')[0];

            return adder.lvlval * adder.lvlmultiplier;
        }

        return templateCharacteristic.adder.lvlval * templateCharacteristic.adder.lvlmultiplier;
    }

    private populateTrait(character: Obj, template: Obj, trait: Obj | null, traitKey: string, traitSubKey: string, characterSubTrait: string): void {
        if (trait === null) {
            return;
        } else if (!Array.isArray(trait[traitSubKey])) {
            if (trait[traitSubKey] === undefined) {
                trait[traitSubKey] = [];
            } else {
                trait[traitSubKey] = [trait[traitSubKey]];
            }
        }

        trait[traitSubKey] = this.getLists(trait, trait[traitSubKey]);

        for (const skillEnhancer of SKILL_ENHANCERS) {
            if (hasOwn(trait, toCamelCase(skillEnhancer))) {
                trait[traitSubKey].push(trait[toCamelCase(skillEnhancer)]);
            }
        }

        trait[traitSubKey].sort((a: Obj, b: Obj) => Number(a.position > b.position));

        for (const value of Object.values(trait[traitSubKey]) as Obj[]) {
            if (value.xmlid.toUpperCase() === GENERIC_OBJECT || SKILL_ENHANCERS.includes(value.xmlid.toUpperCase())) {
                value.type = 'list';
                value[characterSubTrait] = [];

                if (value.originalType.toUpperCase() === 'VPP') {
                    value.template = this.buildVppTemplate(value, template);
                }

                character[traitKey].push(value);

                continue;
            } else if (value.xmlid.toUpperCase() === 'COMPOUNDPOWER') {
                this.getCompoundPowers(value, template, traitKey, traitSubKey);
            }

            const templateTrait = this.getTemplateTrait(value, template, traitKey, traitSubKey);

            this.addModifierTemplate(value.modifier, template);

            value.type = traitSubKey;
            value.template = templateTrait;

            if (hasOwn(value, 'parentid')) {
                const t = character[traitKey].filter((trt: Obj) => trt.id === value.parentid).shift();

                if (t === undefined) {
                    character[traitKey].push(value);
                } else {
                    t[characterSubTrait].push(value);
                }
            } else {
                character[traitKey].push(value);
            }
        }
    }

    private getCompoundPowers(compoundPower: Obj, template: Obj, traitKey: string, traitSubKey: string): void {
        const powersMap = toMap(template.powers.power);

        if (hasOwn(compoundPower, 'power')) {
            if (Array.isArray(compoundPower.power)) {
                compoundPower.powers = [];

                for (const power of compoundPower.power) {
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

        for (const subItemKey of locations) {
            if (hasOwn(compoundPower, subItemKey)) {
                if (Array.isArray(compoundPower[subItemKey])) {
                    for (const power of compoundPower[subItemKey]) {
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

        for (const [key, value] of Object.entries(compoundPower) as Array<[string, Obj]>) {
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

        this.getCompoundPower(compoundPower, template, traitKey, traitSubKey);
    }

    private getCompoundPower(compoundPower: Obj, template: Obj, traitKey: string, traitSubKey: string): void {
        for (const power of compoundPower.powers) {
            const templateTrait = this.getTemplateTrait(power, template, traitKey, traitSubKey);

            this.addModifierTemplate(power.modifier, template);

            power.type = traitSubKey;
            power.template = templateTrait;
            power.parentid = compoundPower.id;
        }
    }

    private getTemplateTrait(value: Obj, template: Obj, traitKey: string, traitSubKey: string): Obj | undefined {
        let templateTrait: Obj | undefined;

        if (traitKey === 'powers' || traitKey === 'equipment') {
            for (const key of Object.keys(template.characteristics)) {
                if (value.xmlid.toLowerCase() === key.toLowerCase()) {
                    templateTrait = template.characteristics[key];
                    break;
                }
            }

            if (templateTrait === null || templateTrait === undefined) {
                for (let [key, subKey] of Object.entries(CHARACTER_TRAITS)) {
                    if (key === 'equipment') {
                        key = 'powers';
                        subKey = 'power';
                    }

                    templateTrait = template[key][subKey]
                        .filter((t: Obj) => {
                            if (t.xmlid.toUpperCase() === GENERIC_OBJECT) {
                                return false;
                            }

                            return t.xmlid.toLowerCase() === value.xmlid.toLowerCase();
                        })
                        .shift();

                    if (templateTrait !== undefined) {
                        break;
                    }
                }
            }
        } else {
            templateTrait = template[traitKey][traitSubKey]
                .filter((t: Obj) => {
                    if (t.xmlid.toUpperCase() === GENERIC_OBJECT) {
                        return false;
                    }

                    return t.xmlid.toLowerCase() === value.xmlid.toLowerCase();
                })
                .shift();
        }

        return templateTrait;
    }

    private addModifierTemplate(modifier: Obj | Obj[] | undefined | null, template: Obj): void {
        if (modifier === undefined || modifier === null) {
            return;
        }

        if (Array.isArray(modifier)) {
            for (const mod of modifier) {
                this.addModifierTemplate(mod, template);
            }
        } else {
            for (const mod of template.modifiers.modifier) {
                if (mod.xmlid.toUpperCase() === modifier.xmlid.toUpperCase()) {
                    modifier.template = mod;
                    break;
                }
            }
        }
    }

    private normalizeTemplateData(template: Obj): void {
        for (const [listKey, subListKey] of Object.entries(CHARACTER_TRAITS)) {
            const normalizedEntries: Obj[] = [];

            if (listKey === 'powers') {
                this.normalizeTemplatePowers(template);
                continue;
            }
            if (listKey === 'equipment') {
                continue;
            }

            for (const [key, item] of Object.entries(template[listKey]) as Array<[string, Obj]>) {
                if (Array.isArray(item)) {
                    for (const i of item) {
                        this.normalizeTemplateItem(normalizedEntries, key, i);
                    }
                } else {
                    if (!hasOwn(item, 'xmlid')) {
                        item.xmlid = toSnakeCase(key).toUpperCase();
                    }

                    normalizedEntries.push(item);

                    delete template[listKey][key];
                }
            }

            template[listKey][subListKey] = template[listKey][subListKey].concat(normalizedEntries);
        }
    }

    private normalizeTemplateItem(normalizedEntries: Obj[], key: string, item: Obj): void {
        if (Array.isArray(item)) {
            for (const i of item) {
                this.normalizeTemplateItem(normalizedEntries, key, i);
            }
        } else {
            if (!hasOwn(item, 'xmlid')) {
                if (key === 'maneuver') {
                    item.xmlid = toSnakeCase(item.display).toUpperCase();
                } else {
                    item.xmlid = key.toUpperCase();
                }
            }

            normalizedEntries.push(item);
        }
    }

    private normalizeTemplatePowers(template: Obj): void {
        const blacklisted = ['sensegroup', 'sense']; // For some reason these are listed in powers

        template.senses = {};
        template.powers.power = [];
        template.characteristics.running.xmlid = 'RUNNING';
        template.powers.power.push(template.characteristics.running);
        template.characteristics.swimming.xmlid = 'SWIMMING';
        template.powers.power.push(template.characteristics.swimming);
        template.characteristics.leaping.xmlid = 'LEAPING';
        template.powers.power.push(template.characteristics.leaping);

        for (const [key, power] of Object.entries(template.powers) as Array<[string, Obj]>) {
            if (blacklisted.includes(key)) {
                continue;
            }

            if (key !== 'power') {
                this.normalizeTemplatePower(template, key, power);

                delete template.powers[key];
            }
        }
    }

    private normalizeTemplatePower(template: Obj, key: string, power: Obj): void {
        if (Array.isArray(power)) {
            for (const p of power) {
                this.normalizeTemplatePower(template, key, p);
            }
        } else {
            if (!hasOwn(power, 'xmlid')) {
                power.xmlid = key.toUpperCase();
            }

            template.powers.power.push(power);
        }
    }

    private normalizeCharacterData(parsed: Obj): void {
        for (const [listKey, subListKey] of Object.entries(CHARACTER_TRAITS)) {
            if (listKey === 'powers' || listKey === 'martialArts' || listKey === 'equipment') {
                this.normalizeCharacterItems(parsed, listKey.toLowerCase(), subListKey);

                continue;
            }

            if (hasOwn(parsed, listKey.toLowerCase()) && parsed[listKey] !== null) {
                for (const [key, item] of Object.entries(parsed[listKey.toLowerCase()]) as Array<[string, Obj]>) {
                    this.normalizeCharacterDataItem(parsed, item, key);
                }
            }
        }
    }

    private normalizeCharacterDataItem(parsed: Obj, item: Obj, key: string): void {
        if (Array.isArray(item)) {
            for (const i of item) {
                this.normalizeCharacterDataItem(parsed, i, key);
            }
        } else {
            if (!hasOwn(item, 'xmlid')) {
                item.xmlid = toSnakeCase(item.display).toUpperCase();
            }

            item.originalType = key;
        }
    }

    private normalizeCharacterItems(parsed: Obj, listKey: string, subListKey: string): void {
        if (parsed[listKey] === null || parsed[listKey] === undefined) {
            return;
        }

        if (hasOwn(parsed[listKey], subListKey)) {
            if (!Array.isArray(parsed[listKey][subListKey])) {
                const subListItem = parsed[listKey][subListKey];

                parsed[listKey][subListKey] = [subListItem];
            }
        } else {
            parsed[listKey][subListKey] = [];
        }

        for (const [key, item] of Object.entries(parsed[listKey]) as Array<[string, Obj]>) {
            if (key !== subListKey) {
                this.normalizeCharacterItem(parsed, item, listKey, subListKey, key);

                delete parsed[listKey][key];
            } else if (key.toUpperCase() === 'MANEUVER') {
                if (Array.isArray(item)) {
                    for (const i of item) {
                        if (i.xmlid.toUpperCase() === 'MANEUVER') {
                            i.xmlid = toSnakeCase(i.display).toUpperCase();
                        }
                    }
                } else {
                    if (item.xmlid.toUpperCase() === 'MANEUVER') {
                        item.xmlid = toSnakeCase(item.display).toUpperCase();
                    }
                }
            }
        }
    }

    private normalizeCharacterItem(parsed: Obj, item: Obj, listKey: string, subListKey: string, originalType: string): void {
        if (Array.isArray(item)) {
            for (const i of item) {
                this.normalizeCharacterItem(parsed, i, listKey, subListKey, originalType);
            }
        } else {
            item.originalType = originalType;

            if (listKey === 'equipment') {
                if (!hasOwn(parsed[listKey], 'powers')) {
                    parsed[listKey].powers = [];
                }

                parsed[listKey].powers.push(item);
            } else {
                parsed[listKey][subListKey].push(item);
            }
        }
    }

    private getLists(data: Obj, list: Obj[]): Obj[] {
        if (hasOwn(data, 'list')) {
            if (Array.isArray(data.list)) {
                list = list.concat(data.list);
            } else {
                list.push(data.list);
            }
        }

        return list;
    }

    private buildVppTemplate(power: Obj, template: Obj): Obj {
        const mods: Obj[] = [];
        const adds = [
            {
                xmlid: 'CONTROLCOST',
                basecost: power.adder ? power.adder.baseCost : 0.0,
                levels: power.adder ? power.adder.levels : 0,
                lvlcost: power.adder ? power.adder.lvlcost : 0,
                lvlval: power.adder ? power.adder.lvlval : 0,
            },
        ];

        for (const modifier of template.modifiers.modifier) {
            if (hasOwn(modifier, 'type') && modifier.type.toUpperCase() === 'VPP') {
                mods.push(modifier);
            }
        }

        return {
            modifier: mods,
            adder: adds,
        };
    }
}

export const heroDesignerCharacter = new HeroDesignerCharacter();
