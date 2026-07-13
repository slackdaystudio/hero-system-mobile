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

import prand from 'pure-rand';
import type {Rng} from 'core/ports';

/**
 * A deterministic {@link Rng} for tests. Uses the exact generator the legacy app
 * uses in its "increase entropy" path (`prand.xoroshiro128plus` +
 * `uniformIntDistribution`), so a given seed produces the identical draw stream.
 * That equivalence is what lets the golden-master harness feed the same seed to
 * both the legacy roller and the ported core and expect identical results.
 */
export const seededRng = (seed: number): Rng => {
    let generator = prand.xoroshiro128plus(seed);

    return {
        next(min: number, max: number): number {
            const [value, nextGenerator] = prand.uniformIntDistribution(min, max, generator);
            generator = nextGenerator;
            return value;
        },
    };
};

/**
 * The legacy `getRandomNumber(min, max, rolls)` contract, backed by a seeded
 * generator. Returns a bare number for a single roll and an array otherwise —
 * exactly what the legacy `DieRoller` expects when we mock `App.js` in the
 * golden-master harness.
 */
export const legacyGetRandomNumber = (rng: Rng) => (min: number, max: number, rolls = 1): number | number[] => {
    const results: number[] = [];

    for (let i = 0; i < rolls; i++) {
        results.push(rng.next(min, max));
    }

    return results.length === 1 ? results[0] : results;
};
