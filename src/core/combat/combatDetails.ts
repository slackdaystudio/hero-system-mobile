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

import {roundInPlayersFavor} from 'core/util';
import {heroDesignerCharacter} from 'core/hero';
import speedData from 'core/data/speed.json';

type Obj = Record<string, any>;

const speedTable = speedData as unknown as Record<string, {phases: number[]}>;

const hasOwn = (obj: object, key: string): boolean => Object.prototype.hasOwnProperty.call(obj, key);

/**
 * Combat state derived from a character: STUN/BODY/END, combat values, and the
 * per-SPEED phase chart, computed for both primary and secondary (showSecondary)
 * totals. Ported from legacy `src/lib/CombatDetails.js`.
 */
export class CombatDetails {
    init(character: Obj): Obj {
        const combatDetails: Obj = {};

        character.showSecondary = false;
        combatDetails.primary = this.initDetails(character);

        character.showSecondary = true;
        combatDetails.secondary = this.initDetails(character);

        return combatDetails;
    }

    sync(character: Obj, oldCharacter: Obj): void {
        character.combatDetails = this.init(character);

        if (hasOwn(oldCharacter, 'combatDetails')) {
            character.combatDetails.primary = {...oldCharacter.combatDetails.primary};
            character.combatDetails.secondary = {...oldCharacter.combatDetails.secondary};

            this.syncPhases(character.combatDetails.primary, oldCharacter.combatDetails.primary);
            this.syncPhases(character.combatDetails.secondary, oldCharacter.combatDetails.secondary);
        }
    }

    private initDetails(character: Obj): Obj {
        let combatDetails: Obj = {stun: 0, body: 0, endurance: 0};

        if (heroDesignerCharacter.isFifth(character)) {
            const cv = roundInPlayersFavor(this.getCharacteristic(character, 'dex') / 3);

            combatDetails = {
                stun: this.getCharacteristic(character, 'stun'),
                body: this.getCharacteristic(character, 'body'),
                endurance: this.getCharacteristic(character, 'end'),
                statuses: [],
                ocv: cv,
                dcv: cv,
                phases: this.initPhases(character),
            };
        } else {
            combatDetails = {
                stun: this.getCharacteristic(character, 'stun'),
                body: this.getCharacteristic(character, 'body'),
                endurance: this.getCharacteristic(character, 'end'),
                ocv: this.getCharacteristic(character, 'ocv'),
                dcv: this.getCharacteristic(character, 'dcv'),
                omcv: this.getCharacteristic(character, 'omcv'),
                dmcv: this.getCharacteristic(character, 'dmcv'),
                phases: this.initPhases(character),
            };
        }

        return combatDetails;
    }

    private syncPhases(combatDetails: Obj, oldCombatDetails: Obj): void {
        for (const phase of Object.keys(combatDetails.phases)) {
            if (hasOwn(oldCombatDetails.phases, phase)) {
                combatDetails.phases[phase].used = oldCombatDetails.phases[phase].used;
                combatDetails.phases[phase].aborted = oldCombatDetails.phases[phase].aborted;
            }
        }
    }

    private getCharacteristic(character: Obj, shortName: string): number {
        if (character.showSecondary) {
            return heroDesignerCharacter.getCharacteristicTotal(shortName, character);
        }

        const characteristic = heroDesignerCharacter.getCharacteristicByShortName(shortName, character);

        return characteristic === null ? 0 : characteristic.value;
    }

    private initPhases(character: Obj): Obj {
        let speed = 1;
        const phases: Obj = {};

        if (character.showSecondary) {
            speed = heroDesignerCharacter.getCharacteristicTotal('SPD', character);
        } else {
            const speedCharacteristic = heroDesignerCharacter.getCharacteristicByShortName('SPD', character);

            speed = speedCharacteristic === null ? 1 : speedCharacteristic.value;
        }

        for (const phase of speedTable[speed > 12 ? '12' : speed.toString()].phases) {
            phases[phase.toString()] = {used: false, aborted: false};
        }

        return phases;
    }
}

export const combatDetails = new CombatDetails();
