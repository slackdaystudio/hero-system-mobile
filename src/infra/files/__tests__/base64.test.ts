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

import {base64ToBytes, bytesToBase64} from '../base64';

const bytesOf = (text: string): Uint8Array => new Uint8Array([...text].map((c) => c.charCodeAt(0)));

describe('base64', () => {
    it('matches known vectors both ways', () => {
        expect(bytesToBase64(new Uint8Array([1, 2, 3]))).toBe('AQID');
        expect(base64ToBytes('AQID')).toEqual(new Uint8Array([1, 2, 3]));
        expect(bytesToBase64(bytesOf('Man'))).toBe('TWFu');
        expect(bytesToBase64(bytesOf('M'))).toBe('TQ==');
        expect(bytesToBase64(bytesOf('Ma'))).toBe('TWE=');
    });

    it('round-trips arbitrary byte lengths, including padding cases', () => {
        for (let length = 0; length <= 260; length++) {
            const bytes = new Uint8Array(length);
            for (let i = 0; i < length; i++) {
                bytes[i] = (i * 37 + 11) % 256;
            }

            expect(base64ToBytes(bytesToBase64(bytes))).toEqual(bytes);
        }
    });

    it('ignores newlines/whitespace when decoding', () => {
        expect(base64ToBytes('AQ\nID')).toEqual(new Uint8Array([1, 2, 3]));
    });
});
