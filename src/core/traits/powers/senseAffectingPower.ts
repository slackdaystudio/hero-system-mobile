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

import {type Obj} from '../characterTrait';
import {TraitDecorator} from '../traitDecorator';

interface SenseCounts {
    group: number;
    sense: number;
}

/** Sense-affecting power cost (per sense/sense-group), ported from legacy `powers/SenseAffectingPower.js`. */
export default class SenseAffectingPower extends TraitDecorator {
    cost(): number {
        const counts = this.getCounts();
        const trait = this.characterTrait.trait;

        return ((counts.group * trait.template.groupcost + counts.sense * trait.template.sensecost) * trait.levels) / trait.template.lvlval;
    }

    private getCounts(): SenseCounts {
        const counts: SenseCounts = {group: 0, sense: 0};

        if (this.isGroup(this.characterTrait.trait.option)) {
            counts.group++;
        } else {
            counts.sense++;
        }

        this.getAdderCounts(this.characterTrait.trait.adder, counts);

        return counts;
    }

    private getAdderCounts(adders: Obj | Obj[] | null | undefined, counts: SenseCounts): SenseCounts {
        if (adders === null || adders === undefined) {
            return counts;
        }

        if (Array.isArray(adders)) {
            for (const adder of adders) {
                this.getAdderCounts(adder, counts);
            }
        } else {
            if (this.isGroup(adders.xmlid)) {
                counts.group++;
            } else {
                counts.sense++;
            }
        }

        return counts;
    }

    private isGroup(name: string): boolean {
        return name.endsWith('GROUP');
    }
}
