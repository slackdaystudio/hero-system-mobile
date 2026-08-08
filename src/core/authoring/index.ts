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
 * Authoring a character in the app (docs/CHARACTER_AUTHORING.md).
 *
 * Pure core, no RN: a draft goes in, a priced `ParsedCharacter` comes out, and the app stores the
 * draft beside the document so the character can be re-opened. The same discipline as
 * `core/random` — and for the same reason, `core/random` is not an oracle for it.
 */
export * from './types';
export * from './catalogue';
export * from './emit';
export * from './spend';
export * from './validate';
export * from './source';
