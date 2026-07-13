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

import type {HeroDesignerTemplateData} from './types';

import ai from 'core/data/herodesigner/AI.json';
import aiSixth from 'core/data/herodesigner/AI6E.json';
import automaton from 'core/data/herodesigner/Automaton.json';
import automatonSixth from 'core/data/herodesigner/Automaton6E.json';
import computer from 'core/data/herodesigner/Computer.json';
import computerSixth from 'core/data/herodesigner/Computer6E.json';
import heroic from 'core/data/herodesigner/Heroic.json';
import heroicSixth from 'core/data/herodesigner/Heroic6E.json';
import main from 'core/data/herodesigner/Main.json';
import mainSixth from 'core/data/herodesigner/Main6E.json';
import normal from 'core/data/herodesigner/Normal.json';
import superheroic from 'core/data/herodesigner/Superheroic.json';
import superheroicSixth from 'core/data/herodesigner/Superheroic6E.json';

const asTemplate = (data: unknown): HeroDesignerTemplateData => data as HeroDesignerTemplateData;

/** The 5th-edition base rulebook template. */
export const MAIN: HeroDesignerTemplateData = asTemplate(main);

/** The 6th-edition base rulebook template. */
export const MAIN_SIXTH: HeroDesignerTemplateData = asTemplate(mainSixth);

/** Built-in genre/type overlay templates, keyed by their `.hdt` id. */
export const BUILT_IN_TEMPLATES: Readonly<Record<string, HeroDesignerTemplateData>> = {
    'builtIn.AI.hdt': asTemplate(ai),
    'builtIn.AI6E.hdt': asTemplate(aiSixth),
    'builtIn.Automaton.hdt': asTemplate(automaton),
    'builtIn.Automaton6E.hdt': asTemplate(automatonSixth),
    'builtIn.Computer.hdt': asTemplate(computer),
    'builtIn.Computer6E.hdt': asTemplate(computerSixth),
    'builtIn.Heroic.hdt': asTemplate(heroic),
    'builtIn.Heroic6E.hdt': asTemplate(heroicSixth),
    'builtIn.Normal.hdt': asTemplate(normal),
    'builtIn.Superheroic.hdt': asTemplate(superheroic),
    'builtIn.Superheroic6E.hdt': asTemplate(superheroicSixth),
};

/** True when a template id/`extends` names a 6th-edition base. */
export const isSixthEdition = (templateName: string): boolean => templateName.endsWith('6E.hdt');
