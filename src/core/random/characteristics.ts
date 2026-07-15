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
 * Characteristics half of the random character generator (see docs/RANDOM_CHARACTER.md).
 *
 * Emits a `ParsedCharacter` — the `.hdc`-shaped *input* — so the existing
 * `heroDesignerCharacter.getCharacter()` pipeline produces a character indistinguishable from
 * an imported one, costed by the same golden-mastered engine.
 */
import {heroDesignerCharacter} from 'core/hero';
import type {ParsedCharacter} from 'core/hero';

type Obj = Record<string, any>;

/** An archetype's characteristics, as **totals** (`{str: 20}` means a STR of 20). */
export type CharacteristicSpread = Record<string, number>;

/** 5E = 250 points, 6E = 400. The edition fork is this one string; the engine follows it. */
export const SUPERHEROIC_5E = 'builtIn.Superheroic.hdt';
export const SUPERHEROIC_6E = 'builtIn.Superheroic6E.hdt';

/**
 * Insertion order is load-bearing: `populateMovementAndCharacteristics` walks the object in key
 * order, and the 5E figured characteristics (PD/ED/SPD/REC/END/STUN) read the *already
 * populated* primaries. Primaries must therefore come first, exactly as a real `.hdc` orders
 * them. COM is 5E-only; on a 6E template it has no entry and is skipped.
 */
const PRIMARY = ['str', 'dex', 'con', 'body', 'int', 'ego', 'pre', 'com'] as const;
const DERIVED = ['pd', 'ed', 'spd', 'rec', 'end', 'stun'] as const;
const MOVEMENT = ['running', 'swimming', 'leaping'] as const;

const characteristicEntry = (key: string, levels: number): Obj => ({
    xmlid: key.toUpperCase(),
    alias: key.toUpperCase(),
    levels,
    basecost: 0,
    position: 0,
    multiplier: 1,
    affectsPrimary: true,
    affectsTotal: true,
});

/** A `ParsedCharacter` carrying just characteristics — no traits yet (phase 1). */
export function parsedCharacterFrom(levels: Record<string, number>, template: string, name = ''): ParsedCharacter {
    const characteristics: Obj = {};

    for (const key of [...PRIMARY, ...DERIVED, ...MOVEMENT]) {
        characteristics[key] = characteristicEntry(key, levels[key] ?? 0);
    }

    return {
        version: 3,
        template,
        characterInfo: {characterName: name, alternateIdentities: '', playerName: '', height: '', weight: '', campaignName: '', genre: '', gm: ''},
        characteristics,
        skills: {},
        perks: {},
        talents: {},
        martialarts: {},
        powers: {},
        disadvantages: {},
        equipment: {},
    } as unknown as ParsedCharacter;
}

const valueOf = (character: Obj, key: string): number =>
    (character.characteristics as Obj[]).find((characteristic) => String(characteristic.shortName).toLowerCase() === key)?.value ?? 0;

const has = (character: Obj, key: string): boolean =>
    (character.characteristics as Obj[]).some((characteristic) => String(characteristic.shortName).toLowerCase() === key);

/**
 * Derive the `levels` (points bought above base) that land each characteristic on its target
 * total, then return the resulting `ParsedCharacter`.
 *
 * `value = levels + <base and figured terms>` holds for every characteristic whatever its
 * formula, so probing at `levels: 0` and taking `target - value` works uniformly — including
 * SPD, whose 5E cost is a special case (`value * 10 - bonus * 10`) and whose `base` is
 * overwritten with its figured bonus. That keeps 5E's figured math in the engine, where it is
 * golden-mastered, rather than duplicated here.
 *
 * Two passes because the figured characteristics read the primaries: pass 1 settles the
 * primaries, pass 2 reads the figured bases they imply.
 */
export function buildCharacteristics(spread: CharacteristicSpread, template: string, name = ''): ParsedCharacter {
    const levels: Record<string, number> = {};
    const probe = (current: Record<string, number>): Obj => heroDesignerCharacter.getCharacter(parsedCharacterFrom(current, template)) as unknown as Obj;

    const settle = (keys: readonly string[], character: Obj): void => {
        for (const key of keys) {
            if (spread[key] === undefined || !has(character, key)) {
                continue;
            }

            levels[key] = spread[key] - valueOf(character, key);
        }
    };

    settle(PRIMARY, probe(levels));
    settle(DERIVED, probe(levels));

    return parsedCharacterFrom(levels, template, name);
}

/** The engine's own cost for every characteristic — the total this archetype spends on them. */
export function characteristicsCost(character: Obj): number {
    return (character.characteristics as Obj[]).reduce((total, characteristic) => total + (characteristic.cost as number), 0);
}
