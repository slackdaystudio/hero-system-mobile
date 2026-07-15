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
    all: number;
    group: number;
    sense: number;
}

/** Sense-affecting power cost (per sense/sense-group), ported from legacy `powers/SenseAffectingPower.js`. */
export default class SenseAffectingPower extends TraitDecorator {
    /**
     * H9 (docs/KNOWN_DEVIATIONS.md) — intentional divergence: legacy read `groupcost` and
     * `sensecost` but never `allcost`, so an option of `ALL` fell through to the *sense* branch
     * and a power enhancing **every** sense cost the same as one enhancing a single sense.
     * `adamantine`'s Enhanced Perception (`levels: 9`, `optionid: ALL`) priced 9 where the rules
     * say 27.
     *
     * `?? 0` on `allcost` is load-bearing: only `enhancedperception` carries it of the five
     * powers routed here, and `0 * undefined` is `NaN` — so an un-counted `all` must contribute
     * a real zero.
     */
    cost(): number {
        const counts = this.getCounts();
        const trait = this.characterTrait.trait;
        const perLevel = counts.all * (trait.template.allcost ?? 0) + counts.group * trait.template.groupcost + counts.sense * trait.template.sensecost;

        return (perLevel * trait.levels) / trait.template.lvlval;
    }

    private getCounts(): SenseCounts {
        const counts: SenseCounts = {all: 0, group: 0, sense: 0};

        this.tally(this.characterTrait.trait.option, counts);
        this.getAdderCounts(this.characterTrait.trait.adder, counts);

        return counts;
    }

    /**
     * `ALL` only counts as all-senses where the template prices it. Of the powers routed through
     * here, only Enhanced Perception does; the others keep legacy's behaviour rather than being
     * given a price the rules data never stated for them.
     */
    private tally(name: string, counts: SenseCounts): void {
        if (this.isAll(name) && this.characterTrait.trait.template.allcost !== undefined) {
            counts.all++;
        } else if (this.isGroup(name)) {
            counts.group++;
        } else {
            counts.sense++;
        }
    }

    private isAll(name: string): boolean {
        return String(name).toUpperCase() === 'ALL';
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
            this.tally(adders.xmlid, counts);
        }

        return counts;
    }

    private isGroup(name: string): boolean {
        return name.endsWith('GROUP');
    }
}
