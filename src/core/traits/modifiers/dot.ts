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
import Modifier from './modifier';

/** Damage-Over-Time advantage cost, ported from legacy `modifiers/Dot.js`. */
export default class Dot extends Modifier {
    private decorated: Modifier;

    constructor(decorated: Modifier) {
        super(decorated.modifier, decorated.trait, decorated.getCharacter);

        this.decorated = decorated;
    }

    cost(): number {
        const totalCost = (this.decorated as unknown as {basecost: number}).basecost;
        let incrementCost = this.getAdderByXmlId('INCREMENTS', this.decorated.modifier.adder)!.basecost || 0;
        let timeCost = this.getAdderByXmlId('TIMEBETWEEN', this.decorated.modifier.adder)!.basecost || 0;

        if (this.decorated.modifier !== undefined) {
            if (Array.isArray(this.decorated.modifier)) {
                for (const mod of this.decorated.modifier) {
                    if (mod.xmlid.toUpperCase() === 'ONEDEFENSE') {
                        incrementCost *= 2;
                    } else if (mod.xmlid.toUpperCase() === 'LOCKOUT') {
                        timeCost = timeCost > 0 ? 0 : timeCost * 2;
                    }
                }
            } else {
                if (this.decorated.modifier.xmlid.toUpperCase() === 'ONEDEFENSE') {
                    incrementCost *= 2;
                } else if (this.decorated.modifier.xmlid.toUpperCase() === 'LOCKOUT') {
                    timeCost = timeCost > 0 ? 0 : timeCost * 2;
                }
            }
        }

        return totalCost + incrementCost + timeCost;
    }

    label(): string {
        return this.decorated.label(this.cost());
    }

    private getAdderByXmlId(xmlId: string, adders: Obj[]): Obj | null {
        for (const adder of adders) {
            if (adder.xmlid.toUpperCase() === xmlId.toUpperCase()) {
                return adder;
            }
        }

        return null;
    }
}
