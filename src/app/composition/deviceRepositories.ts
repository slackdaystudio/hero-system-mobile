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

import {FileImageStore} from 'infra/files/fileImageStore';
import {base64ToBytes} from 'infra/files/base64';
import {documentDirectoryPath, nativeFileSystem} from 'infra/files/nativeFileSystem';
import {fflateUnzip} from 'infra/migration/fflateUnzip';
import {createLegacySource} from 'infra/migration/legacySourceImpl';
import {migrateV1} from 'infra/migration/migrateV1';
import {createOpSqliteDatabase} from 'infra/persistence/driver/opSqliteDatabase';
import type {SqlDatabase} from 'infra/persistence/driver/sqlDatabase';
import {createRepositories, type Repositories} from 'infra/persistence/repositories';
import {asyncStorageKeyValue} from './asyncStorageKeyValue';
import {plantDevLegacyData} from './devLegacyHarness';

// DEV: set true to plant a fake legacy install (see devLegacyHarness) and watch
// migrateV1 import it on launch. Leave false for normal behaviour.
const SIMULATE_LEGACY_DATA = true;

// A distinct runtime DB file. The legacy `hsm.db` is read only during migration
// (its `settings`/`statistics` tables differ from ours and must not collide).
const RUNTIME_DATABASE = 'herosystem.db';

// 1×1 PNG — proves the whole portrait path on-device (bytes -> RNFS file -> <Image>).
const DEMO_PORTRAIT_PNG = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==';

/**
 * The on-device composition root: open op-sqlite, wire an RNFS-backed image store,
 * migrate, and construct every repository (see docs/PERSISTENCE.md). Also runs a
 * best-effort startup orphan sweep. In dev builds it seeds a couple of characters
 * when the store is empty, so a fresh device shows a populated list.
 */
export async function createDeviceRepositories(): Promise<Repositories> {
    const db = createOpSqliteDatabase({name: RUNTIME_DATABASE});
    const imageStore = new FileImageStore(nativeFileSystem(), `${documentDirectoryPath()}/images`);

    const repositories = createRepositories(db, imageStore); // runs migrations

    if (__DEV__ && SIMULATE_LEGACY_DATA) {
        await plantDevLegacyData(db);
    }

    // One-time import of legacy data (AsyncStorage + hsm.db + .hsmc). Guarded by
    // migrateV1's own migrated_v1 flag; a no-op on a device with no legacy data.
    await runLegacyMigration(repositories);

    await sweepOrphanedPortraits(repositories, imageStore);

    // Dev-only demo data, only when nothing else populated the store.
    if (__DEV__ && (await repositories.characters.list()).length === 0) {
        await seedDemoCharacters(repositories);
    }

    return repositories;
}

/** Best-effort open of the legacy `hsm.db`; null if it isn't there / can't be read. */
function openLegacyDatabase(): SqlDatabase | null {
    try {
        return createOpSqliteDatabase({name: 'hsm.db'});
    } catch {
        return null;
    }
}

async function runLegacyMigration(repositories: Repositories): Promise<void> {
    const legacyDb = openLegacyDatabase();

    try {
        const source = createLegacySource({
            keyValue: asyncStorageKeyValue(),
            fileSystem: nativeFileSystem(),
            unzip: fflateUnzip,
            characterDir: `${documentDirectoryPath()}/character`,
            legacyDb,
        });

        await migrateV1(repositories, source);
    } finally {
        legacyDb?.close();
    }
}

/** Delete image files no surviving character references (portrait id === filename). */
async function sweepOrphanedPortraits(repositories: Repositories, imageStore: FileImageStore): Promise<void> {
    const referenced = new Set(
        (await repositories.characters.list())
            .map((summary) => summary.portraitUri)
            .filter((uri): uri is string => uri !== null)
            .map((uri) => uri.slice(uri.lastIndexOf('/') + 1)),
    );

    await imageStore.sweepOrphans(referenced);
}

async function seedDemoCharacters(repositories: Repositories): Promise<void> {
    await repositories.characters.save({
        id: 'demo-defensor',
        name: 'Defensor',
        player: 'Phil',
        edition: '6E',
        slot: 0,
        filename: 'defensor.hsmc',
        document: {
            characterInfo: {characterName: 'Defensor'},
            characteristics: [
                {name: 'STR', value: 20},
                {name: 'DEX', value: 18},
                {name: 'CON', value: 23},
            ],
            powers: [{name: 'Force Field', xmlid: 'FORCEFIELD'}, {name: 'Flight', xmlid: 'FLIGHT'}],
        },
        portrait: {bytes: base64ToBytes(DEMO_PORTRAIT_PNG), mime: 'image/png'},
    });
    await repositories.characters.save({
        id: 'demo-grond',
        name: 'Grond',
        player: 'GM',
        edition: '5E',
        slot: 1,
        filename: 'grond.hsmc',
        document: {
            characterInfo: {characterName: 'Grond'},
            characteristics: [
                {name: 'STR', value: 60},
                {name: 'BODY', value: 30},
            ],
            powers: [{name: 'Rampage', xmlid: 'CUSTOMPOWER'}],
        },
    });
    await repositories.characters.setActive('demo-defensor');
}
