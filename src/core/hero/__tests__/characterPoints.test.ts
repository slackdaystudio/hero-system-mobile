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
 * `characterPoints` classifies a character's declared build total into the 6E1 "Character Point
 * Guidelines" tiers (6E1 34) and reads back the base/experience the nameplate shows. The oracle is
 * that table, not legacy — nothing legacy did is preserved here. The fixtures double as a check that
 * the numbers are read from the real `.hdc` `<BASIC_CONFIGURATION>` block, not invented.
 */
import {pointSummary, powerTier, readBasicConfiguration, type BasicConfiguration} from '../characterPoints';
import type {CharacterDocument} from 'core/ports';
import twilight from './fixtures/twilight.json';
import starborne from './fixtures/starborne.json';
import jason from './fixtures/jason.json';
import defensor from './fixtures/defensor.json';
import fifth from './fixtures/fifth.json';
import spyder from './fixtures/spyder2022.json';

const config = (basePoints: number, disadPoints: number, experience = 0): BasicConfiguration => ({basePoints, disadPoints, experience});

describe('powerTier', () => {
    it('names each 6E1 tier at its base-point anchor', () => {
        expect(powerTier(50, false)).toBe('Skilled Normal');
        expect(powerTier(100, false)).toBe('Competent Normal');
        expect(powerTier(175, false)).toBe('Standard Heroic');
        expect(powerTier(225, false)).toBe('Powerful Heroic');
        expect(powerTier(275, false)).toBe('Very Powerful Heroic');
        expect(powerTier(300, false)).toBe('Low-Powered Superheroic');
        expect(powerTier(400, false)).toBe('Standard Superheroic');
        expect(powerTier(500, false)).toBe('High-Powered Superheroic');
        expect(powerTier(650, false)).toBe('Very High-Powered Superheroic');
        expect(powerTier(750, false)).toBe('Cosmically Powerful Superheroic');
    });

    it('names each 5ER tier at its base-point anchor — a lower, distinct scale from 6E', () => {
        expect(powerTier(-25, true)).toBe('Incompetent Normal');
        expect(powerTier(0, true)).toBe('Standard Normal');
        expect(powerTier(25, true)).toBe('Skilled Normal');
        expect(powerTier(50, true)).toBe('Competent Normal');
        expect(powerTier(75, true)).toBe('Standard Heroic');
        expect(powerTier(100, true)).toBe('Powerful Heroic');
        expect(powerTier(125, true)).toBe('Very Powerful Heroic');
        expect(powerTier(150, true)).toBe('Low-Powered Superheroic');
        expect(powerTier(200, true)).toBe('Standard Superheroic');
        expect(powerTier(300, true)).toBe('High-Powered Superheroic');
        expect(powerTier(400, true)).toBe('Very High-Powered Superheroic');
        expect(powerTier(500, true)).toBe('Cosmically Powerful Superheroic');
    });

    it('takes the lower tier between two anchors, and floors instead of underflowing', () => {
        expect(powerTier(399, false)).toBe('Low-Powered Superheroic');
        expect(powerTier(499, false)).toBe('Standard Superheroic');
        expect(powerTier(1000, false)).toBe('Cosmically Powerful Superheroic');
        expect(powerTier(0, false)).toBe('Standard Normal');
        expect(powerTier(149, true)).toBe('Very Powerful Heroic');
        expect(powerTier(-100, true)).toBe('Incompetent Normal');
    });
});

describe('readBasicConfiguration', () => {
    it('reads the preserved config off a document', () => {
        expect(readBasicConfiguration({basicConfiguration: {basePoints: 400, disadPoints: 75, experience: 9}} as CharacterDocument)).toEqual(config(400, 75, 9));
    });

    it('returns null when the block is absent (imported before it was preserved, or a legacy row)', () => {
        expect(readBasicConfiguration({} as CharacterDocument)).toBeNull();
    });

    it('returns null when a field is missing or non-numeric rather than guessing', () => {
        expect(readBasicConfiguration({basicConfiguration: {basePoints: 400, disadPoints: 75}} as CharacterDocument)).toBeNull();
        expect(readBasicConfiguration({basicConfiguration: {basePoints: '400', disadPoints: 75, experience: 0}} as CharacterDocument)).toBeNull();
    });
});

describe('pointSummary', () => {
    // Fixtures are `.hdc`-parsed input carrying the real <BASIC_CONFIGURATION>; the boundary preserves
    // exactly this block onto the stored document, so reading it here mirrors production.
    it('classifies a 400-point 6E character as Standard Superheroic', () => {
        expect(pointSummary(twilight as CharacterDocument, false)).toEqual({base: 400, experience: 0, tier: 'Standard Superheroic'});
    });

    it('keeps experience out of the tier but shows it in the summary', () => {
        expect(pointSummary(starborne as CharacterDocument, false)).toEqual({base: 400, experience: 9, tier: 'Standard Superheroic'});
    });

    it('classifies a 6E Heroic character (275 base) as Very Powerful Heroic', () => {
        expect(pointSummary(jason as CharacterDocument, false)).toEqual({base: 275, experience: 25, tier: 'Very Powerful Heroic'});
    });

    it('classifies a 200-base 6E character as Standard Heroic', () => {
        expect(pointSummary(defensor as CharacterDocument, false)).toEqual({base: 200, experience: 0, tier: 'Standard Heroic'});
    });

    it('classifies a 200-base 5E character as Standard Superheroic (5E scale, keyed on base)', () => {
        expect(pointSummary(fifth as CharacterDocument, true)).toEqual({base: 200, experience: 0, tier: 'Standard Superheroic'});
    });

    it('classifies a 150-base 5E character as Low-Powered Superheroic', () => {
        expect(pointSummary(spyder as CharacterDocument, true)).toEqual({base: 150, experience: 8, tier: 'Low-Powered Superheroic'});
    });

    it('returns null when the config was never preserved', () => {
        expect(pointSummary({} as CharacterDocument, false)).toBeNull();
    });
});
