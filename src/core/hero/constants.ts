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
 * Shared rules constants for the character model and the trait decorators.
 *
 * These live here — a dependency-free module — specifically to break the legacy
 * import cycle (`HeroDesignerCharacter` ⇄ `decorators/skills/Roll`). The
 * dependency direction becomes strictly one-way: `traits → hero(constants)`.
 * Ported from legacy `HeroDesignerCharacter.js` and `decorators/skills/Roll.js`.
 */

/** Base target number for a skill roll (before the characteristic bonus). */
export const SKILL_ROLL_BASE = 9;

export const TYPE_CHARACTERISTIC = 1;
export const TYPE_MOVEMENT = 2;
export const TYPE_ADVANTAGES = 0;
export const TYPE_LIMITATIONS = 1;

export const GENERIC_OBJECT = 'GENERIC_OBJECT';

export const SKILL_ENHANCERS = ['SCIENTIST', 'JACK_OF_ALL_TRADES', 'LINGUIST', 'SCHOLAR', 'TRAVELER', 'WELL_CONNECTED'];

export const FIGURED_CHARACTERISTICS = ['PD', 'ED', 'SPD', 'REC', 'END', 'STUN'];

export const MISSING_CHARACTERISTIC_DESCRIPTIONS: Readonly<Record<string, string>> = {
    ocv: 'Offensive Combat Value represents a character’s general accuracy in combat.',
    dcv: 'Defensive Combat Value represents how difficult it is to hit a character in combat.',
    omcv: 'Offensive Mental Combat Value represents a character’s general accuracy in Mental Combat.',
    dmcv: 'Defensive Mental Combat Value represents how difficult it is to hit a character in Mental Combat.',
};

export const CHARACTERISTIC_NAMES: Readonly<Record<string, string>> = {
    str: 'Strength',
    dex: 'Dexterity',
    con: 'Constitution',
    int: 'Intelligence',
    ego: 'Ego',
    pre: 'Presence',
    com: 'Comeliness',
    ocv: 'OCV',
    dcv: 'DCV',
    omcv: 'OMCV',
    dmcv: 'DMCV',
    spd: 'Speed',
    pd: 'PD',
    ed: 'ED',
    rec: 'Recovery',
    end: 'Endurance',
    body: 'Body',
    stun: 'Stun',
    custom1: 'Custom1',
    custom2: 'Custom2',
    custom3: 'Custom3',
    custom4: 'Custom4',
    custom5: 'Custom5',
    custom6: 'Custom6',
    custom7: 'Custom7',
    custom8: 'Custom8',
    custom9: 'Custom9',
    custom10: 'Custom10',
};

export const BASE_MOVEMENT_MODES: Readonly<Record<string, string>> = {
    running: 'Running',
    swimming: 'Swimming',
    leaping: 'Leaping',
};

export const CHARACTER_TRAITS: Readonly<Record<string, string>> = {
    skills: 'skill',
    perks: 'perk',
    talents: 'talent',
    martialArts: 'maneuver',
    powers: 'power',
    equipment: 'powers',
    disadvantages: 'disad',
};

/**
 * Where a category's traits nest their children — the `characterSubTrait` argument
 * `getCharacter` passes to `populateTrait`, which is what a framework container's slots and a
 * Skill Enhancer's skills are pushed onto.
 *
 * **It is not the same key for every category**, and it is not `powers` for most of them: a
 * Skill Enhancer's skills live under `skills`, a martial style's maneuvers under `maneuver`.
 * Walking `powers` alone — which is the obvious thing to write — silently misses every nested
 * trait outside the Powers section.
 *
 * `equipment` is the one category with two: `populateTrait` nests its framework slots under
 * `power`, while `getCompoundPowers` nests compound children under `powers` regardless of
 * category. Both have to be walked or compound equipment disappears.
 */
export const TRAIT_CHILD_KEYS: Readonly<Record<string, readonly string[]>> = {
    skills: ['skills'],
    perks: ['perks'],
    talents: ['talents'],
    martialArts: ['maneuver'],
    powers: ['powers'],
    equipment: ['power', 'powers'],
    disadvantages: ['disadvantages'],
};
