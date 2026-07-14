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

import xml2js from 'react-native-xml2js';
import type {ParsedCharacter} from 'core/hero';
import {isFloat, isInt, toCamelCase} from 'core/util';

/**
 * Parse a HERO Designer `.hdc` XML document into the {@link ParsedCharacter} shape
 * the engine's `getCharacter` consumes. Uses the exact `react-native-xml2js`
 * configuration and value coercion as legacy `File._loadHdcCharacter` /
 * `_parseXmlValue`, so the output is byte-identical to the golden-master fixtures.
 */
export function parseHdc(xml: string): ParsedCharacter {
    const parser = new xml2js.Parser({
        explicitArray: false,
        mergeAttrs: true,
        emptyTag: null,
        explicitRoot: false,
        attrNameProcessors: [toCamelCase],
        attrValueProcessors: [parseXmlValue],
        tagNameProcessors: [toCamelCase],
        valueProcessors: [parseXmlValue],
    });

    let parsed: unknown;
    let failure: Error | null = null;
    // parseString invokes its callback synchronously for an in-memory string.
    parser.parseString(xml, (error: Error | null, result: unknown) => {
        failure = error;
        parsed = result;
    });

    if (failure !== null) {
        throw failure;
    }

    return parsed as ParsedCharacter;
}

// is-base64 (default options): a value that is valid base64 is left untouched so
// portrait payloads survive the whitespace cleanup below. Inlined to match legacy.
const BASE64 = /^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/gi;

/** Port of legacy `File._parseXmlValue`: coerce numbers/bools/null, else clean whitespace. */
function parseXmlValue(value: string): string | number | boolean | null {
    if (value === null || value === undefined || value.trim() === '') {
        return null;
    }
    if (isInt(value)) {
        return parseInt(value, 10);
    }
    if (isFloat(value)) {
        return parseFloat(value);
    }
    if (value === 'true' || value === 'false' || value.toLowerCase() === 'yes' || value.toLowerCase() === 'no') {
        return value === 'true' || value.toLowerCase() === 'yes';
    }
    if (new RegExp(BASE64).test(value)) {
        return value;
    }

    return value.replace(/\r\n\t\t\t\t/gi, '').replace(/\r\n/gi, '\n');
}
