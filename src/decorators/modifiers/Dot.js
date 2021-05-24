import Modifier from './Modifier';

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

export default class Dot extends Modifier {
    constructor(decorated) {
        super(decorated.modifier, decorated.trait);

        this.decorated = decorated;
    }

    cost() {
        let totalCost = this.decorated.basecost;
        let incrementCost = this._getAdderByXmlId('INCREMENTS', this.decorated.modifier.adder).basecost || 0;
        let timeCost = this._getAdderByXmlId('TIMEBETWEEN', this.decorated.modifier.adder).basecost || 0;

        if (this.decorated.modifier !== undefined) {
            if (Array.isArray(this.decorated.modifier)) {
                for (let mod of this.decorated.modifier) {
                    if (mod.xmlid.toUpperCase() === 'ONEDEFENSE') {
                        incrementCost *= 2;
                    } else if (mod.xmlid.toUpperCase() === 'LOCKOUT') {
                        if (timeCost > 0) {
                            timeCost = 0;
                        } else {
                            timeCost *= 2;
                        }
                    }
                }
            } else {
                if (this.decorated.modifier.xmlid.toUpperCase() === 'ONEDEFENSE') {
                    incrementCost *= 2;
                } else if (this.decorated.modifier.xmlid.toUpperCase() === 'LOCKOUT') {
                    if (timeCost > 0) {
                        timeCost = 0;
                    } else {
                        timeCost *= 2;
                    }
                }
            }
        }

        return totalCost + incrementCost + timeCost;
    }

    label(cost) {
        return this.decorated.label(this.cost());
    }

    _getAdderByXmlId(xmlId, adders) {
        for (let adder of adders) {
            if (adder.xmlid.toUpperCase() === xmlId.toUpperCase()) {
                return adder;
            }
        }

        return null;
    }
}
