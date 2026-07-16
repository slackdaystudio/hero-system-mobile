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

import {heroDesignerCharacter} from 'core/hero';
import type {CharacterDocument} from 'core/ports';
import {imageToDataUri, stripPortrait} from '../files/portrait';
import type {Repositories} from '../persistence/repositories';
import {decodeCharacterXml} from './decodeCharacterXml';
import {parseHdc} from './hdcParser';

export interface ImportResult {
    id: string;
    name: string;
}

/** File-name → a safe `.hsmc` id, matching legacy's sanitize-then-suffix. */
export function characterId(fileName: string): string {
    const base = fileName.replace(/\.(hdc|xml)$/i, '');
    const safe = base.replace(/[^a-z0-9._-]+/gi, '_').replace(/^[._-]+|[._-]+$/g, '') || 'character';

    return `${safe}.hsmc`;
}

/**
 * Import a HERO Designer `.hdc` file into the library: decode → parse → lift the
 * portrait → run the engine → derive the summary fields → save. The stored id is
 * derived from the file name, so re-importing the same file updates that character
 * (an upsert) rather than duplicating it.
 */
export async function importHdc(bytes: Uint8Array, fileName: string, repos: Repositories): Promise<ImportResult> {
    const parsed = parseHdc(decodeCharacterXml(bytes)) as Record<string, unknown>;

    // Fold the embedded <IMAGE> into a portrait data URI so the engine carries it,
    // then lift it back out to bytes for the file-based image store.
    const dataUri = imageToDataUri(parsed.image);
    if (dataUri !== undefined) {
        parsed.portrait = dataUri;
    }

    const processed = heroDesignerCharacter.getCharacter(parsed as never) as unknown as CharacterDocument;

    // `getCharacter` drops the `.hdc`'s declared point config; carry it onto the stored document so
    // the sheet can show the character's build total and campaign tier (see core `characterPoints`).
    if (parsed.basicConfiguration !== undefined) {
        processed.basicConfiguration = parsed.basicConfiguration;
    }

    const {document, portrait} = stripPortrait(processed);

    const info = (document.characterInfo ?? {}) as {characterName?: string; playerName?: string};
    const name = typeof info.characterName === 'string' && info.characterName.trim() !== '' ? info.characterName : 'Unnamed';
    const id = characterId(fileName);

    await repos.characters.save({
        id,
        name,
        player: typeof info.playerName === 'string' && info.playerName.trim() !== '' ? info.playerName : null,
        edition: heroDesignerCharacter.isFifth(document) ? '5E' : '6E',
        filename: id,
        document,
        portrait,
        // Stated, not defaulted: ids come from the file name, so `generated-brick-1.hdc` would
        // otherwise land on a generated character's row and inherit its edit rights. An imported
        // `.hdc` is the player's file and stays read-only. Clears any recipe for the same reason.
        origin: 'imported',
        recipe: null,
    });

    return {id, name};
}
