import { Platform, Alert } from 'react-native';
import { Toast } from 'native-base';
import { DocumentPicker, DocumentPickerUtil } from 'react-native-document-picker';
import { common } from './Common';
import { NORMAL_DAMAGE, KILLING_DAMAGE, PARTIAL_DIE_PLUS_ONE, PARTIAL_DIE_HALF } from './DieRoller';
import { file } from './File';
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

class Character {
    constructor() {
        this.activeCostRegex = /\([0-9]+\sActive\sPoints\)/;
    }

    async load(startLoad, endLoad) {
        return file.loadCharacter(startLoad, endLoad);
    }

    isHeroDesignerCharacter(character) {
        return character.hasOwnProperty('version');
    }

    isFifthEdition(characteristics) {
        for (let characteristic of characteristics) {
            if (characteristic.name === 'comeliness' && characteristic.total !== '') {
                return true;
            }
        }

        return false;
    }

    getStrengthDamage(character) {
        let notes = this.getCharacteristic(character.characteristics.characteristic, 'strength', false).notes;
        let match = notes.match(/([0-9]+\s1\/)?[0-9]+d6/g);

        if (match.length === 2) {
            return match[1];
        }

        return match[0];
    }

    getPresenceDamage(character) {
        let notes = this.getCharacteristic(character.characteristics.characteristic, 'presence', false).notes;
        let match = notes.match(/([0-9]+\s1\/)?[0-9]+d6/g);

        if (match.length === 2) {
            return match[1];
        }

        return match[0];
    }

    getDefenses(character) {
        let pd = this.getCharacteristic(character.characteristics.characteristic, 'pd', false).notes.split(' ');
        let ed = this.getCharacteristic(character.characteristics.characteristic, 'ed', false).notes.split(' ');

        return [
            {
                label: 'Physical Defense',
                value: this._getDefense(pd[0]),
            }, {
                label: 'R. Physical Defense',
                value: this._getDefense((pd.length === 4 ? pd[2].slice(1) : 0)),
            }, {
                label: 'Energy Defense',
                value: this._getDefense(ed[0]),
            }, {
                label: 'R. Energy Defense',
                value: this._getDefense((ed.length === 4 ? ed[2].slice(1) : 0)),
            },
        ];
    }

    getCharacteristic(characteristics, name, totalOnly = true) {
        for (let characteristic of characteristics) {
            if (characteristic.name === name) {
                if (totalOnly) {
                    let total = characteristic.total;

                    if (total.indexOf('/') !== -1) {
                        total = total.split('/')[1];
                    }

                    return total;
                }

                return characteristic;
            }
        }

        return 0;
    }

    renderPower(power, index, render) {
        if (power.trim() === '') {
            return null;
        }

        let parts = power.split(/\(Total: [0-9]+\sActive\sCost,\s[0-9]+\sReal\sCost\)/);

        if (parts.length === 2) {
            return render(this._getCompoundPowerText(parts[0] + parts[1]), index);
        }

        parts = power.split(this.activeCostRegex);

        if (parts.length == 2) {
            return render(parts[0], index);
        }

        return render(this._getPower(power), index);
    }

    isAttackPower(text) {
        if (/(Killing\sAttack\s\-\sHand\-To\-Hand|HKA)/.test(text) ||
            /(Killing\sAttack\s\-\sRanged|RKA)/.test(text) ||
            /(Energy\sBlast|EB|Blast)/.test(text) ||
            /(Hand\-To\-Hand\sAttack|HA)/.test(text)) {
            return true;
        }

        return false;
    }

    getPresenceAttackDamage(presenceDamage) {
        let damage = {};
        let damageDice = this._getDamageDice(presenceDamage);

        damage.dice = damageDice.dice;
        damage.halfDice = damageDice.partialDie === PARTIAL_DIE_HALF ? 1 : 0;

        return damage;
    }

    getDamage(text, strengthDamage) {
        let damage = {};

        // Base strength damage
        if (text === null && strengthDamage !== '') {
            let damageDice = this._getDamageDice(strengthDamage);

            damage.dice = damageDice.dice;
            damage.partialDie = damageDice.partialDie;

            return damage;
        }

        let hka = this._getHka(text);

        if (hka !== null) {
            return hka;
        }

        let rka = this._getRka(text);

        if (rka !== null) {
            return rka;
        }

        let eb = this._getEb(text);

        if (eb !== null) {
            return eb;
        }

        let ha = this._getHa(text, strengthDamage);

        if (ha !== null) {
            return ha;
        }

        return damage;
    }

    _getHka(text) {
        let match = text.match(/(Killing\sAttack\s\-\sHand\-To\-Hand|HKA)\s.*([0-9]+\s1\/)?[0-9]+d6(\+1)?(\sw\/STR)?\)/);

