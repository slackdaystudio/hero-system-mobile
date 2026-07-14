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

import {DEFAULT_STATISTICS} from 'core/ports';
import {inMemoryFileSystem} from '../../files/fileSystem';
import {FileImageStore} from '../../files/fileImageStore';
import {createBetterSqlite3Database} from '../../persistence/driver/betterSqlite3Database';
import {createRepositories} from '../../persistence/repositories';
import type {LegacySnapshot, LegacySource} from '../legacySource';
import {migrateV1, MIGRATED_V1_FLAG, VERSION_KEY} from '../migrateV1';

// data:image/png;base64,AQID decodes to the bytes [1, 2, 3].
const PORTRAIT_DATA_URI = 'data:image/png;base64,AQID';

const snapshot = (): LegacySnapshot => ({
    characters: [
        {
            filename: 'defensor.hsmc',
            slot: 0,
            active: true,
            document: {
                characterInfo: {characterName: 'Defensor', playerName: 'Phil'},
                characteristics: [{definition: '(Hero System 6th Edition)'}],
                portrait: PORTRAIT_DATA_URI,
            },
        },
        {
            filename: 'grond.hsmc',
            slot: 1,
            active: false,
            document: {
                characterInfo: {characterName: 'Grond', playerName: 'GM'},
                characteristics: [{definition: '(Hero System Fifth Edition Revised)'}],
            },
        },
    ],
    settings: {showAnimations: false, useFifthEdition: true},
    statistics: {...DEFAULT_STATISTICS, sum: 42},
    randomHero: {name: 'Random Guy'},
    version: '2.3.0',
});

const fakeSource = (snap: LegacySnapshot) => {
    let cleared = false;
    const source: LegacySource = {
        read: async () => snap,
        clear: async () => {
            cleared = true;
        },
    };
    return {source, wasCleared: () => cleared};
};

const setup = () => {
    const db = createBetterSqlite3Database();
    const fs = inMemoryFileSystem();
    let counter = 0;
    const images = new FileImageStore(fs, '/Documents/images', () => `p${++counter}`);
    const repos = createRepositories(db, images, () => '2026-01-01T00:00:00.000Z');
    return {repos, fs};
};

describe('migrateV1 (real SQLite + FileImageStore)', () => {
    it('imports characters with derived edition, lifted portrait, and preserved slots/active', async () => {
        const {repos, fs} = setup();
        const {source, wasCleared} = fakeSource(snapshot());

        const result = await migrateV1(repos, source, () => '2026-07-13T00:00:00.000Z');

        expect(result).toEqual({migrated: true, characters: 2, portraits: 1});

        const list = await repos.characters.list();
        expect(list.map((c) => [c.name, c.edition, c.slot])).toEqual([
            ['Defensor', '6E', 0],
            ['Grond', '5E', 1],
        ]);

        // The portrait was lifted to a file and the row references it; the document
        // no longer carries the base64 blob.
        expect(await fs.readFile('/Documents/images/p1.png')).toEqual(new Uint8Array([1, 2, 3]));
        const defensor = await repos.characters.get('defensor.hsmc');
        expect(defensor?.portraitUri).toBe('file:///Documents/images/p1.png');
        expect(defensor?.document).not.toHaveProperty('portrait');
        expect(defensor?.player).toBe('Phil');

        expect((await repos.characters.getActive())?.name).toBe('Defensor');
        expect(wasCleared()).toBe(true);
    });

    it('carries over settings, statistics, random hero, and version', async () => {
        const {repos} = setup();
        const {source} = fakeSource(snapshot());

        await migrateV1(repos, source);

        const settings = await repos.settings.get();
        expect(settings.showAnimations).toBe(false);
        expect(settings.useFifthEdition).toBe(true);
        expect(settings.colorScheme).toBe('system'); // untouched default
        expect((await repos.statistics.get()).sum).toBe(42);
        expect((await repos.randomHero.get())?.name).toBe('Random Guy');
        expect(await repos.appState.get(VERSION_KEY)).toBe('2.3.0');
    });

    it('is idempotent: a second run does nothing and does not duplicate rows', async () => {
        const {repos} = setup();

        const first = await migrateV1(repos, fakeSource(snapshot()).source);
        expect(first.migrated).toBe(true);
        expect(await repos.appState.get(MIGRATED_V1_FLAG)).not.toBeNull();

        const {source, wasCleared} = fakeSource(snapshot());
        const second = await migrateV1(repos, source);

        expect(second).toEqual({migrated: false, characters: 0, portraits: 0});
        expect(await repos.characters.list()).toHaveLength(2);
        expect(wasCleared()).toBe(false); // source never even read
    });
});
