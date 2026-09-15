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

import AsyncStorage from '@react-native-async-storage/async-storage';
import {withDatabaseFallback, type LegacyKeyValueSource} from 'infra/migration/asyncStorageDatabase';
import type {LegacyKeyValueStore} from 'infra/migration/legacySourceImpl';
import {createOpSqliteDatabase} from 'infra/persistence/driver/opSqliteDatabase';

const nativeModule: LegacyKeyValueStore = {
    getItem: (key) => AsyncStorage.getItem(key),
    multiRemove: (keys) => AsyncStorage.multiRemove(keys),
};

/**
 * {@link LegacyKeyValueStore} over the legacy app's AsyncStorage (read once, then
 * cleared), backed by a direct read of AsyncStorage's own SQLite file for values
 * the native module cannot return — on Android that is anything over the 2 MB
 * `CursorWindow`, which the legacy `characters` key clears easily. `close()` after
 * the migration to release the handle the fallback may have opened.
 */
export const asyncStorageKeyValue = (): LegacyKeyValueSource =>
    withDatabaseFallback(nativeModule, (name) => {
        try {
            // Both op-sqlite and AsyncStorage resolve a bare name against the
            // Android database directory (`getDatabasePath`), so this finds the file.
            return createOpSqliteDatabase({name});
        } catch {
            return null;
        }
    });
