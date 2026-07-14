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

import {filePathFromUri} from '../fileUri';

describe('filePathFromUri', () => {
    it('strips the file:// scheme', () => {
        expect(filePathFromUri('file:///data/user/0/com.herogmtools/cache/Defensor.hdc')).toBe('/data/user/0/com.herogmtools/cache/Defensor.hdc');
    });

    it('percent-decodes a filename with a space (the "Jay Kwon" bug)', () => {
        expect(filePathFromUri('file:///data/user/0/com.herogmtools/cache/Jay%20Kwon.hdc')).toBe('/data/user/0/com.herogmtools/cache/Jay Kwon.hdc');
    });

    it('decodes other escaped characters (parens, accents)', () => {
        expect(filePathFromUri('file:///cache/Mark%20-%20Li%20(v5a).hdc')).toBe('/cache/Mark - Li (v5a).hdc');
        expect(filePathFromUri('file:///cache/Andr%C3%A9.hdc')).toBe('/cache/André.hdc');
    });

    it('leaves an already-plain path untouched', () => {
        expect(filePathFromUri('/already/a/plain/path.hdc')).toBe('/already/a/plain/path.hdc');
    });

    it('falls back to the raw path on a malformed escape rather than throwing', () => {
        expect(filePathFromUri('file:///cache/100%.hdc')).toBe('/cache/100%.hdc');
    });
});
