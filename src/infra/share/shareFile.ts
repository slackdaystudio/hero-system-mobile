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
 * Packing and unpacking `.hsm` files (docs/SHARING.md, piece 2).
 *
 * `core/share` owns the manifest; this owns the zip around it, reading the portrait off disk on the
 * way out and writing the result into the library on the way in. fflate is pure JS, so all of this
 * runs identically on Hermes and in node — the tests below exercise the real code path.
 */
import {strFromU8, strToU8, unzipSync, zipSync, type Zippable} from 'fflate';
import type {Character, PortraitInput} from 'core/ports';
import {
    MANIFEST_ENTRY,
    SHARE_EXTENSION,
    parseSharedCharacter,
    toSharedCharacter,
    type ExportContext,
    type LibraryEntry,
    type ShareParseFailure,
    type SharedCharacter,
} from 'core/share';
import {filePathFromUri} from '../files/fileUri';
import type {FileSystem} from '../files/fileSystem';
import type {Repositories} from '../persistence/repositories';

/**
 * Ceilings on what an unzip will inflate. A file arriving from someone else's phone can declare any
 * size it likes, and fflate allocates the declared size up front. Both are far above anything real:
 * the largest fixture's manifest is a few hundred KB, and portraits are camera photos at worst.
 */
export const MAX_MANIFEST_BYTES = 8 * 1024 * 1024;
export const MAX_PORTRAIT_BYTES = 16 * 1024 * 1024;

/**
 * The type a `.hsm` is offered to the share sheet as. Honest — it is a zip — and generic enough that
 * every mail client, messenger, AirDrop and Quick Share will take it; a vendor type would make some
 * share targets hide themselves.
 */
export const SHARE_MIME = 'application/zip';

/** The image store names files `<uuid>.<ext>`; this reads the type back off the name. */
const MIME_BY_EXTENSION: Readonly<Record<string, string>> = {
    jpg: 'image/jpeg',
    jpeg: 'image/jpeg',
    png: 'image/png',
    gif: 'image/gif',
    webp: 'image/webp',
};

const mimeOf = (uri: string): string | null => MIME_BY_EXTENSION[uri.split('.').pop()?.toLowerCase() ?? ''] ?? null;

export interface PackedCharacter {
    bytes: Uint8Array;
    /** A suggested name for the file, e.g. `Fire Brick.hsm` — what the recipient sees in the share sheet. */
    fileName: string;
    /**
     * False when a portrait was asked for but could not be included — the file was missing or of a
     * type the format cannot carry. The share still goes ahead (the character is the point), but the
     * UI may want to say so.
     */
    portraitIncluded: boolean;
}

/**
 * A file name for the share: the character's name with anything a file system or share target
 * might choke on removed. Spaces are kept — they are the name.
 */
