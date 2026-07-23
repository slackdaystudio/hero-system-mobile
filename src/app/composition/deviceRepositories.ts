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

import {heroDesignerCharacter, type ParsedCharacter} from 'core/hero';
import type {CharacterDocument} from 'core/ports';
import {FileImageStore} from 'infra/files/fileImageStore';
import {base64ToBytes} from 'infra/files/base64';
import sampleCharacter from './sampleCharacter.json';
import {documentDirectoryPath, nativeFileSystem} from 'infra/files/nativeFileSystem';
import {fflateUnzip} from 'infra/migration/fflateUnzip';
import {createLegacySource} from 'infra/migration/legacySourceImpl';
import {migrateV1} from 'infra/migration/migrateV1';
import {createOpSqliteDatabase} from 'infra/persistence/driver/opSqliteDatabase';
import type {SqlDatabase} from 'infra/persistence/driver/sqlDatabase';
import {createRepositories, type Repositories} from 'infra/persistence/repositories';
import {asyncStorageKeyValue} from './asyncStorageKeyValue';
import {plantDevLegacyData} from './devLegacyHarness';
import {E2E_SEED} from './e2eSeed';

// DEV: set true to plant a fake legacy install (see devLegacyHarness) and watch
// migrateV1 import it on launch. Leave false for normal behaviour.
const SIMULATE_LEGACY_DATA = false;

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

    // Demo data, only when nothing else populated the store. Dev builds always seed;
    // Release builds seed only when the E2E flag is compiled in (see e2eSeed.ts), which
    // gives the visual-regression flow a fixed Sample Hero. Production has both false.
    if ((__DEV__ || E2E_SEED) && (await repositories.characters.list()).length === 0) {
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
    // A real HeroDesigner character (run through the engine) so the detail screen
    // shows a full sheet — characteristics, rolls, decorated powers/skills.
    const document = heroDesignerCharacter.getCharacter(sampleCharacter as unknown as ParsedCharacter) as unknown as CharacterDocument;
    const info = (document.characterInfo ?? {}) as {characterName?: string; playerName?: string};
    await repositories.characters.save({
        id: 'sample-hero',
        name: info.characterName ?? 'Sample Hero',
        player: info.playerName ?? null,
        edition: heroDesignerCharacter.isFifth(document) ? '5E' : '6E',
        filename: 'sample.hsmc',
        document,
        portrait: {bytes: base64ToBytes(DEMO_PORTRAIT_PNG), mime: 'image/png'},
    });

    // A thin document to exercise the basic-info fallback path.
    await repositories.characters.save({
        id: 'demo-grond',
        name: 'Grond',
        player: 'GM',
        edition: '5E',
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
    await repositories.characters.setActive('sample-hero');
}
