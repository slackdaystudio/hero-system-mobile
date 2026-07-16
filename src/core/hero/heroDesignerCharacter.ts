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
import {flatten, hasModifier, isEmptyObject, roundInPlayersFavor, toCamelCase, toMap, toSnakeCase} from 'core/util';
import {
    BASE_MOVEMENT_MODES,
    CHARACTER_TRAITS,
    CHARACTERISTIC_NAMES,
    FIGURED_CHARACTERISTICS,
    GENERIC_OBJECT,
    MISSING_CHARACTERISTIC_DESCRIPTIONS,
    SKILL_ENHANCERS,
    SKILL_ROLL_BASE,
    TYPE_CHARACTERISTIC,
    TYPE_MOVEMENT,
} from './constants';
import type {Character, Characteristic, ParsedCharacter} from './types';

// The character model is a dynamic, XML-derived object graph; the pipeline below
// mutates it in place exactly as the legacy engine does. `Obj` is the working
// view for that manipulation; the public `getCharacter` stays fully typed.
type Obj = Record<string, any>;

const hasOwn = (obj: object, key: string): boolean => Object.prototype.hasOwnProperty.call(obj, key);

/** `toMap` collapses a repeated xmlid into an array; single and repeated read the same way. */
const asArray = (value: unknown): Obj[] => (Array.isArray(value) ? (value as Obj[]) : value === null || value === undefined ? [] : [value as Obj]);

/**
 * Which Force Field / Resistant Protection field feeds each unusual-defense total. Flash is
 * absent on purpose: no `flashlevels` field exists in the HERO Designer data, so Resistant
 * Protection contributes nothing to a Flash Defense total.
 */
