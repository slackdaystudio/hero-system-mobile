import { Alert } from 'react-native';
import { heroDesignerCharacter } from './HeroDesignerCharacter';
import { character as libCharacter } from './Character';
import speedTable from '../../public/speed.json';

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

class CombatDetails {
    init(character) {
        let combatDetails = {};

        character.showSecondary = false;
        combatDetails.primary = this._init(character);

        character.showSecondary = true;
        combatDetails.secondary = this._init(character);

        return combatDetails;
    }

    sync(character, oldCharacter) {
        character.combatDetails = this.init(character);

        if (oldCharacter.hasOwnProperty('combatDetails')) {
            character.combatDetails.primary = {...oldCharacter.combatDetails.primary};
            character.combatDetails.secondary = {...oldCharacter.combatDetails.secondary};

            if (libCharacter.isHeroDesignerCharacter(character)) {
                this._syncPhases(character.combatDetails.primary, oldCharacter.combatDetails.primary);
                this._syncPhases(character.combatDetails.secondary, oldCharacter.combatDetails.secondary);
            }
        }
    }

    _init(character, showSecondary) {
        let combatDetails = {
            stun: 0,
            body: 0,
            endurance: 0
        }

        if (libCharacter.isHeroDesignerCharacter(character)) {
            combatDetails = {
                stun: this._getCharacteristic(character, 'stun'),
                body: this._getCharacteristic(character, 'body'),
                endurance: this._getCharacteristic(character, 'end'),
                ocv: this._getCharacteristic(character, 'ocv'),
                dcv: this._getCharacteristic(character, 'dcv'),
                omcv: this._getCharacteristic(character, 'omcv'),
                dmcv: this._getCharacteristic(character, 'dmcv'),
                phases: this._initPhases(character),
            };
        } else {
            combatDetails = {
                stun: libCharacter.getCharacteristic(character.characteristics.characteristic, 'stun'),
                body: libCharacter.getCharacteristic(character.characteristics.characteristic, 'body'),
                endurance: libCharacter.getCharacteristic(character.characteristics.characteristic, 'endurance'),
            };
        }

        return combatDetails;
    }

    _syncPhases(combatDetails, oldCombatDetails) {
        for (let phase of Object.keys(combatDetails.phases)) {
            if (oldCombatDetails.phases.hasOwnProperty(phase)) {
                combatDetails.phases[phase].used = oldCombatDetails.phases[phase].used;
                combatDetails.phases[phase].aborted = oldCombatDetails.phases[phase].aborted;
            }
        }
    }

    _getCharacteristic(character, shortName) {
        if (character.showSecondary) {
            return heroDesignerCharacter.getCharacteristicTotal(shortName, character)
        }

        let characteristic = heroDesignerCharacter.getCharacteristicByShortName(shortName, character);

        return characteristic === null ? 0 : characteristic.value;
    }

    _initPhases(character) {
        let speed = 1;
        let phases = {};

        if (character.showSecondary) {
            speed = heroDesignerCharacter.getCharacteristicTotal('SPD', character);
        } else {
            let speedCharacteristic = heroDesignerCharacter.getCharacteristicByShortName('SPD', character);

            speed = speedCharacteristic === null ? 1 : speedCharacteristic.value;
        }

        for (let phase of speedTable[(speed > 12 ? '12' : speed.toString())].phases) {
            phases[phase.toString()] = {
                used: false,
                aborted: false,
            }
        }

        return phases;
    }
}

export let combatDetails = new CombatDetails();
