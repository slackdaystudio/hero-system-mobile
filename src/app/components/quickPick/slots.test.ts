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

import type {CharacterSummary} from 'core/ports';
import {computeSlots, normalizePins, SLOT_COUNT, type Slot} from './slots';

const summary = (id: string): CharacterSummary => ({
    id,
    name: id.toUpperCase(),
    player: null,
    edition: '6E',
    isActive: false,
    portraitUri: null,
    portraitFocus: null,
});

const byIdOf = (...ids: string[]): Map<string, CharacterSummary> => new Map(ids.map((id) => [id, summary(id)]));

/** A compact view of a resolved grid: the id (or null) at each position, and its kind. */
const shape = (slots: Slot[]): Array<[string | null, string]> => slots.map((slot) => [slot.character?.id ?? null, slot.kind]);

describe('normalizePins', () => {
    it('always returns exactly nine entries', () => {
        expect(normalizePins([]).length).toBe(SLOT_COUNT);
        expect(normalizePins(['a', 'b']).length).toBe(SLOT_COUNT);
        expect(normalizePins(Array.from({length: 20}, (_, i) => `c${i}`)).length).toBe(SLOT_COUNT);
    });

    it('preserves position — index is the grid slot, holes stay holes', () => {
        expect(normalizePins([null, 'a', null, 'b'])).toEqual([null, 'a', null, 'b', null, null, null, null, null]);
    });

    it('truncates anything past the ninth slot', () => {
        const raw = Array.from({length: 12}, (_, i) => `c${i}`);
        expect(normalizePins(raw)).toEqual(['c0', 'c1', 'c2', 'c3', 'c4', 'c5', 'c6', 'c7', 'c8']);
    });

    it('drops a character pinned twice, keeping the first slot', () => {
        expect(normalizePins(['a', 'b', 'a', 'c'])).toEqual(['a', 'b', null, 'c', null, null, null, null, null]);
    });

    it('coerces junk — non-arrays, non-strings, empty strings — to holes', () => {
        expect(normalizePins(undefined)).toEqual(Array(SLOT_COUNT).fill(null));
        expect(normalizePins('nope')).toEqual(Array(SLOT_COUNT).fill(null));
        expect(normalizePins([1, {}, '', 'a'])).toEqual([null, null, null, 'a', null, null, null, null, null]);
    });
});

describe('computeSlots', () => {
    it('is all-empty with no pins and no recents', () => {
        const slots = computeSlots(normalizePins([]), [], byIdOf());
        expect(slots).toHaveLength(SLOT_COUNT);
        expect(slots.every((slot) => slot.kind === 'empty' && slot.character === null)).toBe(true);
    });

    it('fills every empty slot from recents when nothing is pinned', () => {
        const recents = [summary('r0'), summary('r1'), summary('r2')];
        const slots = computeSlots(normalizePins([]), recents, byIdOf('r0', 'r1', 'r2'));

        expect(shape(slots).slice(0, 3)).toEqual([
            ['r0', 'suggested'],
            ['r1', 'suggested'],
            ['r2', 'suggested'],
        ]);
        // The pool ran dry after three; the rest are true placeholders.
        expect(slots.slice(3).every((slot) => slot.kind === 'empty')).toBe(true);
    });

    it('keeps pins in their positions and fills only the gaps around them', () => {
        // Pin 'p' at slot 2; slots 0,1,3,4… borrow from recents.
        const pins = normalizePins([null, null, 'p']);
        const recents = [summary('r0'), summary('r1')];
        const slots = computeSlots(pins, recents, byIdOf('p', 'r0', 'r1'));

        expect(shape(slots).slice(0, 4)).toEqual([
            ['r0', 'suggested'],
            ['r1', 'suggested'],
            ['p', 'pinned'],
            [null, 'empty'],
        ]);
    });

    it('never suggests a character that is already pinned', () => {
        // 'a' is pinned and also the most-recent — it must not appear twice.
        const pins = normalizePins(['a']);
        const recents = [summary('a'), summary('b')];
        const slots = computeSlots(pins, recents, byIdOf('a', 'b'));

        expect(shape(slots).slice(0, 2)).toEqual([
            ['a', 'pinned'],
            ['b', 'suggested'],
        ]);
        const ids = slots.map((slot) => slot.character?.id).filter(Boolean);
        expect(ids.filter((id) => id === 'a')).toHaveLength(1);
    });

    it('empties a slot whose pinned character no longer exists, then refills it from recents', () => {
        // 'gone' was pinned at slot 0 but has been deleted (absent from byId).
        const pins = normalizePins(['gone', 'keep']);
        const recents = [summary('r0')];
        const slots = computeSlots(pins, recents, byIdOf('keep', 'r0'));

        expect(shape(slots).slice(0, 2)).toEqual([
            ['r0', 'suggested'], // the gap the deleted pin left, refilled
            ['keep', 'pinned'],
        ]);
    });

    it('dedupes a recent list that repeats an id', () => {
        const recents = [summary('r0'), summary('r0'), summary('r1')];
        const slots = computeSlots(normalizePins([]), recents, byIdOf('r0', 'r1'));

        expect(shape(slots).slice(0, 2)).toEqual([
            ['r0', 'suggested'],
            ['r1', 'suggested'],
        ]);
        expect(slots.slice(2).every((slot) => slot.kind === 'empty')).toBe(true);
    });

    it('caps at nine even with more pins and recents than fit', () => {
        const pins = normalizePins(Array.from({length: 5}, (_, i) => `p${i}`));
        const recents = Array.from({length: 20}, (_, i) => summary(`r${i}`));
        const ids = ['p0', 'p1', 'p2', 'p3', 'p4', ...recents.map((r) => r.id)];
        const slots = computeSlots(pins, recents, byIdOf(...ids));

        expect(slots).toHaveLength(SLOT_COUNT);
        expect(slots.every((slot) => slot.kind !== 'empty')).toBe(true);
    });
});
