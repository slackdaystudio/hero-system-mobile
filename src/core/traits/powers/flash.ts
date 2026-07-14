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

import {toMap} from 'core/util';
import sensesData from 'core/data/herodesigner/Senses.json';
import {TraitDecorator} from '../traitDecorator';

const TARGETINGSENSE = 'TARGETINGSENSE';
const PLUSONEHALFDIE = 'PLUSONEHALFDIE';

const senses = sensesData as unknown as {sensegroup: Array<Record<string, any>>; sense: Array<Record<string, any>>};

/** Flash cost (per targeting/non-targeting sense), ported from legacy `powers/Flash.js`. */
export default class Flash extends TraitDecorator {
    cost(): number {
        let cost = 0;
        const trait = this.characterTrait.trait;
        const adderMap = toMap(trait.adder);

        if (this.isTargeting(trait.optionid)) {
            cost += trait.template.targetingcost * trait.levels;
        } else {
            cost += trait.template.nontargetingcost * trait.levels;
        }

        for (const xmlid of adderMap.keys()) {
            if (this.isSense(xmlid as string)) {
                if (this.isTargeting(xmlid as string)) {
                    cost += this.isGroup(xmlid as string) ? trait.template.targetinggroupcost : trait.template.targetingsensecost;
                } else {
                    cost += this.isGroup(xmlid as string) ? trait.template.nontargetinggroupcost : trait.template.nontargetingsensecost;
                }
            }
        }

        if (adderMap.has(PLUSONEHALFDIE)) {
            cost += (adderMap.get(PLUSONEHALFDIE) as {basecost: number}).basecost;
        }

        return Math.round(cost);
    }

    private isSense(xmlid: string): boolean {
        for (const senseGroup of senses.sensegroup) {
            if (senseGroup.xmlid.toUpperCase() === xmlid.toUpperCase()) {
                return true;
            }
        }

        for (const sense of senses.sense) {
            if (sense.xmlid.toUpperCase() === xmlid.toUpperCase()) {
                return true;
            }
        }

        return false;
    }

    private isTargeting(xmlid: string): boolean {
        const key = this.isGroup(xmlid) ? 'sensegroup' : 'sense';

        for (const senseItem of senses[key]) {
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

    private isGroup(name: string): boolean {
        return name.endsWith('GROUP');
    }
}
