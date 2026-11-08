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
 * Where a received character lands in the library (docs/SHARING.md).
 *
 * The sender's id travels with the character so that a player re-sending an updated sheet is
 * recognised as the same character, and the importer can offer to replace it. When the id is
 * already taken the player chooses: **replace** keeps the id, **import as copy** (the default)
 * takes {@link copyIdentity}. Nothing here decides that for them.
 */

/** What the library needs to know about each existing character. `CharacterSummary` satisfies it. */
export interface LibraryEntry {
    id: string;
    name: string;
}

/**
 * The incoming id, made safe to store. It came from somebody else's phone, and ids end up in file
 * names, so it gets the same sanitising as an id derived from an `.hdc`'s file name.
 */
export function shareId(raw: string): string {
    const safe = raw.replace(/[^a-z0-9._-]+/gi, '_').replace(/^[._-]+|[._-]+$/g, '');

    return safe === '' ? 'character' : safe;
}

/** The library entry a received character would overwrite, or null if its id is free. */
export function findConflict(incomingId: string, library: readonly LibraryEntry[]): LibraryEntry | null {
    const id = shareId(incomingId);

    return library.find((entry) => entry.id === id) ?? null;
}

/**
 * Imported characters' ids end in legacy's `.hsmc`; a copy keeps the suffix, so the copy of
 * `brick.hsmc` is `brick-2.hsmc` and still looks like what it is.
 */
const LEGACY_SUFFIX = '.hsmc';

function numbered(id: string, n: number): string {
    return id.endsWith(LEGACY_SUFFIX) ? `${id.slice(0, -LEGACY_SUFFIX.length)}-${n}${LEGACY_SUFFIX}` : `${id}-${n}`;
}

/**
 * A fresh id and name for "import as copy": the smallest n ≥ 2 for which both `<id>-n` and
 * `<name> (n)` are free, so the copy's id and the name the player sees carry the same number.
 *
 * Names are compared exactly. Two characters may share a name — the library allows it — but a copy
 * that *looks* identical to the original in the list is the confusion this exists to prevent.
 */
export function copyIdentity(incoming: LibraryEntry, library: readonly LibraryEntry[]): LibraryEntry {
    const base = shareId(incoming.id);
    const ids = new Set(library.map((entry) => entry.id));
    const names = new Set(library.map((entry) => entry.name));

    let n = 2;
    while (ids.has(numbered(base, n)) || names.has(`${incoming.name} (${n})`)) {
        n += 1;
    }

    return {id: numbered(base, n), name: `${incoming.name} (${n})`};
}
