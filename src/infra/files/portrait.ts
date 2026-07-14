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

import type {CharacterDocument, PortraitInput} from 'core/ports';

/** Decode a `data:<mime>;base64,<data>` portrait URI into bytes, or undefined. */
export function decodeDataUri(value: unknown): PortraitInput | undefined {
    if (typeof value !== 'string') {
        return undefined;
    }

    const match = /^data:([^;]+);base64,(.*)$/s.exec(value);
    if (match === null) {
        return undefined;
    }

    const [, mime, base64] = match;
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
        bytes[i] = binary.charCodeAt(i);
    }

    return {bytes, mime};
}

/** Lift an embedded `portrait` data URI out of a document; return the portrait-free doc + bytes. */
export function stripPortrait(document: CharacterDocument): {document: CharacterDocument; portrait: PortraitInput | undefined} {
    const {portrait, ...rest} = document as Record<string, unknown>;

    return {document: rest, portrait: decodeDataUri(portrait)};
}

/**
 * Build a `data:image/<ext>;base64,...` URI from a parsed HERO Designer `<IMAGE>`
 * element (`{fileName, _: <base64>}`), stripping stray line breaks from the payload.
 * Port of legacy `File._getDataUri`.
 */
export function imageToDataUri(image: unknown): string | undefined {
    if (typeof image !== 'object' || image === null) {
        return undefined;
    }

    const {fileName, _: payload} = image as {fileName?: unknown; _?: unknown};
    if (typeof fileName !== 'string' || typeof payload !== 'string') {
        return undefined;
    }

    const extension = fileName.split('.').pop() ?? 'jpg';

    return `data:image/${extension};base64,${payload.replace(/\r\n|\n|\r/g, '')}`;
}
