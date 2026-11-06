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
 * The shared-character file format (docs/SHARING.md).
 *
 * A `.hsm` file is a zip: {@link MANIFEST_ENTRY} holds a {@link SharedCharacter} as JSON, and the
 * portrait — if there is one — sits beside it under the name the manifest gives. This module owns
 * the manifest's shape in both directions; zipping and unzipping are `infra`'s job.
 *
 * The manifest is a character *row*, not a HERO Designer document. It carries `origin`, `recipe` and
 * `source` so a character keeps the edit rights it had on the sender's phone: an imported `.hdc` is
 * still the player's file and still read-only; a generated or authored one can still be revised.
 *
 * Reading is strict about the envelope and opaque about the contents, mirroring persistence: the
 * document, recipe and source are each checked to be objects and nothing more. `core/random` and
 * `core/authoring` already validate recipes and sources when the editor opens them, and fail by
 * refusing to edit rather than by refusing to open — a shared character gets the same treatment.
 */
import type {Character, CharacterDocument, CharacterOrigin, Edition, PortraitFocus, StoredRecipe, StoredSource} from 'core/ports';

/** Identifies a manifest as ours, so a stray JSON file is "not a character" rather than "corrupt". */
export const SHARE_FORMAT = 'hero-system-mobile/character';

/**
 * The newest manifest this build can read. Bump it — and add an upgrade step in
 * {@link parseSharedCharacter} — whenever the manifest's shape changes in a way an older reader
 * would misread. Adding an optional field an older reader can ignore does not need a bump.
 */
export const SHARE_FORMAT_VERSION = 1;

/**
 * The file extension. Deliberately not legacy's `.hsmc`, which was the old app's on-disk save
 * format (and survives as the suffix on imported characters' ids) — a different file entirely.
 */
export const SHARE_EXTENSION = 'hsm';

/** The manifest's name inside the zip. */
export const MANIFEST_ENTRY = 'character.json';

/**
 * Portrait types a share may carry, and the entry name each is stored under.
 *
 * Doubles as the guard on reading: a portrait's entry name must be exactly the one its type maps to,
 * so a hostile manifest cannot point the unzipper at `../anything`.
 */
const PORTRAIT_EXTENSIONS: Readonly<Record<string, string>> = {
    'image/jpeg': 'jpg',
    'image/png': 'png',
    'image/gif': 'gif',
    'image/webp': 'webp',
};

/** `portrait.<ext>` for a supported image type, or null if a share cannot carry it. */
export function portraitEntry(mime: string): string | null {
    const normalized = mime.toLowerCase() === 'image/jpg' ? 'image/jpeg' : mime.toLowerCase();
    const extension = PORTRAIT_EXTENSIONS[normalized];

    return extension === undefined ? null : `portrait.${extension}`;
}

export interface SharedPortrait {
    /** The zip entry holding the bytes — always {@link portraitEntry} of {@link mime}. */
    entry: string;
    mime: string;
    /** Null when never framed, which reads as centred — the same meaning it has on a row. */
    focus: PortraitFocus | null;
}

/** One character, as it travels. Field meanings are the row's: see `Character` in `core/ports`. */
export interface SharedCharacterBody {
    /**
     * The sender's id, kept so that sharing an updated version of the same character is recognised
     * as the same character. Untrusted on the way in: see `importIdentity`.
     */
    id: string;
    name: string;
    player: string | null;
    edition: Edition;
    origin: CharacterOrigin;
    document: CharacterDocument;
    recipe: StoredRecipe | null;
    source: StoredSource | null;
    portrait: SharedPortrait | null;
}

export interface SharedCharacter {
    format: typeof SHARE_FORMAT;
    formatVersion: typeof SHARE_FORMAT_VERSION;
    /** ISO-8601. Informational — shown to whoever imports it, never used to decide anything. */
    exportedAt: string;
    /**
     * What wrote the file. Informational, like `exportedAt`: compatibility is decided by
     * `formatVersion` alone. Worth having for the day a tester's report needs explaining.
     */
    exportedBy: {appVersion: string; schemaVersion: number};
    character: SharedCharacterBody;
}

export interface ExportContext {
    appVersion: string;
    schemaVersion: number;
    exportedAt: string;
}

/**
 * Build the manifest for a stored character.
 *
 * `portraitMime` is the stored portrait's type, or null if it has none or the player chose to share
 * without it. A type the format cannot carry drops the portrait rather than failing the share — the
 * character is the point; the picture is not.
 *
 * Device-local fields (`portraitUri`, `isActive`, `filename`, `updatedAt`) are left behind on purpose:
 * none of them means anything on another phone.
 */
export function toSharedCharacter(character: Character, portraitMime: string | null, context: ExportContext): SharedCharacter {
    const entry = portraitMime === null ? null : portraitEntry(portraitMime);

    return {
        format: SHARE_FORMAT,
        formatVersion: SHARE_FORMAT_VERSION,
        exportedAt: context.exportedAt,
        exportedBy: {appVersion: context.appVersion, schemaVersion: context.schemaVersion},
        character: {
            id: character.id,
            name: character.name,
            player: character.player,
            edition: character.edition,
            origin: character.origin,
            document: character.document,
            // An imported character's row carries no recipe or source; say so explicitly rather than
            // trust that it never will, because the reader rejects an import that claims either.
            recipe: character.origin === 'imported' ? null : character.recipe,
            source: character.origin === 'imported' ? null : character.source,
            portrait: entry === null || portraitMime === null ? null : {entry, mime: portraitMime.toLowerCase(), focus: character.portraitFocus},
        },
    };
}