export function shareFileName(name: string): string {
    // Control characters are what this is for, so the regex has to name them.
    // eslint-disable-next-line no-control-regex
    const UNSAFE = /[\u0000-\u001f\u007f/\\:*?"<>|]+/g;
    const safe = name.replace(UNSAFE, '').trim().replace(/^\.+/, '');

    return `${safe === '' ? 'character' : safe}.${SHARE_EXTENSION}`;
}

/**
 * Zip a stored character into a `.hsm`.
 *
 * `includePortrait` is the player's choice; whether one is actually included also depends on the
 * character having one that can be read and carried — see {@link PackedCharacter.portraitIncluded}.
 */
export async function packCharacter(character: Character, fs: FileSystem, context: ExportContext, includePortrait = true): Promise<PackedCharacter> {
    let portrait: PortraitInput | null = null;

    if (includePortrait && character.portraitUri !== null) {
        const mime = mimeOf(character.portraitUri);

        if (mime !== null) {
            portrait = await fs
                .readFile(filePathFromUri(character.portraitUri))
                .then((bytes) => ({bytes, mime}))
                .catch(() => null);
        }
    }

    const manifest = toSharedCharacter(character, portrait?.mime ?? null, context);
    const files: Zippable = {[MANIFEST_ENTRY]: strToU8(JSON.stringify(manifest))};

    if (manifest.character.portrait !== null && portrait !== null) {
        // Already compressed; deflating a JPEG again costs time and saves nothing.
        files[manifest.character.portrait.entry] = [portrait.bytes, {level: 0}];
    }

    return {
        bytes: zipSync(files),
        fileName: shareFileName(character.name),
        portraitIncluded: !includePortrait || character.portraitUri === null || manifest.character.portrait !== null,
    };
}

export interface ReceivedCharacter {
    shared: SharedCharacter;
    /** The portrait's bytes, present exactly when the manifest names a portrait. */
    portrait: Uint8Array | null;
}

export type UnpackResult = {ok: true; received: ReceivedCharacter} | ShareParseFailure;

/** Inflate one named entry, or say why not. Never iterates the archive: only `name` is ever read. */
function readEntry(bytes: Uint8Array, name: string, limit: number): Uint8Array | 'missing' | 'too-large' {
    let tooLarge = false;

    const entries = unzipSync(bytes, {
        filter: (file) => {
            if (file.name !== name) {
                return false;
            }

            tooLarge = file.originalSize > limit;

            return !tooLarge;
        },
    });

    if (tooLarge) {
        return 'too-large';
    }

    return entries[name] ?? 'missing';
}

/**
 * Read a `.hsm`. Never throws: a file that is not a zip, or a zip without our manifest, is
 * `not-a-share` — the wrong file was picked — while one of ours that is damaged is `malformed`.
 */
export function unpackCharacter(bytes: Uint8Array): UnpackResult {
    let manifestBytes: ReturnType<typeof readEntry>;

    try {
        manifestBytes = readEntry(bytes, MANIFEST_ENTRY, MAX_MANIFEST_BYTES);
    } catch {
        return {ok: false, reason: 'not-a-share'};
    }

    if (manifestBytes === 'missing') {
        return {ok: false, reason: 'not-a-share'};
    }

    if (manifestBytes === 'too-large') {
        return {ok: false, reason: 'malformed', detail: `${MANIFEST_ENTRY} is larger than ${MAX_MANIFEST_BYTES} bytes`};
    }

    let json: unknown;

    try {
        json = JSON.parse(strFromU8(manifestBytes));
    } catch {
        return {ok: false, reason: 'malformed', detail: `${MANIFEST_ENTRY} is not JSON`};
    }

    const parsed = parseSharedCharacter(json);

    if (!parsed.ok) {
        return parsed;
    }

    const {portrait} = parsed.shared.character;

    if (portrait === null) {
        return {ok: true, received: {shared: parsed.shared, portrait: null}};
    }

    let portraitBytes: ReturnType<typeof readEntry>;

    try {
        portraitBytes = readEntry(bytes, portrait.entry, MAX_PORTRAIT_BYTES);
    } catch {
        return {ok: false, reason: 'malformed', detail: `${portrait.entry} could not be read`};
    }

    // Our writer always includes the entry it names, so its absence means damage, not a choice.
    if (typeof portraitBytes === 'string') {
        return {ok: false, reason: 'malformed', detail: `${portrait.entry} is ${portraitBytes === 'missing' ? 'missing' : 'too large'}`};
    }

    return {ok: true, received: {shared: parsed.shared, portrait: portraitBytes}};
}

/**
 * Write a received character into the library under `placement` — its own id for a new character
 * or a replace, `copyIdentity`'s for a copy. Choosing between those is the player's call and the
 * UI's job (piece 4); this does what it is told.
 *
 * Everything is stated, never left to `save`'s keep-what's-there defaults: on a replace those
 * defaults would graft the *old* character's recipe, source or portrait onto the new one. A replace
 * means the incoming character, whole.
 */
export async function saveReceivedCharacter(received: ReceivedCharacter, placement: LibraryEntry, repos: Repositories): Promise<void> {
    const {character} = received.shared;

    await repos.characters.save({
        id: placement.id,
        name: placement.name,
        player: character.player,
        edition: character.edition,
        filename: placement.id,
        document: character.document,
        portrait: character.portrait === null || received.portrait === null ? null : {bytes: received.portrait, mime: character.portrait.mime},
        origin: character.origin,
        recipe: character.recipe,
        source: character.source,
    });

    await repos.characters.setPortraitFocus(placement.id, character.portrait?.focus ?? null);
}
