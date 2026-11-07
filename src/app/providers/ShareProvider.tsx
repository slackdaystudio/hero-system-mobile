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

import React, {createContext, useCallback, useContext} from 'react';
import type {FileSharer} from 'core/ports';
import type {FileSystem} from 'infra/files/fileSystem';
import {SCHEMA_VERSION} from 'infra/persistence/migrations';
import {SHARE_MIME, packCharacter} from 'infra/share';
import {APP_VERSION} from 'app/appVersion';
import {useRepositories} from 'app/providers/RepositoriesProvider';

/**
 * Provides "share this character as a `.hsm`" to the tree (docs/SHARING.md, piece 3).
 *
 * Mirrors {@link ImportProvider}: the platform pieces — the share sheet and the file system the
 * portrait is read from — are injected, so screens depend only on the action and tests supply fakes.
 */
export interface ShareOutcome {
    result: 'shared' | 'dismissed';
    /** False when the character has a portrait that could not be read; it was shared without it. */
    portraitIncluded: boolean;
}

type ShareCharacter = (id: string) => Promise<ShareOutcome>;

const ShareContext = createContext<ShareCharacter | null>(null);

const currentTime = (): string => new Date().toISOString();

export interface ShareProviderProps {
    fileSharer: FileSharer;
    fileSystem: FileSystem;
    /** Injectable for tests; the export timestamp is informational only. */
    now?: () => string;
    children: React.ReactNode;
}

export function ShareProvider({fileSharer, fileSystem, now = currentTime, children}: ShareProviderProps): React.JSX.Element {
    const repositories = useRepositories();

    const shareCharacter = useCallback<ShareCharacter>(
        async (id) => {
            const character = await repositories.characters.get(id);

            if (character === null) {
                throw new Error('That character is no longer in the library.');
            }

            const packed = await packCharacter(character, fileSystem, {appVersion: APP_VERSION, schemaVersion: SCHEMA_VERSION, exportedAt: now()});
            const result = await fileSharer.share({bytes: packed.bytes, fileName: packed.fileName, mime: SHARE_MIME, title: `Share ${character.name}`});

            return {result, portraitIncluded: packed.portraitIncluded};
        },
        [repositories, fileSharer, fileSystem, now],
    );

    return <ShareContext.Provider value={shareCharacter}>{children}</ShareContext.Provider>;
}

export function useShareCharacter(): ShareCharacter {
    const value = useContext(ShareContext);

    if (value === null) {
        throw new Error('useShareCharacter must be used within a ShareProvider');
    }

    return value;
}
