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

/**
 * END-per-power derivation (6E). Oracle is the rulebook rule — 1 END per 10 Active Points, min 1,
 * for powers that cost END — plus the template `usesend` flag and the Costs/Reduced Endurance
 * modifiers observed on real characters (see the field map gathered while building this).
 */
import {enduranceCost, usesEndurance} from '../enduranceCost';

type Obj = Record<string, any>;

const power = (usesend: boolean | undefined, modifier: Obj[] = []): Obj => ({template: usesend === undefined ? undefined : {usesend}, modifier});

describe('usesEndurance', () => {
    it('follows the template default: attacks/constant powers cost END, defenses and senses do not', () => {
        expect(usesEndurance(power(true))).toBe(true);
        expect(usesEndurance(power(false))).toBe(false);
    });

    it('treats a framework container (no template) as not costing END', () => {
        expect(usesEndurance(power(undefined))).toBe(false);
    });

    it('lets a Costs Endurance modifier force END onto an otherwise-free power', () => {
        expect(usesEndurance(power(false, [{xmlid: 'COSTSEND'}]))).toBe(true);
        expect(usesEndurance(power(false, [{xmlid: 'COSTSENDTOMAINTAIN'}]))).toBe(true);
    });
});

describe('enduranceCost', () => {
    it('is 1 END per 10 Active Points', () => {
        expect(enduranceCost(power(true), 60)).toBe(6);
        expect(enduranceCost(power(true), 20)).toBe(2);
    });

    it('rounds to the nearest whole number (half up — pinned to 6E1 128)', () => {
        expect(enduranceCost(power(true), 55)).toBe(6); // 5.5 → 6
        expect(enduranceCost(power(true), 44)).toBe(4); // 4.4 → 4
        expect(enduranceCost(power(true), 45)).toBe(5); // 4.5 → 5
    });

    it('is a minimum of 1 for any power that costs END', () => {
        expect(enduranceCost(power(true), 5)).toBe(1);
        expect(enduranceCost(power(true), 0)).toBe(1);
    });

    it('is 0 for powers that do not cost END, and for framework containers', () => {
        expect(enduranceCost(power(false), 45)).toBe(0);
        expect(enduranceCost(power(undefined), 60)).toBe(0);
    });

    it('charges END on a defense bought Costs Endurance', () => {
        expect(enduranceCost(power(false, [{xmlid: 'COSTSEND'}]), 45)).toBe(5);
    });

    it('applies Reduced Endurance: 0 END zeroes it, ½ END halves it (still min 1)', () => {
        expect(enduranceCost(power(true, [{xmlid: 'REDUCEDEND', optionid: 'ZERO'}]), 60)).toBe(0);
        expect(enduranceCost(power(true, [{xmlid: 'REDUCEDEND', optionid: 'HALF'}]), 60)).toBe(3);
        expect(enduranceCost(power(true, [{xmlid: 'REDUCEDEND', optionid: 'HALF'}]), 5)).toBe(1);
    });

    it('finds a Reduced Endurance modifier nested inside another modifier', () => {
        const nested = power(true, [{xmlid: 'MODIFIER', modifier: [{xmlid: 'REDUCEDEND', optionid: 'ZERO'}]}]);
        expect(enduranceCost(nested, 60)).toBe(0);
    });
});
