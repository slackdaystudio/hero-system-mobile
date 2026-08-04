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
 * The Quick Pick switcher, as pure data.
 *
 * A 3×3 grid of nine slots. A slot is one of three things: a **pinned** character the player
 * deliberately parked there, a **suggested** character the grid borrowed from the recent list to
 * fill an empty position, or **empty** (only when there is nothing recent left to borrow). Pins are
 * a curated launcher; they are not `isActive`, which stays a single character app-wide.
 *
 * This module owns every invariant — length, dedup, positional pins, per-slot fill — so the rules
 * are testable in isolation and the React layer is just wiring. Persistence stores the pins as raw
 * JSON and validates nothing on the way back, so {@link normalizePins} is the guard.
 */
import type {CharacterSummary} from 'core/ports';

/** The grid is always this many slots — one page, no pagination. */
export const SLOT_COUNT = 9;

export type SlotKind = 'pinned' | 'suggested' | 'empty';

export interface Slot {
    /** Grid position, 0–8. */
    position: number;
    /** The character shown here, or null for an empty placeholder. */
    character: CharacterSummary | null;
    kind: SlotKind;
}

const isId = (value: unknown): value is string => typeof value === 'string' && value.length > 0;

/**
 * Coerce a stored pin list into exactly {@link SLOT_COUNT} entries of `string | null`.
 *
 * Defensive because the settings store hands back whatever JSON was written with no shape check: a
 * non-array, a wrong length, non-string entries, or the same id pinned twice all have to resolve to
 * something sane. A repeated id keeps its first position and nulls the rest — a character can only
 * occupy one slot, since two slots holding the same character is two launchers for one thing.
 */
export function normalizePins(raw: unknown): (string | null)[] {
    const source = Array.isArray(raw) ? raw : [];
    const seen = new Set<string>();
    const pins: (string | null)[] = [];

    for (let i = 0; i < SLOT_COUNT; i++) {
        const value = source[i];
        if (isId(value) && !seen.has(value)) {
            seen.add(value);
            pins.push(value);
        } else {
            pins.push(null);
        }
    }

    return pins;
}

/**
 * Resolve the nine slots for display.
 *
 * Committed pins take their positions first (a pinned id that no longer resolves — a deleted
 * character — falls back to empty and is refilled like any other gap). Every still-empty position is
 * then filled, left to right, from the recent list with the pinned characters removed, so a
 * suggestion never duplicates a pin. Whatever is left over is a true empty placeholder.
 *
 * @param pins   positional pins (normalize first); index is grid position
 * @param recents recent characters, most-recent first — the suggestion pool
 * @param byId   every known character by id, for resolving pinned ids
 */
export function computeSlots(pins: (string | null)[], recents: CharacterSummary[], byId: Map<string, CharacterSummary>): Slot[] {
    const pinnedIds = new Set<string>();
    const slots: Slot[] = [];

    for (let position = 0; position < SLOT_COUNT; position++) {
        const id = pins[position] ?? null;
        const character = id !== null ? byId.get(id) ?? null : null;
        if (character !== null) {
            pinnedIds.add(character.id);
            slots.push({position, character, kind: 'pinned'});
        } else {
            slots.push({position, character: null, kind: 'empty'});
        }
    }

    // The suggestion pool: recents that aren't already pinned, deduped, in recency order.
    const usedAsSuggestion = new Set<string>();
    const pool: CharacterSummary[] = [];
    for (const candidate of recents) {
        if (!pinnedIds.has(candidate.id) && !usedAsSuggestion.has(candidate.id)) {
            usedAsSuggestion.add(candidate.id);
            pool.push(candidate);
        }
    }

    let next = 0;
    for (const slot of slots) {
        if (slot.kind === 'empty' && next < pool.length) {
            slot.character = pool[next++];
            slot.kind = 'suggested';
        }
    }

    return slots;
}
