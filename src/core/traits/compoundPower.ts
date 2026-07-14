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

import {CharacterTrait, type Obj} from './characterTrait';
import {TraitDecorator} from './traitDecorator';

interface TraitFactory {
    decorate(item: Obj, listKey: string, getCharacter: () => Obj): CharacterTrait;
}

/** A compound power: sums the cost of its re-decorated child powers. Ported from
 *  legacy `decorators/CompoundPower.js`. */
export default class CompoundPower extends TraitDecorator {
    private powers: CharacterTrait[];
    private characterTraitDecorator: TraitFactory;

    constructor(characterTrait: CharacterTrait, characterTraitDecorator: TraitFactory) {
        super(characterTrait);

        this.characterTraitDecorator = characterTraitDecorator;
        this.powers = this.getCompoundPowers(this.characterTrait.trait.powers);
    }

    cost(): number {
        let cost = 0;

        for (const power of this.powers) {
            cost += power.cost();
        }

        return cost;
    }

    activeCost(): number {
        let activeCost = 0;

        for (const power of this.powers) {
            activeCost += power.activeCost();
        }

        return activeCost;
    }

    realCost(): number {
        let realCost = 0;

        for (const power of this.powers) {
            realCost += power.realCost();
        }

        return realCost;
    }

    private getCompoundPowers(powers: Obj | Obj[]): CharacterTrait[] {
        let compoundPowers: CharacterTrait[] = [];

        if (Array.isArray(powers)) {
            for (const power of powers) {
                compoundPowers = compoundPowers.concat(this.getCompoundPowers(power));
            }
        } else {
            compoundPowers.push(this.characterTraitDecorator.decorate(powers, this.characterTrait.listKey, this.characterTrait.getCharacter));
        }

        return compoundPowers;
    }
}
