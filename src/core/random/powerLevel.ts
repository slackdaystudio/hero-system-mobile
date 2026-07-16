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
 * The campaign power levels a character can be generated at (docs/RANDOM_CHARACTER.md).
 *
 * A level is a `(base, limit, total)` triple, not a single number. **The rulebooks quote the
 * two editions in different units**, which is the single easiest thing to get wrong here:
 *
 * ```
 * 5E is quoted  base / disads         → ADD       150/100 → 250 total
 * 6E is quoted  total / complications → SUBTRACT  400/75  → 325 base, 400 total
 * ```
 *
 * Reduced to the triple they agree — `total === base + limit` — so nothing downstream needs to
 * know which edition quoted what. Everything here is already reduced.
 */
import type {BasicConfiguration} from 'core/hero';
import {SUPERHEROIC_5E, SUPERHEROIC_6E} from './characteristics';

export type Edition = '5e' | '6e';

export interface PowerLevel {
    readonly id: string;
    readonly name: string;
    readonly edition: Edition;
    /** Points the character starts with. */
    readonly base: number;
    /** Disadvantage (5E) / complication (6E) limit. Always taken in full — see below. */
    readonly limit: number;
    /** `base + limit`: what the buckets actually spend. */
    readonly total: number;
    /** Drives the edition throughout the engine. */
    readonly template: string;
}

/**
 * Disadvantages/complications are taken at the **fixed limit**. In theory a character may take
 * fewer; in practice essentially nobody does, so the limit is a constant rather than a variable
 * the allocator has to solve for.
 */
export const POWER_LEVELS: readonly PowerLevel[] = [
    {id: '5e-low', name: '5E Low Powered Superheroic', edition: '5e', base: 150, limit: 100, total: 250, template: SUPERHEROIC_5E},
    {id: '5e-standard', name: '5E Standard Superheroic', edition: '5e', base: 200, limit: 150, total: 350, template: SUPERHEROIC_5E},
    {id: '6e-low', name: '6E Low-Powered', edition: '6e', base: 240, limit: 60, total: 300, template: SUPERHEROIC_6E},
    {id: '6e-standard', name: '6E Standard', edition: '6e', base: 325, limit: 75, total: 400, template: SUPERHEROIC_6E},
] as const;

/** The two the legacy data and the original ask target: 250 and 400 — both totals. */
export const LOW_POWERED_5E = POWER_LEVELS[0];
export const STANDARD_6E = POWER_LEVELS[3];

/**
 * The `<BASIC_CONFIGURATION>` a real `.hdc` at this level would carry — synthesized so a generated
 * character reads the same declared points/tier as an imported one (`core/hero` `characterPoints`).
 * Mirrors how HD quotes each edition: 6E writes the *total* as base points, 5E writes the base.
 */
export const declaredConfiguration = (level: PowerLevel): BasicConfiguration =>
    level.edition === '6e'
        ? {basePoints: level.total, disadPoints: level.limit, experience: 0}
        : {basePoints: level.base, disadPoints: level.limit, experience: 0};

export const powerLevel = (id: string): PowerLevel => {
    const level = POWER_LEVELS.find((candidate) => candidate.id === id);

    if (level === undefined) {
        throw new Error(`Unknown power level: ${id}`);
    }

    return level;
};