/** Why a file could not be read, phrased for the three different things a player should do about it. */
export type ShareParseFailure =
    /** Not one of ours at all — the wrong file was picked. */
    | {ok: false; reason: 'not-a-share'}
    /** Ours, but written by a newer app — update to read it. */
    | {ok: false; reason: 'newer-format'; formatVersion: number}
    /** Ours, but damaged or hand-edited. `detail` is for logs and bug reports, not for the player. */
    | {ok: false; reason: 'malformed'; detail: string};

export type ShareParseResult = {ok: true; shared: SharedCharacter} | ShareParseFailure;

const isObject = (value: unknown): value is Record<string, unknown> => typeof value === 'object' && value !== null && !Array.isArray(value);

const isEdition = (value: unknown): value is Edition => value === '5E' || value === '6E';

const isOrigin = (value: unknown): value is CharacterOrigin => value === 'generated' || value === 'imported' || value === 'authored';

const isFraction = (value: unknown): value is number => typeof value === 'number' && Number.isFinite(value) && value >= 0 && value <= 1;

const malformed = (detail: string): ShareParseFailure => ({ok: false, reason: 'malformed', detail});

function parseFocus(value: unknown): PortraitFocus | null | undefined {
    if (value === null) {
        return null;
    }

    if (!isObject(value) || !isFraction(value.x) || !isFraction(value.y)) {
        return undefined;
    }

    const {scale} = value;

    // Below 1 would letterbox — see PortraitFocus.scale — so it is not a framing, it is damage.
    if (typeof scale !== 'number' || !Number.isFinite(scale) || scale < 1) {
        return undefined;
    }

    return {x: value.x, y: value.y, scale};
}

function parsePortrait(value: unknown): SharedPortrait | null | string {
    if (value === null) {
        return null;
    }

    if (!isObject(value) || typeof value.mime !== 'string' || typeof value.entry !== 'string') {
        return 'portrait is not {entry, mime, focus}';
    }

    const expected = portraitEntry(value.mime);

    if (expected === null) {
        return `portrait type ${value.mime} is not supported`;
    }

    if (value.entry !== expected) {
        return `portrait entry must be ${expected}`;
    }

    const focus = parseFocus(value.focus);

    if (focus === undefined) {
        return 'portrait focus is out of range';
    }

    return {entry: expected, mime: value.mime.toLowerCase(), focus};
}

function parseBody(value: unknown): SharedCharacterBody | string {
    if (!isObject(value)) {
        return 'character is missing';
    }

    const {id, name, player, edition, origin, document, recipe, source} = value;

    if (typeof id !== 'string' || id.trim() === '') {
        return 'character id is missing';
    }

    if (typeof name !== 'string') {
        return 'character name is missing';
    }

    if (player !== null && typeof player !== 'string') {
        return 'character player is not a string';
    }

    if (!isEdition(edition)) {
        return 'character edition is not 5E or 6E';
    }

    if (!isOrigin(origin)) {
        return 'character origin is not recognised';
    }

    if (!isObject(document)) {
        return 'character document is missing';
    }

    if (recipe !== null && !isObject(recipe)) {
        return 'character recipe is not an object';
    }

    if (source !== null && !isObject(source)) {
        return 'character source is not an object';
    }

    // The one consistency rule worth enforcing: it is the one that grants edit rights. An imported
    // `.hdc` is read-only because it has no recipe or source to rebuild from, so a file claiming
    // both "imported" and a rebuild input is not something this app wrote.
    if (origin === 'imported' && (recipe !== null || source !== null)) {
        return 'an imported character cannot carry a recipe or source';
    }

    const portrait = parsePortrait(value.portrait ?? null);

    if (typeof portrait === 'string') {
        return portrait;
    }

    return {id, name, player, edition, origin, document, recipe, source, portrait};
}

/**
 * Read a manifest — the already-`JSON.parse`d contents of {@link MANIFEST_ENTRY}.
 *
 * Never throws: every failure is a {@link ShareParseFailure}, because the input is a file from
 * somebody else's phone and the UI needs to say which of three things went wrong.
 */
export function parseSharedCharacter(value: unknown): ShareParseResult {
    if (!isObject(value) || value.format !== SHARE_FORMAT) {
        return {ok: false, reason: 'not-a-share'};
    }

    const {formatVersion, exportedAt, exportedBy} = value;

    if (typeof formatVersion !== 'number' || !Number.isInteger(formatVersion) || formatVersion < 1) {
        return malformed('formatVersion is not a positive integer');
    }

    // Checked before anything else about the shape: a newer file is *expected* not to match this
    // build's idea of the shape, and "update the app" is the useful thing to tell the player.
    if (formatVersion > SHARE_FORMAT_VERSION) {
        return {ok: false, reason: 'newer-format', formatVersion};
    }

    if (typeof exportedAt !== 'string') {
        return malformed('exportedAt is missing');
    }

    if (
        !isObject(exportedBy) ||
        typeof exportedBy.appVersion !== 'string' ||
        typeof exportedBy.schemaVersion !== 'number' ||
        !Number.isInteger(exportedBy.schemaVersion)
    ) {
        return malformed('exportedBy is not {appVersion, schemaVersion}');
    }

    const character = parseBody(value.character);

    if (typeof character === 'string') {
        return malformed(character);
    }

    return {
        ok: true,
        shared: {
            format: SHARE_FORMAT,
            formatVersion: SHARE_FORMAT_VERSION,
            exportedAt,
            exportedBy: {appVersion: exportedBy.appVersion, schemaVersion: exportedBy.schemaVersion},
            character,
        },
    };
}
