import { Alert } from 'react-native';
import CharacterTrait from '../CharacterTrait';
import { common } from '../../lib/Common';
import senses from '../../../public/Senses.json';

// Copyright 2020 Philip J. Guinchard
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

const TARGETINGSENSE = 'TARGETINGSENSE';

const PLUSONEHALFDIE = 'PLUSONEHALFDIE';

export default class Flash extends CharacterTrait {
    constructor(characterTrait) {
        super(characterTrait.trait, characterTrait.listKey, characterTrait.getCharacter);

        this.characterTrait = characterTrait;
    }

    cost() {
        let cost = 0;
        let adderMap = common.toMap(this.characterTrait.trait.adder);

        if (this._isTargeting(this.characterTrait.trait.optionid)) {
            cost += this.characterTrait.trait.template.targetingcost * this.characterTrait.trait.levels;
        } else {
            cost += this.characterTrait.trait.template.nontargetingcost * this.characterTrait.trait.levels;
        }

        for (let xmlid of adderMap.keys()) {
            if (this._isSense(xmlid)) {
                if (this._isTargeting(xmlid)) {
                    if (this._isGroup(xmlid)) {
                        cost += this.characterTrait.trait.template.targetinggroupcost;
                    } else {
                        cost += this.characterTrait.trait.template.targetingsensecost;
                    }
                } else {
                     if (this._isGroup(xmlid)) {
                         cost += this.characterTrait.trait.template.nontargetinggroupcost;
                     } else {
                         cost += this.characterTrait.trait.template.nontargetingsensecost;
                     }
                }
            }
        }

        if (adderMap.has(PLUSONEHALFDIE)) {
            cost += adderMap.get(PLUSONEHALFDIE).basecost;
        }

        return Math.round(cost);
    }

    costMultiplier() {
        return this.characterTrait.costMultiplier();
    }

    activeCost() {
        return this.characterTrait.activeCost();
    }

    realCost() {
        return this.characterTrait.realCost();
    }

    label() {
        return this.characterTrait.label();
    }

    attributes() {
        return this.characterTrait.attributes();
    }

    definition() {
        return this.characterTrait.definition();
    }

    roll() {
        return this.characterTrait.roll();
    }

    advantages() {
        return this.characterTrait.advantages();
    }

    limitations() {
        return this.characterTrait.limitations();
    }

    _isSense(xmlid) {
        for (let senseGroup of senses.sensegroup) {
            if (senseGroup.xmlid.toUpperCase() === xmlid.toUpperCase()) {
                return true;
            }
        }

        for (let sense of senses.sense) {
            if (sense.xmlid.toUpperCase() === xmlid.toUpperCase()) {
                return true;
            }
        }

        return false;
    }

    _isTargeting(xmlid) {
        let key = this._isGroup(xmlid) ? 'sensegroup' : 'sense';

        for (let senseItem of senses[key]) {
            if (senseItem.xmlid.toUpperCase() === xmlid.toUpperCase()) {
                if (Array.isArray(senseItem.provides)) {
                    return senseItem.provides.includes(TARGETINGSENSE);
                } else {
                    return senseItem.provides === TARGETINGSENSE;
                }
            }
        }

        return false;
    }

    _isGroup(name) {
        return name.endsWith('GROUP');
    }
}