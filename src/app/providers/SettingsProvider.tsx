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

import React, {createContext, useCallback, useContext, useEffect, useMemo, useState} from 'react';
import {DEFAULT_SETTINGS, type Settings} from 'core/ports';
import {useRepositories} from 'app/providers/RepositoriesProvider';

/**
 * Holds the live {@link Settings} for the app. Loads the persisted settings on
 * mount, and writes each change straight back through the repository — so a
 * change (e.g. the colour scheme) takes effect immediately and survives a
 * restart. The theme reads {@link Settings.colorScheme} from here.
 */
export interface SettingsContextValue {
    settings: Settings;
    update: <K extends keyof Settings>(key: K, value: Settings[K]) => void;
}

const SettingsContext = createContext<SettingsContextValue | null>(null);

export interface SettingsProviderProps {
    children: React.ReactNode;
    /** Seed for tests; production loads from the repository. */
    initialSettings?: Settings;
}

export function SettingsProvider({children, initialSettings}: SettingsProviderProps): React.JSX.Element {
    const {settings: repo} = useRepositories();
    const [settings, setSettings] = useState<Settings>(initialSettings ?? DEFAULT_SETTINGS);

    useEffect(() => {
        let cancelled = false;
        repo.get()
            .then((loaded) => {
                if (!cancelled) {
                    setSettings(loaded);
                }
            })
            .catch(() => {
                // Fall back to the defaults already in state.
            });
        return () => {
            cancelled = true;
        };
    }, [repo]);

    const update = useCallback(
        <K extends keyof Settings>(key: K, value: Settings[K]) => {
            setSettings((prev) => ({...prev, [key]: value}));
            repo.set(key, value).catch(() => {
                // Best-effort persist; the in-memory state already reflects the change.
            });
        },
        [repo],
    );

    const value = useMemo<SettingsContextValue>(() => ({settings, update}), [settings, update]);

    return <SettingsContext.Provider value={value}>{children}</SettingsContext.Provider>;
}

export function useSettings(): SettingsContextValue {
    const value = useContext(SettingsContext);
    if (value === null) {
        throw new Error('useSettings must be used within a SettingsProvider');
    }

    return value;
}
