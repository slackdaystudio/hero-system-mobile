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

import {roundInPlayersFavor} from 'core/util';
import {type Attribute} from '../characterTrait';
import {TraitDecorator} from '../traitDecorator';

/**
 * Faster-Than-Light travel, ported from legacy `powers/Ftl.js`. The speed is the
 * whole label and the value is empty — legacy's shape, kept so the sheet reads the
 * same as it always did.
 */
export default class Ftl extends TraitDecorator {
    attributes(): Attribute[] {
        const attributes = this.characterTrait.attributes();

        attributes.push({label: this.getSpeed(), value: ''});

        return attributes;
    }

    private getSpeed(): string {
        const trait = this.characterTrait.trait;
        let speed = trait.template.lvlpower ** Math.round(trait.levels / trait.template.lvlval);
        let units = 'year';

        if (speed > 31536000) {
            units = 'second';
            speed = speed / 31536000;
        } else if (speed > 525600) {
            units = 'minute';
            speed = speed / 525600;
        } else if (speed > 8760) {
            units = 'hour';
            speed = speed / 8760;
        } else if (speed > 365) {
            units = 'day';
            speed = speed / 365;
        } else if (speed > 52) {
            units = 'week';
            speed = speed / 52;
        } else if (speed > 12) {
            units = 'month';
            speed = speed / 12;
        }

        return `${roundInPlayersFavor(speed)} Light Years/${units}`;
    }
}
