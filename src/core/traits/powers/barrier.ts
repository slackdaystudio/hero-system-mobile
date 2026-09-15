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

import {totalAdders} from 'core/util';
import {heroDesignerCharacter} from 'core/hero';
import {type Attribute} from '../characterTrait';
import {TraitDecorator} from '../traitDecorator';

/** Barrier / Force Wall, ported from legacy `powers/Barrier.js`. */
export default class Barrier extends TraitDecorator {
    cost(): number {
        let cost = this.characterTrait.trait.basecost;

        if (heroDesignerCharacter.isFifth(this.characterTrait.getCharacter())) {
            cost += this.getFifthEditionDefenseCost();
        } else {
            cost += this.getSixthEditionDefenseCost();
        }

        cost += totalAdders(this.characterTrait.trait.adder);

        return Math.round(cost);
    }

    private getFifthEditionDefenseCost(): number {
        const trait = this.characterTrait.trait;
        const totalDefense = trait.pdlevels + trait.edlevels + trait.mdlevels + trait.powdlevels;

        let cost = (totalDefense / trait.template.lvlval) * trait.template.lvlcost;
        cost += trait.lengthlevels * 2;
        cost += trait.heightlevels * 2;

        return cost;
    }

    private getSixthEditionDefenseCost(): number {
        const trait = this.characterTrait.trait;
        const totalDefense = trait.pdlevels + trait.edlevels + trait.mdlevels + trait.powdlevels;

        let cost = (totalDefense / trait.template.lvlval) * trait.template.lvlcost;
        cost += trait.lengthlevels;
        cost += trait.heightlevels;
        cost += trait.bodylevels;
        cost += (trait.widthlevels * 4) / trait.template.costperinch;

        return cost;
    }

    attributes(): Attribute[] {
        const attributes = this.characterTrait.attributes();
        const trait = this.characterTrait.trait;

        if (trait.pdlevels > 0) {
            attributes.push({label: 'Physical Defense', value: trait.pdlevels});
        }

        if (trait.edlevels > 0) {
            attributes.push({label: 'Energy Defense', value: trait.edlevels});
        }

        if (trait.mdlevels > 0) {
            attributes.push({label: 'Mental Defense', value: trait.mdlevels});
        }

        if (trait.powdlevels > 0) {
            attributes.push({label: 'Power Defense', value: trait.powdlevels});
        }

        attributes.push({label: 'Body', value: trait.bodylevels});

        // 5E barriers are a flat length × height in inches; 6E adds a width in metres.
        if (heroDesignerCharacter.isFifth(this.characterTrait.getCharacter())) {
            attributes.push({label: 'Dimensions', value: `${trait.lengthlevels + 1}" x ${trait.heightlevels + 1}"`});
        } else {
            attributes.push({
                label: 'Dimensions',
                value: `${trait.lengthlevels + 1}m x ${trait.widthlevels + 0.5}m x ${trait.heightlevels + 1}m`,
            });
        }

        return attributes;
    }
}
