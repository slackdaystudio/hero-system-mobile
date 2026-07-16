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

/** The random character generator — see docs/RANDOM_CHARACTER.md. */
export {buildCharacteristics, characteristicsCost, parsedCharacterFrom, SUPERHEROIC_5E, SUPERHEROIC_6E, type CharacteristicSpread} from './characteristics';
export {LOW_POWERED_5E, POWER_LEVELS, powerLevel, STANDARD_6E, type Edition, type PowerLevel} from './powerLevel';
export {CAMPAIGN_225, CAMPAIGN_400, deviation, isBalanced, ruleOfX, TOLERANCE, type RuleOfXCampaign, type RuleOfXStats} from './ruleOfX';
export {diceOf, ruleOfXStats} from './ruleOfXStats';
export {article, describeBuild, effectLabel, professionLabel, revealSentence, UNTHEMED, VOWEL_EFFECTS, type DescribableBuild} from './describe';
export {
    autoName,
    buildFromRecipe,
    nameSkill,
    namedSkillSlots,
    changeProfession,
    changeSpecialFx,
    parseRecipe,
    recipeEdition,
    renameRecipe,
    rerollArchetype,
    rerollPowerset,
    resolveRecipe,
    reviseRecipe,
    type CharacterRecipe,
    type ResolvedRecipe,
} from './recipe';
export {
    allocate,
    ARCHETYPES_5E,
    characteristicsBudget,
    complicationsTotal,
    COMPLICATIONS_5E,
    pick,
    randomBudget,
    SKILLSETS,
    SPECIAL_FX,
    type Archetype,
    type Budget,
    type ComplicationPackage,
    type Skillset,
} from './allocate';
export {ARCHETYPES_6E, archetypesFor} from './allocate';
export {POWERSETS_6E, powersetsForEdition} from './powerset';
export {attachSkillset, playerDefinedSlots, PLAYER_DEFINED, SKILLSETS_5E, structuredSkillset, type PlayerDefinedSlot, type StructuredSkillset} from './skillset';
export {approximations, attachPowerset, POWERSETS_5E, powersetsFor, type Approximation, type Powerset} from './powerset';
export {budgetFor, buildRecipe, fittableSkillsets, generatableArchetypes, generateRandomCharacter, rollRecipe, type GeneratedCharacter} from './generate';
