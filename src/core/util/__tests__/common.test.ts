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

import {
    capitalize,
    flatten,
    getMultiplications,
    getMultiplierCost,
    hasModifier,
    isEmptyObject,
    isFloat,
    isInt,
    roundInPlayersFavor,
    toCamelCase,
    toCm,
    toKg,
    toMap,
    toSnakeCase,
    totalAdders,
} from 'core/util';

describe('core/util common helpers', () => {
    it('isEmptyObject', () => {
        expect(isEmptyObject({})).toBe(true);
        expect(isEmptyObject({a: 1})).toBe(false);
        expect(isEmptyObject(null)).toBe(true);
        expect(isEmptyObject(undefined)).toBe(true);
    });

    it('isInt / isFloat (loose, string-accepting)', () => {
        expect(isInt(5)).toBe(true);
        expect(isInt('5')).toBe(true);
        expect(isInt(5.5)).toBe(false);
        expect(isInt(NaN)).toBe(false);
        expect(isFloat(5.5)).toBe(true);
        expect(isFloat('5.5')).toBe(true);
        expect(isFloat(5)).toBe(false);
    });

    it('getMultiplications / getMultiplierCost', () => {
        expect(getMultiplications(4)).toBe(2); // log2(4)
        expect(getMultiplications(8)).toBe(3);
        expect(getMultiplications(5)).toBe(3); // ceil(2.32)
        expect(getMultiplierCost(4, 2, 3)).toBe(6); // 2 doublings * 3
        expect(getMultiplierCost(5, 1, 10)).toBe(50); // step 1 -> total * cost
    });

    // U2 (docs/KNOWN_DEVIATIONS.md) — intentional divergence from legacy, which had no
    // guard: Math.log(0) made these -Infinity and callers added that into a cost.
    it('getMultiplications buys nothing for a non-positive total (U2)', () => {
        expect(getMultiplications(0, 3)).toBe(0);
        expect(getMultiplications(0)).toBe(0);
        expect(getMultiplications(1, 3)).toBe(0); // already 0 before the guard; same case
        expect(getMultiplications(-4, 2)).toBe(0); // was NaN
        expect(getMultiplications(NaN, 2)).toBe(0);
        expect(getMultiplierCost(0, 3, 1)).toBe(0); // the Gecko pads case — was -Infinity

        // The guard must not disturb a genuine multiplication.
        expect(getMultiplications(9, 3)).toBe(3); // U3: should be 2; still overshooting, tracked separately
        expect(getMultiplierCost(4, 2, 3)).toBe(6);
    });

    it('totalAdders (recursive, level-aware)', () => {
        expect(totalAdders(null)).toBe(0);
        expect(totalAdders({basecost: 5})).toBe(5);
        expect(totalAdders({basecost: 5, levels: 2, lvlval: 1, lvlcost: 3})).toBe(11); // 5 + round(2/1*3)
        expect(totalAdders({basecost: 5, levels: 0, lvlval: 1, lvlcost: 3})).toBe(5); // levels not > 0
        expect(totalAdders([{basecost: 2}, {basecost: 3}])).toBe(5);
    });

    it('hasModifier', () => {
        expect(hasModifier('X', {type: 'power', modifier: {xmlid: 'X'}})).toBe(true);
        expect(hasModifier('X', {type: 'power', modifier: [{xmlid: 'Y'}, {xmlid: 'X'}]})).toBe(true);
        expect(hasModifier('X', {type: 'power', modifier: {xmlid: 'Y'}})).toBe(false);
        expect(hasModifier('X', {type: 'skill', modifier: {xmlid: 'X'}})).toBe(false);
        expect(hasModifier('X', {type: 'power'})).toBe(false);
    });

    it('flatten splices list containers', () => {
        const items = [{type: 'list', children: [{xmlid: 'A'}, {xmlid: 'B'}]}, {xmlid: 'C'}];
        expect(flatten(items, 'children').map((i) => i.xmlid)).toEqual(['A', 'B', 'C']);
    });

    it('toMap indexes by key and collapses collisions into arrays', () => {
        const unique = toMap([{xmlid: 'A', v: 1}, {xmlid: 'B', v: 2}]);
        expect(unique.get('A')).toEqual({xmlid: 'A', v: 1});
        expect(unique.size).toBe(2);

        const collided = toMap([{xmlid: 'A', v: 1}, {xmlid: 'A', v: 2}, {xmlid: 'A', v: 3}]);
        expect(collided.get('A')).toEqual([{xmlid: 'A', v: 1}, {xmlid: 'A', v: 2}, {xmlid: 'A', v: 3}]);

        expect(toMap(null).size).toBe(0);
        expect(toMap({id: '7'}, 'id').get('7')).toEqual({id: '7'});
    });

    it('roundInPlayersFavor: .50-.59 truncates, otherwise rounds', () => {
        expect(roundInPlayersFavor(5)).toBe(5);
        expect(roundInPlayersFavor(5.5)).toBe(5);
        expect(roundInPlayersFavor(5.55)).toBe(5);
        expect(roundInPlayersFavor(5.59)).toBe(5);
        expect(roundInPlayersFavor(5.6)).toBe(6);
        expect(roundInPlayersFavor(5.4)).toBe(5);
        expect(roundInPlayersFavor(5.61)).toBe(6);
    });

    it('casing wraps change-case identically to legacy', () => {
        expect(toCamelCase('HAND_TO_HAND_ATTACK')).toBe('handToHandAttack');
        expect(toCamelCase('COMBAT_LEVELS')).toBe('combatLevels');
        expect(toCamelCase('JACK_OF_ALL_TRADES')).toBe('jackOfAllTrades');
        expect(toSnakeCase('Combat Luck')).toBe('combat_luck');
        expect(toSnakeCase('COMBAT_LEVELS')).toBe('combat_levels');
    });

    it('capitalize / toKg / toCm', () => {
        expect(capitalize('error')).toBe('Error');
        expect(capitalize('success')).toBe('Success');
        // Faithful to legacy: only the first character is upper-cased; the rest of
        // the word is left untouched (not lower-cased).
        expect(capitalize('SUCCESS')).toBe('SUCCESS');
        expect(toKg(220)).toBe(100);
        expect(toKg(100)).toBe(45);
        expect(toCm(78)).toBe(198);
        expect(toCm(70)).toBe(178);
    });
});
