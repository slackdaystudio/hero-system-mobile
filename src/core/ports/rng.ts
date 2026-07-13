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
 * Randomness port. The domain never reaches for a concrete generator; it asks
 * for one integer at a time through this interface. Infra wires a real adapter
 * (pure-rand / Math.random); tests wire a seeded generator for reproducibility.
 *
 * Replaces the legacy coupling where `DieRoller` imported `getRandomNumber`
 * straight off `App.js`.
 */
export interface Rng {
    /** A uniformly distributed integer in the inclusive range [min, max]. */
    next(min: number, max: number): number;
}