const UNUSUAL_DEFENSE_FORCE_FIELD_LEVELS: Record<string, string> = {
    MENTALDEFENSE: 'mdlevels',
    POWERDEFENSE: 'powdlevels',
};

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

    getCharacteristicFullName(abbreviation: string): string {
        abbreviation = abbreviation.toLowerCase();

        return hasOwn(CHARACTERISTIC_NAMES, abbreviation) ? CHARACTERISTIC_NAMES[abbreviation] : '';
    }

    /**
     * The standard visibility rule, inlined at ~40 sites across this engine: a power counts
     * toward a total when it affects the total, and a secondary-only power counts only in the
     * alternate-ID form. `getDefense` already applied it to compound-power children; H8 brings
     * the unusual-defense path in line.
     */
    private countsTowardTotal(power: Obj, showSecondary?: boolean): boolean {
        return Boolean((power.affectsPrimary && power.affectsTotal) || (!power.affectsPrimary && power.affectsTotal && showSecondary));
    }

    hasSecondaryCharacteristics(powers: Obj[]): boolean {
        for (const power of powers) {
            if (!power.affectsPrimary && power.affectsTotal) {
                return true;
            }
        }

        return false;
    }

    /**
     * The powers that count toward totals, indexed by xmlid.
     *
     * H5 (docs/KNOWN_DEVIATIONS.md) — intentional divergence from legacy: powers held in a
     * Variable Power Pool are excluded. A VPP holds prefabricated powers the player swaps
     * between for different occasions; none is active until points are allocated to it, so
     * none may contribute to characteristics, defenses or movement. Legacy counted them all
     * unconditionally, which let a pool's every configuration apply at once.
     *
     * Mirrors `isPowerFrameworkItem(…, 'vpp')` but resolves parents against one shared id
     * map instead of rebuilding it per power.
     */
    private powersForTotals(character: Obj): Map<unknown, any> {
        const byId = toMap(character.powers, 'id');
        const inVariablePowerPool = (power: Obj): boolean => {
            if (!hasOwn(power, 'parentid')) {
                return false;
            }

            const parent = byId.get(power.parentid);

            return parent !== undefined && !Array.isArray(parent) && (parent as Obj).originalType === 'vpp';
        };

        return toMap(flatten(character.powers, 'powers').filter((power: Obj) => !inVariablePowerPool(power)));
    }

    isPowerFrameworkItem(item: Obj, character: Obj, type: string): boolean {
        if (hasOwn(item, 'parentid') && character.powers.length > 0) {
            const powersMap = toMap(character.powers, 'id');

            if (powersMap.has(item.parentid)) {
                return (powersMap.get(item.parentid) as Obj).originalType === type;
            }
        }

        return false;
    }

    getAdditionalCharacteristicPoints(shortName: string, character: Obj): number {
        const characteristic = this.getCharacteristicByShortName(shortName, character);
        const total = this.getCharacteristicTotal(shortName, character);

        return total - (characteristic as Obj).value;
    }

    getCharacteristicTotal(shortName: string, character: Obj): number {
        const powersMap: Map<unknown, any> = this.powersForTotals(character);

        for (const characteristic of character.characteristics) {
            if (shortName.toUpperCase() === characteristic.shortName.toUpperCase()) {
                return this.getCharacteristicTotalInner(characteristic, powersMap, character.showSecondary, character);
            }
        }

        return 0;
    }

    getRollTotal(characteristic: Obj, character: Obj): string | null {
        if (characteristic.roll) {
            const powersMap: Map<unknown, any> = this.powersForTotals(character);

            return `${Math.round(this.getCharacteristicTotalInner(characteristic, powersMap, character.showSecondary, character) / 5) + SKILL_ROLL_BASE}-`;
        }

        return null;
    }

    /**
     * The Normal Damage a character's bare STR does: `"12d6"`, `"2½d6"`.
     *
     * **5 STR is 1d6, and 3 or 4 STR over that is a half-die** — so STR 60 punches for 12d6 and STR
     * 13 for 2½d6, while STR 11 and 12 are still 2d6. That is what the `>= 0.6` threshold below
     * encodes: `STR / 5` leaves .6 or .8 exactly when the remainder is 3 or 4.
     *
     * Ported from the legacy app's `Characteristics.js` `getStrengthDamage()`, which computed this
     * inside the sheet component — so this is a **port gap being closed**, not a new rule. The
     * rebuild's sheet has never shown it, which left a Brick unable to roll his own punch.
     *
     * Lives here rather than in the sheet because it is a fact about a characteristic, exactly like
     * {@link getRollTotal} beside it, and because `maneuver.ts` and `handToHandAttack.ts` already
     * compute the same `STR / 5` from inside `core/traits`. **Those are deliberately left alone**:
     * their formatting is *not* identical to this (`handToHandAttack` computes a half-die and then
     * drops it in its no-adder branch, faithfully to legacy), so folding them together would be a
     * behaviour change wearing a refactor's clothes. See docs/KNOWN_DEVIATIONS.md.
     */
    getStrengthDamage(character: Obj): string {
        // Clamped, where legacy wasn't. Its guard was `fractionalPart > 0.0`, so a negative STR fell
        // past every branch and rendered the raw float: STR -3 printed "-0.6d6". Not a deviation
        // worth preserving — this rule lived in legacy's sheet *component*, not its engine, so it
        // was never golden-mastered and nothing depends on that output. Nobody punches for -0.6d6.
        const dice = Math.max(0, this.getCharacteristicTotal('STR', character)) / 5;
        const remainder = parseFloat((dice % 1).toFixed(1));

        return remainder >= 0.6 ? `${Math.trunc(dice)}½d6` : `${Math.trunc(dice)}d6`;
    }

    getTotalDefense(character: Obj, type: string | null, withResistant = true): string {
        if (type === null || type === undefined) {
            return withResistant ? '0/0' : '0';
        }

        const nonResistant = this.getCharacteristicTotal(type, character);
        let resistant = 0;

        if (!withResistant) {
            return nonResistant.toString();
        }

        const powersMap: Map<unknown, any> = this.powersForTotals(character);
        const characteristic = this.getCharacteristicByShortName(type, character);
        const showSecondary = character.showSecondary;

        if (powersMap.has('ARMOR')) {
            resistant = this.getTotalArmorDefenseIncrease((characteristic as Obj).shortName.toUpperCase(), powersMap.get('ARMOR'), resistant, showSecondary);
        }

        if (powersMap.has('FORCEFIELD')) {
            resistant = this.getTotalResistantDefensesIncrease((characteristic as Obj).shortName.toUpperCase(), powersMap.get('FORCEFIELD'), resistant, showSecondary);
        }

        if (powersMap.has(type.toUpperCase())) {
            resistant = this.getResistantDefense(resistant, powersMap.get(type.toUpperCase()), character, showSecondary);
        }

        if (powersMap.has('COMPOUNDPOWER')) {
            resistant = this.getDefenseFromCompoundPower(resistant, powersMap.get('COMPOUNDPOWER'), type.toUpperCase(), true, showSecondary);
        }

        if (powersMap.has('NAKEDMODIFIER')) {
            resistant = this.getDefenseFromCompoundPower(resistant, powersMap.get('NAKEDMODIFIER'), type.toUpperCase(), true, showSecondary);
        }

        return `${nonResistant}/${resistant}`;
    }

    getTotalUnusualDefense(character: Obj, powerXmlId: string): string {
        const defenses = {nonResistant: 0, resistant: 0};
        const powersMap: Map<unknown, any> = this.powersForTotals(character);
        const showSecondary = character.showSecondary;

        if (powersMap.has(powerXmlId)) {
            this.getUnusualDefensePoints(defenses, powersMap.get(powerXmlId), character, showSecondary);
        }

        // H7 (docs/KNOWN_DEVIATIONS.md) — intentional divergence: legacy added Force Field /
        // Resistant Protection's *mental* defense to every unusual-defense total, whatever was
        // asked for, so Power Defense collected mdlevels and Flash Defense collected a figure
        // out of thin air. Read the field matching the query instead; a query with no
        // corresponding field (Flash — no `flashlevels` exists in the data) gets nothing.
        // Also H6: `powersMap.get` yields an array when the xmlid repeats, and reading
        // `.mdlevels` off the array itself silently contributed 0.
        // H8: legacy also ignored affectsPrimary/affectsTotal here, so a secondary-form
        // Resistant Protection fed these totals even in the base form — unlike every other
        // total, and unlike `getDefense` on the compound-power path right below.
        const forceFieldField = UNUSUAL_DEFENSE_FORCE_FIELD_LEVELS[powerXmlId.toUpperCase()];
        if (powersMap.has('FORCEFIELD') && forceFieldField !== undefined) {
            for (const forceField of asArray(powersMap.get('FORCEFIELD'))) {
                if (!this.countsTowardTotal(forceField, showSecondary)) {
                    continue;
                }

                const levels = (forceField[forceFieldField] as number) || 0;

                defenses.nonResistant += levels;
                defenses.resistant += levels;
            }
        }

        if (powersMap.has('COMPOUNDPOWER')) {
            defenses.nonResistant = this.getDefenseFromCompoundPower(defenses.nonResistant, powersMap.get('COMPOUNDPOWER'), powerXmlId, false, showSecondary);
            defenses.resistant = this.getDefenseFromCompoundPower(defenses.resistant, powersMap.get('COMPOUNDPOWER'), powerXmlId, true, showSecondary);
        }

        return `${defenses.nonResistant}/${defenses.resistant}`;
    }

    /**
     * Total meters for a movement mode: its own value, plus 5E leaping's STR
     * bonus, plus any movement-boosting powers of the same short name.
     * `formatFraction` renders a trailing ½ as the legacy sheet does.
     */
    getMovementTotal(characteristic: Obj, character: Obj, formatFraction = false): number | string {
        const powersMap: Map<unknown, any> = this.powersForTotals(character);
        const shortName = String(characteristic.shortName).toUpperCase();
        let meters: number = characteristic.value;

        if (shortName === 'LEAPING' && this.isFifth(character)) {
            let total = this.getAdditionalCharacteristicPoints('STR', character) / 5;
            const fractionalPart = parseFloat((total % 1).toFixed(1));

            if (fractionalPart >= 0.6) {
                total = Math.trunc(total) + 0.5;
            } else {
                total = Math.trunc(total);
            }

            meters = characteristic.base + total;
        }

        if (powersMap.has(shortName)) {
            meters = this.getTotalMeters(powersMap.get(shortName), meters, character);
        }

        if (formatFraction) {
            const fractionalMeters = parseFloat((meters % 1).toFixed(1));

            return fractionalMeters >= 0.5 ? `${Math.trunc(meters)}½` : Math.trunc(meters);
        }

        return meters;
    }

    /** Non-combat movement multiplier (default x2), raised by IMPROVEDNONCOMBAT adders. */
    getTotalNcm(characteristic: Obj, character: Obj): number {
        const powersMap: Map<unknown, any> = this.powersForTotals(character);
        const shortName = String(characteristic.shortName).toUpperCase();
        let ncm = 2;

        if (powersMap.has(shortName)) {
            ncm = this.getTotalNcmInner(powersMap.get(shortName), ncm, character);
        }

        return ncm;
    }

    private getTotalMeters(movementMode: Obj | Obj[], meters: number, character: Obj): number {
        if (Array.isArray(movementMode)) {
            for (const move of movementMode) {
                meters += this.getTotalMeters(move, meters, character);
            }
        } else {
            if (movementMode.affectsPrimary && movementMode.affectsTotal) {
                meters += movementMode.levels;
            } else if (!movementMode.affectsPrimary && movementMode.affectsTotal && character.showSecondary) {
                meters += movementMode.levels;
            }
        }

        return meters;
    }

    private getTotalNcmInner(movementMode: Obj | Obj[], ncm: number, character: Obj): number {
        if (Array.isArray(movementMode)) {
            for (const move of movementMode) {
                ncm += this.getTotalNcmInner(move, ncm, character);
            }
        } else if ((movementMode.affectsPrimary && movementMode.affectsTotal) || (!movementMode.affectsPrimary && movementMode.affectsTotal && character.showSecondary)) {
            const adderMap = toMap(movementMode.adder);

            if (adderMap.has('IMPROVEDNONCOMBAT')) {
                ncm **= (adderMap.get('IMPROVEDNONCOMBAT') as Obj).levels + 1;
            }
        }

        return ncm;
    }

    private getCharacteristicTotalInner(characteristic: Obj, powersMap: Map<unknown, any>, showSecondary: boolean, character: Obj): number {
        let value = characteristic.value;

        if (!isEmptyObject(powersMap) && powersMap.has(characteristic.shortName.toUpperCase())) {
            value = this.getTotalCharacteristicPoints(powersMap.get(characteristic.shortName.toUpperCase()), value, showSecondary);
        }

        if (powersMap.has('ARMOR')) {
            value = this.getTotalArmorDefenseIncrease(characteristic.shortName.toUpperCase(), powersMap.get('ARMOR'), value, showSecondary);
        }

        if (powersMap.has('DENSITYINCREASE')) {
            value = this.getTotalDensityIncreaseCharacteristics(characteristic, powersMap.get('DENSITYINCREASE'), value, showSecondary);
        }

        if (powersMap.has('FORCEFIELD')) {
            value = this.getTotalResistantDefensesIncrease(characteristic.shortName.toUpperCase(), powersMap.get('FORCEFIELD'), value, showSecondary);
        }

        if (powersMap.has('COMPOUNDPOWER')) {
            value = this.getTotalCompoundPowerIncrease(characteristic, powersMap.get('COMPOUNDPOWER'), value, showSecondary);
        }

        if (this.isFifth(character)) {
            if (FIGURED_CHARACTERISTICS.includes(characteristic.shortName.toUpperCase())) {
                let total = 0;

                switch (characteristic.shortName.toUpperCase()) {
                    case 'PD':
                        total = roundInPlayersFavor(this.getFiguredCharacteristicContribution('STR', powersMap, character) / 5);
                        value += total;
                        break;
                    case 'ED':
                        total = roundInPlayersFavor(this.getFiguredCharacteristicContribution('CON', powersMap, character) / 5);
                        value += total;
                        break;
                    case 'SPD':
                        total = this.getFiguredCharacteristicContribution('DEX', powersMap, character) / 10;
                        value += Math.floor(total);
                        break;
                    case 'REC':
                        total = roundInPlayersFavor(this.getFiguredCharacteristicContribution('STR', powersMap, character) / 5);
                        total += roundInPlayersFavor(this.getFiguredCharacteristicContribution('CON', powersMap, character) / 5);
                        value += total;
                        break;
                    case 'END':
                        total = this.getFiguredCharacteristicContribution('CON', powersMap, character) * 2;
                        value += total;
                        break;
                    case 'STUN':
                        total = this.getFiguredCharacteristicContribution('BODY', powersMap, character);
                        total += this.getFiguredCharacteristicContribution('STR', powersMap, character) / 2;
                        total += this.getFiguredCharacteristicContribution('CON', powersMap, character) / 2;
                        value += total;
                        break;
                }
            }
        }

        return Math.round(value);
    }

    private getFiguredCharacteristicContribution(shortName: string, powersMap: Map<unknown, any>, character: Obj): number {
        const powerCharacteristic = powersMap.get(shortName.toUpperCase());

        if (powerCharacteristic !== undefined) {
            if (!hasModifier('NOFIGURED', powerCharacteristic)) {
                return this.getAdditionalCharacteristicPoints(shortName, character);
            }
        }

        return 0;
    }

    // H3 (docs/KNOWN_DEVIATIONS.md) — intentional divergence from legacy. When an xmlid
    // appears more than once, `toMap` collapses the powers into an array; legacy's array
    // branch then tested the *array's* own (undefined) affectsPrimary/affectsTotal, so none
    // of the duplicates contributed. Each element is delegated to the scalar branch instead,
    // which applies the guard per power — the shape `getTotalCompoundPowerIncrease` already
    // used. (Legacy also passed `showSecondary` as the `value` argument here.)
    private getTotalCharacteristicPoints(characteristic: Obj | Obj[], value: number, showSecondary?: boolean): number {
        if (Array.isArray(characteristic)) {
            for (const char of characteristic) {
                value = this.getTotalCharacteristicPoints(char, value, showSecondary);
            }
        } else {
            if (
                (characteristic.affectsPrimary && characteristic.affectsTotal) ||
                (!characteristic.affectsPrimary && characteristic.affectsTotal && showSecondary)
            ) {
                value += parseInt(characteristic.levels, 10);
            }
        }

        return value;
    }

    private getTotalDensityIncreaseCharacteristics(characteristic: Obj, densityIncrease: Obj | Obj[], value: number, showSecondary?: boolean): number {
        if (Array.isArray(densityIncrease)) {
            // H3 — see getTotalCharacteristicPoints. (Legacy also `+=`'d a recursion that
            // already returned the running total, which would have double-counted `value`.)
            for (const di of densityIncrease) {
                value = this.getTotalDensityIncreaseCharacteristics(characteristic, di, value, showSecondary);
            }
        } else {
            if (
                (densityIncrease.affectsPrimary && densityIncrease.affectsTotal) ||
                (!densityIncrease.affectsPrimary && densityIncrease.affectsTotal && showSecondary)
            ) {
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

    private getTotalArmorDefenseIncrease(type: string, resistantDefence: Obj | Obj[], value: number, showSecondary?: boolean): number {
        if (Array.isArray(resistantDefence)) {
            // H3 — see getTotalCharacteristicPoints. (Legacy also `+=`'d a recursion that
            // already returned the running total, which would have double-counted `value`.)
            for (const rd of resistantDefence) {
                value = this.getTotalArmorDefenseIncrease(type, rd, value, showSecondary);
            }
        } else {
            if (
                (resistantDefence.affectsPrimary && resistantDefence.affectsTotal) ||
                (!resistantDefence.affectsPrimary && resistantDefence.affectsTotal && showSecondary)
            ) {
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

    private getTotalResistantDefensesIncrease(type: string, resistantDefence: Obj | Obj[], value: number, showSecondary?: boolean): number {
        if (Array.isArray(resistantDefence)) {
            // H3 — see getTotalCharacteristicPoints.
            for (const rd of resistantDefence) {
                value = this.getTotalResistantDefensesIncrease(type, rd, value, showSecondary);
            }
        } else {
            if (
                (resistantDefence.affectsPrimary && resistantDefence.affectsTotal) ||
                (!resistantDefence.affectsPrimary && resistantDefence.affectsTotal && showSecondary)
            ) {
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

    private getTotalCompoundPowerIncrease(characteristic: Obj, power: Obj | Obj[], value: number, showSecondary?: boolean): number {
        if (Array.isArray(power)) {
            for (const p of power) {
                value = this.getTotalCompoundPowerIncrease(characteristic, p, value, showSecondary);
            }
        } else {
            if (Array.isArray(power.powers)) {
                for (const cp of power.powers) {
                    if (cp.xmlid.toUpperCase() === characteristic.shortName.toUpperCase()) {
                        if ((cp.affectsPrimary && cp.affectsTotal) || (!cp.affectsPrimary && cp.affectsTotal && showSecondary)) {
                            value += cp.levels;
                        }
                    } else if (cp.xmlid.toUpperCase() === 'FORCEFIELD') {
                        value = this.getTotalResistantDefensesIncrease(characteristic.shortName.toUpperCase(), cp, value, showSecondary);
                    } else if (cp.xmlid.toUpperCase() === 'DENSITYINCREASE') {
                        value = this.getTotalDensityIncreaseCharacteristics(characteristic, cp, value, showSecondary);
                    } else if (cp.xmlid.toUpperCase() === 'ARMOR') {
                        value = this.getTotalArmorDefenseIncrease(characteristic.shortName.toUpperCase(), cp, value, showSecondary);
                    }
                }
            } else {
                if (power.xmlid.toUpperCase() === characteristic.shortName.toUpperCase()) {
                    if ((power.affectsPrimary && power.affectsTotal) || (!power.affectsPrimary && power.affectsTotal && showSecondary)) {
                        value += power.levels;
                    }
                } else if (power.xmlid.toUpperCase() === 'FORCEFIELD') {
                    value = this.getTotalResistantDefensesIncrease(characteristic.shortName.toUpperCase(), power, value, showSecondary);
                } else if (power.xmlid.toUpperCase() === 'DENSITYINCREASE') {
                    value = this.getTotalDensityIncreaseCharacteristics(characteristic, power, value, showSecondary);
                } else if (power.xmlid.toUpperCase() === 'ARMOR') {
                    value = this.getTotalArmorDefenseIncrease(characteristic.shortName.toUpperCase(), power, value, showSecondary);
                }
            }
        }

        return value;
    }

    private getDefenseFromCompoundPower(value: number, power: Obj | Obj[], id: string, resistant: boolean, showSecondary?: boolean): number {
        if (Array.isArray(power)) {
            for (const p of power) {
                value = this.getDefenseFromCompoundPower(value, p, id, resistant, showSecondary);
            }
        } else {
            if (Array.isArray(power.powers)) {
                for (const cp of power.powers) {
                    value = this.getDefense(cp, id, value, resistant, showSecondary);
                }
            } else {
                value = this.getDefense(power, id, value, resistant, showSecondary);
            }
        }

        return value;
    }

    private getDefense(power: Obj, id: string, value: number, resistant: boolean, showSecondary?: boolean): number {
        if (power.xmlid.toUpperCase() === id.toUpperCase()) {
            if ((power.affectsPrimary && power.affectsTotal) || (!power.affectsPrimary && power.affectsTotal && showSecondary)) {
                if (!resistant || (resistant && this.isResistent(power))) {
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
                    if (!resistant || (resistant && this.isResistent(power))) {
                        value += power.levels;
                    }
                }
            }
        }

        return value;
    }

    private getResistantDefense(resistant: number, power: Obj | Obj[], character: Obj, showSecondary?: boolean): number {
        if (Array.isArray(power)) {
            // H3 — see getTotalCharacteristicPoints.
            for (const p of power) {
                resistant = this.getResistantDefense(resistant, p, character, showSecondary);
            }
        } else {
            if ((power.affectsPrimary && power.affectsTotal) || (!power.affectsPrimary && power.affectsTotal && showSecondary)) {
                if (this.isResistent(power)) {
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

    private isResistent(power: Obj): boolean {
        if (power?.xmlid && (power.xmlid.toUpperCase() === 'FORCEFIELD' || power.xmlid.toUpperCase() === 'ARMOR')) {
            return true;
        }

        if (hasOwn(power, 'modifier')) {
            if (Array.isArray(power.modifier)) {
                for (const m of power.modifier) {
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

    /**
     * H6 (docs/KNOWN_DEVIATIONS.md) — intentional divergence: this took a single `Obj` and had
     * no array branch, so when an xmlid repeated and `toMap` collapsed the powers into an
     * array, `unusualDefense.levels` was `undefined` and **every** one of them contributed 0.
     * `defensor` buys Power Defense twice (10 and 5) and received none of it.
     */
    private getUnusualDefensePoints(defenses: {nonResistant: number; resistant: number}, unusualDefense: Obj | Obj[], character: Obj, showSecondary?: boolean): number {
        // H8: only powers visible in the current form count — the same rule every other total
        // applies. Legacy checked nothing here, so a secondary-only Mental/Power Defense
        // contributed even in the base form.
        const unusualDefenses = asArray(unusualDefense).filter((defense) => this.countsTowardTotal(defense, showSecondary));
        let points = 0;
        let resistantPoints = 0;
        let anyResistant = false;

        for (const defense of unusualDefenses) {
            const levels = defense.levels || 0;

            points += levels;

            if (this.isResistent(defense)) {
                anyResistant = true;
                resistantPoints += levels;
            }
        }

        // 5E Mental Defense adds EGO/5 — once for the character, not once per power, and only
        // when a Mental Defense power actually counts in this form.
        if (this.isFifth(character) && unusualDefenses.some((defense) => defense.xmlid === 'MENTALDEFENSE')) {
            const egoBonus = roundInPlayersFavor(this.getCharacteristicTotal('EGO', character) / 5);

            points += egoBonus;

            if (anyResistant) {
                resistantPoints += egoBonus;
            }
        }

        defenses.nonResistant = points;

        if (anyResistant) {
            defenses.resistant = resistantPoints;
        }

        return points;
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