        if (match !== null) {
            let damage = {};
            let damageDice = this._getDamageDice(match[0].slice(match[0].indexOf('(') + 1, match[0].lastIndexOf(' w/STR)')));

            damage.dice = damageDice.dice;
            damage.partialDie = damageDice.partialDie;
            damage.killingToggled = true;
            damage.damageType = KILLING_DAMAGE;

            return damage;
        }

        return null;
    }

    _getRka(text) {
        let match = text.match(/(Killing\sAttack\s\-\sRanged|RKA)\s.*([0-9]+\s1\/)?[0-9]+d6(\+1)?/);

        if (match !== null) {
            let damage = {};
            let damageParts = match[0].split(' ');
            let damageDice = this._getDamageDice(damageParts[(damageParts.length - 1)]);

            damage.dice = damageDice.dice;
            damage.partialDie = damageDice.partialDie;
            damage.killingToggled = true;
            damage.damageType = KILLING_DAMAGE;

            return damage;
        }

        return null;
    }

    _getEb(text) {
        let match = text.match(/(Energy\sBlast|EB|Blast)\s.*([0-9]+\s1\/)?[0-9]+d6(\+1)?/);

        if (match !== null) {
            let damage = {};
            let damageParts = match[0].split(' ');
            let damageDice = this._getDamageDice(damageParts[(damageParts.length - 1)]);

            damage.dice = damageDice.dice;
            damage.partialDie = damageDice.partialDie;
            damage.killingToggled = false;
            damage.damageType = NORMAL_DAMAGE;

            return damage;
        }

        return null;
    }

    _getHa(text, strengthDamage) {
        let match = text.match(/(Hand\-To\-Hand\sAttack|HA)\s\+([0-9]+\s1\/)?[0-9]+d6(\+1)?/);

        if (match !== null) {
            let damage = {};
            let damageParts = match[0].slice(match[0].indexOf('+') + 1);
            let damageDice = this._getDamageDice(damageParts);

            damage.dice = damageDice.dice;
            damage.partialDie = damageDice.partialDie;
            damage.killingToggled = false;
            damage.damageType = NORMAL_DAMAGE;

            return this._addStrengthDamage(damage, strengthDamage);
        }
    }

    _getDamageDice(rawDieCode) {
        let damageDice = {
            dice: 0,
            partialDie: 0,
        };

        let rawDieCodeParts = rawDieCode.split(' ');

        if (rawDieCodeParts.length === 2) {
            damageDice.dice = parseInt(rawDieCodeParts[0], 10);
            damageDice.partialDie = PARTIAL_DIE_HALF;

            return damageDice;
        }

        rawDieCodeParts = rawDieCode.split('+');

        if (rawDieCodeParts.length === 2) {
            damageDice.dice = parseInt(rawDieCodeParts[0].slice(0, -2), 10);
            damageDice.partialDie = PARTIAL_DIE_PLUS_ONE;

            return damageDice;
        }

        if (/[0-9]+d6/.test(rawDieCode)) {
            damageDice.dice = parseInt(rawDieCode.slice(0, -2), 10);

            return damageDice;
        }

        return damageDice;
    }

    _addStrengthDamage(damageForm, strengthDamage) {
        let strengthDamageDice = this._getDamageDice(strengthDamage);
        damageForm.dice += parseInt(strengthDamageDice.dice, 10);

        if (strengthDamageDice.partialDie !== 0) {
            if (strengthDamageDice.partialDie === PARTIAL_DIE_PLUS_ONE) {
                this._addDamageClass(damageForm);
            } else if (strengthDamageDice.partialDie === PARTIAL_DIE_HALF) {
                this._addDamageClass(damageForm);
                this._addDamageClass(damageForm);
            }
        }

        return damageForm;
    }

    _addDamageClass(damageForm) {
        if (damageForm.partialDie === 2) {
            damageForm.dice++;
            damageForm.partialDie = 0;
        } else {
            damageForm.partialDie++;
        }
    }

    _getDefense(defense) {
        if (defense.indexOf('/')) {
            let parts = defense.split('/');

            return parts[1];
        }

        return defense;
    }

    _getPower(power) {
        let powerText = '';

        if (power.indexOf(');') !== -1) {
            let powerParts = power.substring(0, power.lastIndexOf(');'));

            powerText += powerParts + ')';
        } else if (power.indexOf(';') !== -1) {
            let powerParts = power.substring(0, power.lastIndexOf(';'));

            powerText += powerParts;
        } else {
            powerText += power;
        }

        return powerText;
    }

    _getCompoundPowerText(text) {
        let powers = text.split(/\(Real\sCost:\s[0-9]+\)/g);
        let itemText = '';
        let powerParts = [];

        if (powers.length >= 1) {
            for (let i = 0; i < powers.length; i++) {
                powerParts = powers[i].split(this.activeCostRegex);

                if (powerParts.length == 2) {
                    itemText += powerParts[0];
                } else {
                    itemText += this._getPower(powers[i]);
                }

                if ((i + 1) !== powers.length) {
                    itemText += ' ';
                }
            }
        }

        return itemText;
    }
}

export let character = new Character();
