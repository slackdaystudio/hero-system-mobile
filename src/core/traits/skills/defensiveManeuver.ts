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

import {TraitDecorator} from '../traitDecorator';

/** Defense Maneuver cost (from the selected option), ported from legacy `skills/DefensiveManeuver.js`. */
export default class DefensiveManeuver extends TraitDecorator {
    cost(): number {
        let cost = 0;

        for (const option of this.characterTrait.trait.template.option) {
            if (option.xmlid.toUpperCase() === this.characterTrait.trait.optionid.toUpperCase()) {
                cost = option.basecost;
                break;
            }
        }

        return cost;
    }
}
