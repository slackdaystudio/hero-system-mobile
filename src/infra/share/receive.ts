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
 * Receiving a `.hsm` into the library (docs/SHARING.md, piece 4).
 *
 * The two decisions this cannot make are injected. Whether a document will *display* is the
 * sheet's business, and the sheet lives in `app/`. Whether to replace or copy when the id is taken
 * is the player's. Everything else — unpack, place, save — is here, so the whole path runs in node
 * against real SQLite.
 */
import {copyIdentity, findConflict, shareId, type LibraryEntry, type ShareParseFailure, type SharedCharacterBody} from 'core/share';
import type {Repositories} from '../persistence/repositories';
import {saveReceivedCharacter, unpackCharacter} from './shareFile';

/** What the player chose when the incoming id is already in the library. */
export type ConflictChoice = 'copy' | 'replace' | 'cancel';

export interface ReceiveOptions {
    /**
     * True if the receiving phone can show this character's document. Checked before anything is written:
     * a character that would open to a broken sheet should be refused at the door, not discovered
     * in the library.
     */
    canDisplay: (incoming: SharedCharacterBody) => boolean;
    /** Asked only when the id is taken. `existing` is what would be overwritten. */
    resolveConflict: (existing: LibraryEntry, incoming: SharedCharacterBody) => Promise<ConflictChoice>;
}

export type ReceiveResult =
    | {status: 'imported'; id: string; name: string; replaced: boolean}
    | {status: 'cancelled'}
    | ShareParseFailure
    /** Ours and intact, but this build cannot show it. */
    | {ok: false; reason: 'undisplayable'};

/**
 * A zip's local-file-header signature, `PK\x03\x04`. A `.hdc` is XML and never starts with it, so
 * this tells the two apart by content — share targets and pickers rename files, and an extension
 * is the least reliable thing about one that has been through Drive.
 */
export function isZip(bytes: Uint8Array): boolean {
    return bytes.length >= 4 && bytes[0] === 0x50 && bytes[1] === 0x4b && bytes[2] === 0x03 && bytes[3] === 0x04;
}

export async function receiveCharacter(bytes: Uint8Array, repos: Repositories, options: ReceiveOptions): Promise<ReceiveResult> {
    const unpacked = unpackCharacter(bytes);

    if (!unpacked.ok) {
        return unpacked;
    }

    const {received} = unpacked;
    const incoming = received.shared.character;

    if (!options.canDisplay(incoming)) {
        return {ok: false, reason: 'undisplayable'};
    }

    const library = await repos.characters.list();
    const existing = findConflict(incoming.id, library);
    let placement: LibraryEntry = {id: shareId(incoming.id), name: incoming.name};

    if (existing !== null) {
        const choice = await options.resolveConflict(existing, incoming);

        if (choice === 'cancel') {
            return {status: 'cancelled'};
        }

        if (choice === 'copy') {
            placement = copyIdentity(incoming, library);
        }
    }

    await saveReceivedCharacter(received, placement, repos);

    return {status: 'imported', id: placement.id, name: placement.name, replaced: existing !== null && placement.id === existing.id};
}
