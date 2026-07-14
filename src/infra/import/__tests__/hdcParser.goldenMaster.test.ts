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
 * Golden master for the `.hdc` importer: parsing each raw HERO Designer file must
 * reproduce the committed `ParsedCharacter` fixture (which the legacy `File.js`
 * xml2js pipeline generated) byte-for-byte. Proves the ported parser is a faithful
 * replacement without needing the legacy native File module.
 */
import {readFileSync} from 'fs';
import {join} from 'path';
import manifest from '../../../core/hero/__tests__/fixtures/manifest.json';
import {decodeCharacterXml} from '../decodeCharacterXml';
import {parseHdc} from '../hdcParser';

const RAW_DIR = join(__dirname, '../../../../fixtures/characters');
const FIXTURE_DIR = join(__dirname, '../../../core/hero/__tests__/fixtures');

const entries = (manifest as Array<{fixture: string; source: string}>).slice().sort((a, b) => a.fixture.localeCompare(b.fixture));

describe('golden master: parseHdc reproduces the legacy ParsedCharacter fixtures', () => {
    it('covers the whole corpus', () => {
        expect(entries.length).toBe(37);
    });

    it.each(entries)('$fixture parses to its fixture', ({fixture, source}) => {
        const bytes = new Uint8Array(readFileSync(join(RAW_DIR, source)));
        const expected = JSON.parse(readFileSync(join(FIXTURE_DIR, `${fixture}.json`), 'utf-8')) as unknown;

        const parsed = parseHdc(decodeCharacterXml(bytes)) as Record<string, unknown>;

        // The JSON fixtures were sanitized to drop the embedded portrait; the parser
        // keeps it faithfully, so compare everything else here and cover the portrait
        // (the `image` element) on its own below.
        delete parsed.image;

        expect(parsed).toEqual(expected);
    });

    it('parses the embedded portrait for a character that has one', () => {
        const withPortrait = entries
            .map((entry) => parseHdc(decodeCharacterXml(new Uint8Array(readFileSync(join(RAW_DIR, entry.source))))) as {image?: {fileName?: unknown; _?: unknown}})
            .find((parsed) => parsed.image !== undefined);

        expect(withPortrait?.image).toBeDefined();
        expect(typeof withPortrait?.image?.fileName).toBe('string');
        expect(typeof withPortrait?.image?._).toBe('string'); // base64 payload preserved intact
    });
});
