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

import {mathRandomRng} from '../mathRandomRng';

describe('mathRandomRng', () => {
    it('returns integers within the inclusive range and covers every face', () => {
        const rng = mathRandomRng();
        const seen = new Set<number>();

        for (let i = 0; i < 6000; i++) {
            const value = rng.next(1, 6);
            expect(Number.isInteger(value)).toBe(true);
            expect(value).toBeGreaterThanOrEqual(1);
            expect(value).toBeLessThanOrEqual(6);
            seen.add(value);
        }

        expect(seen.size).toBe(6);
    });

    it('handles a degenerate single-value range', () => {
        expect(mathRandomRng().next(4, 4)).toBe(4);
    });
});
