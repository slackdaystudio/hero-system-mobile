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

import {type Attribute} from '../characterTrait';
import {TraitDecorator} from '../traitDecorator';

/** Density Increase, ported from legacy `powers/DensityIncrease.js`. */
export default class DensityIncrease extends TraitDecorator {
    cost(): number {
        return this.characterTrait.trait.levels * 5 - 5;
    }

    attributes(): Attribute[] {
        const attributes = this.characterTrait.attributes();
        const levels = this.characterTrait.trait.levels;

        attributes.push({label: `+${levels * 5} STR`, value: ''});
        attributes.push({label: `${100 * 2 ** levels} kg mass`, value: ''});
        attributes.push({label: `+${levels} PD/ED`, value: ''});
        attributes.push({label: `-${levels * 2} KB`, value: ''});

        return attributes;
    }
}
