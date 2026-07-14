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

/* eslint-disable no-bitwise */

/**
 * Decode raw HERO Designer `.hdc` bytes to XML text. HD writes UTF-16 (usually
 * with a BOM); older/hand-edited files may be UTF-8. Mirrors legacy `File._decode`:
 * try UTF-16, fall back to UTF-8, and validate against the `<?xml` prolog.
 */
export function decodeCharacterXml(bytes: Uint8Array): string {
    const utf16 = decodeUtf16(bytes);
    if (utf16.startsWith('<?xml')) {
        return utf16;
    }

    const utf8 = decodeUtf8(bytes);
    if (utf8.startsWith('<?xml')) {
        return utf8;
    }

    throw new Error('Unable to decode character payload');
}

const decodeUtf16 = (bytes: Uint8Array): string => {
    let start = 0;
    let littleEndian = true;

    if (bytes.length >= 2 && bytes[0] === 0xff && bytes[1] === 0xfe) {
        start = 2;
    } else if (bytes.length >= 2 && bytes[0] === 0xfe && bytes[1] === 0xff) {
        start = 2;
        littleEndian = false;
    }

    // JS strings are already UTF-16, so emit code units directly (surrogate pairs
    // survive as-is). Build in chunks to avoid a huge apply() argument list.
    const units: number[] = [];
    let out = '';
    for (let i = start; i + 1 < bytes.length; i += 2) {
        const unit = littleEndian ? bytes[i] | (bytes[i + 1] << 8) : (bytes[i] << 8) | bytes[i + 1];
        units.push(unit);
        if (units.length === 8192) {
            out += String.fromCharCode(...units);
            units.length = 0;
        }
    }

    return out + String.fromCharCode(...units);
};

const decodeUtf8 = (bytes: Uint8Array): string => {
    const codePoints: number[] = [];
    let out = '';

    for (let i = 0; i < bytes.length; ) {
        const byte = bytes[i];
        let codePoint: number;
        let size: number;

        if (byte < 0x80) {
            codePoint = byte;
            size = 1;
        } else if (byte >> 5 === 0b110) {
            codePoint = byte & 0x1f;
            size = 2;
        } else if (byte >> 4 === 0b1110) {
            codePoint = byte & 0x0f;
            size = 3;
        } else {
            codePoint = byte & 0x07;
            size = 4;
        }

        for (let j = 1; j < size && i + j < bytes.length; j++) {
            codePoint = (codePoint << 6) | (bytes[i + j] & 0x3f);
        }
        i += size;

        codePoints.push(codePoint);
        if (codePoints.length === 8192) {
            out += String.fromCodePoint(...codePoints);
            codePoints.length = 0;
        }
    }

    return out + String.fromCodePoint(...codePoints);
};
