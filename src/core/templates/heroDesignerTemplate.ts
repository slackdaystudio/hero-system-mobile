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

import {BUILT_IN_TEMPLATES, isSixthEdition, MAIN, MAIN_SIXTH} from './builtInTemplates';
import {ITEM_CATEGORIES, type CharacteristicsBlock, type HeroDesignerTemplateData, type ItemCategory, type TemplateInput, type TemplateItem} from './types';

/** Loose view over a template for the dynamic, category-keyed merge below. */
type Indexable = Record<string, unknown>;

/**
 * Resolve a HERO Designer template into its finalized rules set.
 *
 * A template is a base rulebook (`Main` for 5E, `Main6E` for 6E) overlaid with a
 * genre/type template that can remove base entries and add its own. `template` is
 * either a built-in id (e.g. `builtIn.Heroic6E.hdt`) or an overlay document that
 * `extends` a base.
 *
 * Ported from legacy `src/lib/HeroDesignerTemplate.js`. The only decoupling: the
 * legacy code toasted "not recognized" for an unknown id (reaching into the UI);
 * here the caller passes an optional `onUnrecognized` hook and the app layer
 * decides how to surface it. The merge semantics are otherwise identical.
 */
export const getTemplate = (template: TemplateInput, onUnrecognized: (templateName: string) => void = () => {}): HeroDesignerTemplateData => {
    let baseTemplate: HeroDesignerTemplateData;
    let subTemplate: HeroDesignerTemplateData | null = null;

    if (typeof template === 'string') {
        baseTemplate = isSixthEdition(template) ? MAIN_SIXTH : MAIN;

        if (Object.prototype.hasOwnProperty.call(BUILT_IN_TEMPLATES, template)) {
            subTemplate = BUILT_IN_TEMPLATES[template];
        } else {
            onUnrecognized(template);
        }
    } else {
        baseTemplate = isSixthEdition(template.extends ?? '') ? MAIN_SIXTH : MAIN;
        subTemplate = template;
    }

    return subTemplate === null ? baseTemplate : finalizeTemplate(baseTemplate, subTemplate);
};

const finalizeTemplate = (baseTemplate: HeroDesignerTemplateData, subTemplate: HeroDesignerTemplateData): HeroDesignerTemplateData => {
    // Deep clone so the shared base template data is never mutated (legacy did the
    // same via JSON round-trip); the overlay is then merged into the copy in place.
    const finalTemplate = JSON.parse(JSON.stringify(baseTemplate)) as HeroDesignerTemplateData;

    finalizeCharacteristics(finalTemplate, subTemplate);

    for (const [key, subKey] of ITEM_CATEGORIES) {
        finalizeItems(finalTemplate, subTemplate, key as string, subKey);
    }

    return finalTemplate;
};

const finalizeCharacteristics = (finalTemplate: HeroDesignerTemplateData, subTemplate: HeroDesignerTemplateData): void => {
    const overlay = subTemplate.characteristics;

    if (overlay === null || overlay === undefined) {
        return;
    }

    const characteristics = (finalTemplate.characteristics ?? {}) as Indexable;
    finalTemplate.characteristics = characteristics as CharacteristicsBlock;

    for (const removal of toArray(overlay.remove)) {
        delete characteristics[removal];
    }

    // Faithful to legacy: every overlay entry is copied in — including `remove`
    // itself, which lands on the finalized characteristics as a harmless artifact.
    for (const [key, value] of Object.entries(overlay)) {
        characteristics[key] = value;
    }
};

const finalizeItems = (finalTemplate: HeroDesignerTemplateData, subTemplate: HeroDesignerTemplateData, key: string, subKey: string): void => {
    const overlay = (subTemplate as Indexable)[key] as ItemCategory | null | undefined;

    if (overlay === null || overlay === undefined) {
        return;
    }

    const category = ((finalTemplate as Indexable)[key] ?? {}) as Indexable;
    (finalTemplate as Indexable)[key] = category;

    if (overlay.remove) {
        const removals = toArray(overlay.remove);
        const existing = category[subKey];

        if (Array.isArray(existing)) {
            category[subKey] = existing.filter((item) => !removals.includes((item as TemplateItem).xmlid.toUpperCase()));
        }
    }

    const additions = overlay[subKey];

    if (additions) {
        for (const item of Array.isArray(additions) ? additions : [additions]) {
            const existing = category[subKey];

            if (Array.isArray(existing)) {
                existing.push(item);
            } else {
                category[subKey] = [existing, item];
            }
        }
    }
};

const toArray = <T>(value: T | T[] | undefined): T[] => {
    if (value === undefined) {
        return [];
    }

    return Array.isArray(value) ? value : [value];
};
