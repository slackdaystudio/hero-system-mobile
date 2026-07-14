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

import type {AppStateStore, CharacterRepository, ImageStore, RandomHeroRepository, SettingsRepository, StatisticsRepository} from 'core/ports';
import type {SqlDatabase} from './driver/sqlDatabase';
import {runMigrations} from './migrations';
import {SqliteAppStateStore} from './appStateStore';
import {SqliteCharacterRepository} from './characterRepository';
import {SqliteRandomHeroRepository} from './randomHeroRepository';
import {SqliteSettingsRepository} from './settingsRepository';
import {SqliteStatisticsRepository} from './statisticsRepository';

/** Every persistence port, wired to one database + image store. */
export interface Repositories {
    characters: CharacterRepository;
    settings: SettingsRepository;
    statistics: StatisticsRepository;
    randomHero: RandomHeroRepository;
    appState: AppStateStore;
    images: ImageStore;
}

/**
 * The persistence composition root: migrate the database to the current schema,
 * then construct every repository over it. Environment-agnostic — the app passes
 * an op-sqlite {@link SqlDatabase} + an RNFS-backed {@link ImageStore}; tests pass
 * better-sqlite3 + an in-memory store — so this exact wiring is exercised in node.
 */
export function createRepositories(db: SqlDatabase, imageStore: ImageStore, now: () => string = () => new Date().toISOString()): Repositories {
    runMigrations(db);

    return {
        characters: new SqliteCharacterRepository(db, imageStore, now),
        settings: new SqliteSettingsRepository(db),
        statistics: new SqliteStatisticsRepository(db),
        randomHero: new SqliteRandomHeroRepository(db),
        appState: new SqliteAppStateStore(db),
        images: imageStore,
    };
}
