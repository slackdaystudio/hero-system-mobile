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
 * Pure-JS base64 — no dependency on `atob`/`btoa`/`Buffer`, so it behaves
 * identically on Hermes and in node. Used by the RNFS {@link FileSystem} adapter,
 * which reads/writes file bytes as base64 strings.
 */
const CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';

export const bytesToBase64 = (bytes: Uint8Array): string => {
    let out = '';

    for (let i = 0; i < bytes.length; i += 3) {
        const hasSecond = i + 1 < bytes.length;
        const hasThird = i + 2 < bytes.length;
        const b0 = bytes[i];
        const b1 = hasSecond ? bytes[i + 1] : 0;
        const b2 = hasThird ? bytes[i + 2] : 0;

        out += CHARS[b0 >> 2];
        out += CHARS[((b0 & 0x03) << 4) | (b1 >> 4)];
        out += hasSecond ? CHARS[((b1 & 0x0f) << 2) | (b2 >> 6)] : '=';
        out += hasThird ? CHARS[b2 & 0x3f] : '=';
    }

    return out;
};

export const base64ToBytes = (base64: string): Uint8Array => {
    const clean = base64.replace(/[^A-Za-z0-9+/]/g, '');
    const bytes = new Uint8Array(Math.floor((clean.length * 6) / 8));

    let bits = 0;
    let value = 0;
    let position = 0;

    for (let i = 0; i < clean.length; i++) {
        value = (value << 6) | CHARS.indexOf(clean[i]);
        bits += 6;

        if (bits >= 8) {
            bits -= 8;
            bytes[position++] = (value >> bits) & 0xff;
        }
    }

    return bytes;
};
