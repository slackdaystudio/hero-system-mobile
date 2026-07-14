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

declare module 'react-native-xml2js' {
    export interface ParserOptions {
        explicitArray?: boolean;
        mergeAttrs?: boolean;
        emptyTag?: unknown;
        explicitRoot?: boolean;
        attrNameProcessors?: Array<(name: string) => string>;
        attrValueProcessors?: Array<(value: string) => unknown>;
        tagNameProcessors?: Array<(name: string) => string>;
        valueProcessors?: Array<(value: string) => unknown>;
    }

    export class Parser {
        constructor(options?: ParserOptions);
        parseString(xml: string, callback: (error: Error | null, result: unknown) => void): void;
    }

    const xml2js: {Parser: typeof Parser};
    export default xml2js;
}
