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

import type {CharacterDocument, RandomHero, Settings, Statistics} from 'core/ports';

/**
 * One legacy character, already reconciled by the {@link LegacySource}: the
 * document comes from the authoritative `.hsmc` on disk (portrait still embedded
 * as a `data:` URI on `document.portrait`); the slot/active pointers come from
 * the old AsyncStorage `characters`/`character` keys.
 */
export interface LegacyCharacter {
    document: CharacterDocument;
    filename: string | null;
    slot: number | null;
    active: boolean;
}

/** The one-time legacy dump the v1 migration consumes. */
export interface LegacySnapshot {
    characters: LegacyCharacter[];
    settings: Partial<Settings> | null;
    statistics: Statistics | null;
    randomHero: RandomHero | null;
    version: string | null;
}

/**
 * Reads the pre-rebuild data (AsyncStorage + `hsm.db` + `.hsmc` files) into a
 * single snapshot, and clears the old AsyncStorage keys once migrated. The real
 * implementation is device-only glue (RNFS + AsyncStorage + zip); the migration
 * orchestration it feeds is exercised in node against a fake source.
 */
export interface LegacySource {
    read(): Promise<LegacySnapshot>;
    clear(): Promise<void>;
}
