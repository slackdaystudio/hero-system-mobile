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

import {getTemplate, MAIN, MAIN_SIXTH} from 'core/templates';
import type {CharacteristicsBlock, HeroDesignerTemplateData, ItemCategory, TemplateItem} from 'core/templates';

const items = (template: HeroDesignerTemplateData, category: keyof HeroDesignerTemplateData, subKey: string): TemplateItem[] =>
    (template[category] as ItemCategory)[subKey] as TemplateItem[];

const allNullOverlay = (extendsId: string): HeroDesignerTemplateData => ({
    version: 2,
    extends: extendsId,
    mainapp: null,
    characteristics: null,
    skills: null,
    skillEnhancers: null,
    martialArts: null,
    perks: null,
    talents: null,
    powers: null,
    modifiers: null,
    disadvantages: null,
});

describe('getTemplate (core/templates)', () => {
    it('overlays add their items onto the base (Heroic appends modifiers)', () => {
        const baseCount = items(MAIN, 'modifiers', 'modifier').length;
        const merged = items(getTemplate('builtIn.Heroic.hdt'), 'modifiers', 'modifier');

        expect(merged.length).toBe(baseCount + 2);
        expect(merged[merged.length - 1].xmlid).toBe('STRMINIMUM');
    });

    it('overlays remove base items by upper-cased xmlid (AI strips every skill enhancer)', () => {
        const enhancers = items(getTemplate('builtIn.AI.hdt'), 'skillEnhancers', 'enhancer');

        expect(enhancers).toEqual([]);
    });

    it('appends a single overlay item (AI adds the PROGRAM talent)', () => {
        const talents = items(getTemplate('builtIn.AI.hdt'), 'talents', 'talent');

        expect(talents[talents.length - 1].xmlid).toBe('PROGRAM');
    });

    it('faithfully preserves the legacy characteristics quirks (case-sensitive removal + copied remove key)', () => {
        const characteristics = getTemplate('builtIn.AI.hdt').characteristics as CharacteristicsBlock;

        // AI's remove list is upper-cased ("STR"), but the keys are lower-case
        // ("str") and characteristics removal does NOT upper-case — so it is a
        // no-op and `str` survives, exactly as in the legacy engine.
        expect('str' in characteristics).toBe(true);
        // The overlay's `remove` array is copied onto the finalized characteristics.
        expect(characteristics.remove).toEqual(['STR', 'CON', 'BODY', 'PRE', 'COM', 'PD', 'ED', 'REC', 'END', 'STUN', 'RUNNING', 'SWIMMING', 'LEAPING']);
    });

    it('returns the base template (by edition suffix) for an unrecognized id and reports it', () => {
        const onUnrecognized = jest.fn();

        expect(getTemplate('builtIn.Nope.hdt', onUnrecognized)).toBe(MAIN);
        expect(getTemplate('builtIn.Nope6E.hdt', onUnrecognized)).toBe(MAIN_SIXTH);
        expect(onUnrecognized).toHaveBeenNthCalledWith(1, 'builtIn.Nope.hdt');
        expect(onUnrecognized).toHaveBeenNthCalledWith(2, 'builtIn.Nope6E.hdt');
    });

    it('selects the 6E base from an overlay document that extends Main6E', () => {
        const result = getTemplate(allNullOverlay('builtIn.Main6E.hdt'));

        // An all-null overlay finalizes to a clone of the base — equal by value,
        // but a distinct object (the base is never mutated).
        expect(result).toEqual(MAIN_SIXTH);
        expect(result).not.toBe(MAIN_SIXTH);
    });

    it('never mutates the shared base template data', () => {
        const enhancersBefore = items(MAIN, 'skillEnhancers', 'enhancer').length;
        const modifiersBefore = items(MAIN, 'modifiers', 'modifier').length;

        getTemplate('builtIn.AI.hdt');
        getTemplate('builtIn.Heroic.hdt');

        expect(items(MAIN, 'skillEnhancers', 'enhancer').length).toBe(enhancersBefore);
        expect(items(MAIN, 'modifiers', 'modifier').length).toBe(modifiersBefore);
    });
});
