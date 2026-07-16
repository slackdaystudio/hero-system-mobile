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

import {enduranceAlert, describeSpend} from '../CombatStateProvider';

describe('enduranceAlert', () => {
    // max 40 → low threshold is 10.
    it('warns (danger) whenever a spend burns STUN', () => {
        expect(enduranceAlert(3, 0, 40, 7, 18)).toEqual({message: 'Out of Endurance — burned 18 STUN', variant: 'danger'});
    });

    it('warns (danger) the moment the pool empties, even without a burn', () => {
        expect(enduranceAlert(4, 0, 40, 0, 0)).toEqual({message: 'Out of Endurance — further exertion burns STUN', variant: 'danger'});
    });

    it('warns (warning) on the downward crossing below a quarter of the pool', () => {
        expect(enduranceAlert(12, 8, 40, 0, 0)).toEqual({message: 'Endurance low — 8 / 40', variant: 'warning'});
    });

    it('stays quiet while still above a quarter', () => {
        expect(enduranceAlert(40, 30, 40, 0, 0)).toBeNull();
        expect(enduranceAlert(12, 10, 40, 0, 0)).toBeNull(); // exactly the threshold is not "below"
    });

    it('does not nag a character who was already low', () => {
        expect(enduranceAlert(8, 5, 40, 0, 0)).toBeNull();
    });

    it('does not warn low when there is no END pool to speak of', () => {
        expect(enduranceAlert(0, 0, 0, 0, 0)).toBeNull();
    });
});

describe('describeSpend', () => {
    it('summarises a routine spend and a STUN-burning one', () => {
        expect(describeSpend({amount: 6, shortfall: 0, stunLost: 0})).toBe('Spent 6 END');
        expect(describeSpend({amount: 25, shortfall: 7, stunLost: 18})).toBe('Spent 25 END · 7 short → 18 STUN');
    });
});
