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
 * Golden master for the template engine: the ported `core/templates.getTemplate`
 * must produce byte-identical finalized templates to the legacy
 * `HeroDesignerTemplate` for every built-in id, the unrecognized-id fallback, and
 * custom overlay documents. Both sides read the same rules JSON (copied verbatim
 * into `core/data`), so any difference is a difference in merge logic.
 *
 * The legacy module's only non-pure dependency, `./Common` (a `toast` on an
 * unknown id, which drags in RN), is mocked out.
 */
import {getTemplate} from 'core/templates';
import type {HeroDesignerTemplateData, TemplateInput} from 'core/templates';

jest.mock(
    '../../../../../hero-system-mobile/src/lib/Common',
    () => ({common: {toast: () => {}}}),
    {virtual: true},
);

const legacy = require('../../../../../hero-system-mobile/src/lib/HeroDesignerTemplate') as {
    heroDesignerTemplate: {getTemplate(template: TemplateInput): HeroDesignerTemplateData};
};

const BUILT_IN_IDS = [
    'builtIn.AI.hdt',
    'builtIn.AI6E.hdt',
    'builtIn.Automaton.hdt',
    'builtIn.Automaton6E.hdt',
    'builtIn.Computer.hdt',
    'builtIn.Computer6E.hdt',
    'builtIn.Heroic.hdt',
    'builtIn.Heroic6E.hdt',
    'builtIn.Normal.hdt',
    'builtIn.Superheroic.hdt',
    'builtIn.Superheroic6E.hdt',
];

// Unknown ids exercise the base-template fallback, once per edition suffix.
const UNRECOGNIZED_IDS = ['builtIn.DoesNotExist.hdt', 'builtIn.DoesNotExist6E.hdt'];

// Overlay documents mirror the shape of real templates (every category present,
// null when unused) so both engines take the same code paths.
const overlay = (extendsId: string, patch: Partial<HeroDesignerTemplateData>): HeroDesignerTemplateData => ({
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
    ...patch,
});

const CUSTOM_TEMPLATES: Array<{name: string; template: HeroDesignerTemplateData}> = [
    {name: 'passthrough over 5E base', template: overlay('builtIn.Main.hdt', {})},
    {name: 'passthrough over 6E base', template: overlay('builtIn.Main6E.hdt', {})},
    {
        name: 'removes + adds across categories',
        template: overlay('builtIn.Main.hdt', {
            characteristics: {remove: ['STR', 'dex'], custom1: {display: 'Custom 1', base: 5}},
            skills: {remove: 'ACROBATICS', skill: {xmlid: 'CUSTOMSKILL', display: 'Custom Skill', mincost: 3}},
            talents: {talent: [{xmlid: 'CUSTOMTALENT1', display: 'CT1'}, {xmlid: 'CUSTOMTALENT2', display: 'CT2'}]},
        }),
    },
    {
        name: 'single-item add + array remove',
        template: overlay('builtIn.Main6E.hdt', {
            skillEnhancers: {remove: ['LINGUIST', 'SCHOLAR'], enhancer: {xmlid: 'CUSTOMENH', display: 'Custom Enhancer'}},
        }),
    },
];

describe('golden master: core/templates.getTemplate reproduces legacy HeroDesignerTemplate', () => {
    describe.each(BUILT_IN_IDS)('built-in %s', (id) => {
        it('matches legacy', () => {
            expect(getTemplate(id)).toEqual(legacy.heroDesignerTemplate.getTemplate(id));
        });
    });

    describe.each(UNRECOGNIZED_IDS)('unrecognized %s', (id) => {
        it('falls back to the same base template as legacy', () => {
            expect(getTemplate(id)).toEqual(legacy.heroDesignerTemplate.getTemplate(id));
        });
    });

    describe.each(CUSTOM_TEMPLATES)('custom overlay: $name', ({template}) => {
        it('matches legacy', () => {
            // Clone the input per side so neither engine's in-place merge can leak
            // into the other via a shared reference.
            const forCore = JSON.parse(JSON.stringify(template));
            const forLegacy = JSON.parse(JSON.stringify(template));

            expect(getTemplate(forCore)).toEqual(legacy.heroDesignerTemplate.getTemplate(forLegacy));
        });
    });
});
