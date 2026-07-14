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
 * Persistence ports — the storage-agnostic repository contracts the app and
 * domain depend on. Infra implements them over SQLite (`infra/persistence`); the
 * UI never touches a raw database handle. See docs/PERSISTENCE.md.
 */

export type ColorScheme = 'system' | 'light' | 'dark';

/** Global, app-wide settings (per-character edition is derived, not stored here). */
export interface Settings {
    useFifthEdition: boolean;
    playSounds: boolean;
    onlyDiceSounds: boolean;
    showAnimations: boolean;
    increaseEntropy: boolean;
    colorScheme: ColorScheme;
}

export const DEFAULT_SETTINGS: Settings = {
    useFifthEdition: false,
    playSounds: true,
    onlyDiceSounds: false,
    showAnimations: true,
    increaseEntropy: true,
    colorScheme: 'system',
};

export interface SettingsRepository {
    get(): Promise<Settings>;
    set<K extends keyof Settings>(key: K, value: Settings[K]): Promise<void>;
    reset(): Promise<void>;
}
