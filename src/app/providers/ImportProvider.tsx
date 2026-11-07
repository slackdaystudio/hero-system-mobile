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
import {Alert} from 'react-native';
import type {FilePicker} from 'core/ports';
import type {LibraryEntry, SharedCharacterBody} from 'core/share';
import {importHdc, type ImportResult} from 'infra/import';
import {isZip, receiveCharacter, type ConflictChoice, type ReceiveResult} from 'infra/share';
import {useRepositories} from 'app/providers/RepositoriesProvider';
import {canDisplayCharacter} from 'app/screens/characterSheet';

/**
 * Provides the "import a character" action to the tree. Composes the injected {@link FilePicker}
 * (native document picker in the app; a fake in tests) with the repositories, so callers get a
 * single `() => Promise<ImportResult | null>` — null when the player cancels, at the picker or at
 * the replace/copy prompt.
 *
 * One button takes both kinds of file, told apart by content rather than name (see `isZip`): a
 * HERO Designer `.hdc`, which imports exactly as it always has, and a shared `.hsm`
 * (docs/SHARING.md), which goes through `receiveCharacter`.
 */
type ImportCharacter = () => Promise<ImportResult | null>;

/** Asked when a received character's id is already in the library. */
export type ResolveConflict = (existing: LibraryEntry, incoming: SharedCharacterBody) => Promise<ConflictChoice>;

const ImportContext = createContext<ImportCharacter | null>(null);

/**
 * The prompt on a device: a native alert naming the character that would be overwritten.
 *
 * Three buttons is Android's limit, and three is what this needs. "Import as copy" is last, which
 * is the positive slot on Android and reads as the preferred action on iOS — the default agreed for
 * #71, because a copy loses nothing and a replace cannot be undone.
 */
export const alertConflict: ResolveConflict = (existing, incoming) =>
    new Promise((resolve) => {
        const sameName = existing.name === incoming.name;

        Alert.alert(
            'Already in your library',
            sameName
                ? `You already have "${existing.name}". Keep both, or replace yours with the one you received?`
                : `This is a newer copy of "${existing.name}" (now called "${incoming.name}"). Keep both, or replace yours?`,
            [
                {text: 'Cancel', style: 'cancel', onPress: () => resolve('cancel')},
                {text: 'Replace', style: 'destructive', onPress: () => resolve('replace')},
                {text: 'Import as copy', isPreferred: true, onPress: () => resolve('copy')},
            ],
            {cancelable: true, onDismiss: () => resolve('cancel')},
        );
    });

/**
 * A shared file that could not be imported. `message` is for the player; `result` keeps the reason
 * and, for a damaged file, the validator's detail — for logs and bug reports, not the alert.
 */
export class ReceiveError extends Error {
    constructor(readonly result: Exclude<ReceiveResult, {status: string}>) {
        super(receiveFailureMessage(result));
        this.name = 'ReceiveError';
    }
}

/** What the player is told for each way a shared file can fail. */
export function receiveFailureMessage(result: Exclude<ReceiveResult, {status: string}>): string {
    switch (result.reason) {
        case 'not-a-share':
            return "That file isn't a HERO System Mobile character.";
        case 'newer-format':
            return 'This character was shared from a newer version of HERO System Mobile. Update the app to open it.';
        case 'malformed':
            return 'That character file is damaged and could not be opened.';
        case 'undisplayable':
            return "That character's sheet could not be shown, so it was not imported.";
    }
}

export interface ImportProviderProps {
    filePicker: FilePicker;
    /** Injectable for tests; the device uses {@link alertConflict}. */
    resolveConflict?: ResolveConflict;
    children: React.ReactNode;
}

export function ImportProvider({filePicker, resolveConflict = alertConflict, children}: ImportProviderProps): React.JSX.Element {
    const repositories = useRepositories();

    const importCharacter = useCallback<ImportCharacter>(async () => {
        const file = await filePicker.pickCharacter();
        if (file === null) {
            return null;
        }

        if (!isZip(file.bytes)) {
            return importHdc(file.bytes, file.name, repositories);
        }

        const result = await receiveCharacter(file.bytes, repositories, {
            canDisplay: (incoming) => canDisplayCharacter(incoming.document, incoming.edition),
            resolveConflict,
        });

        if ('status' in result) {
            return result.status === 'cancelled' ? null : {id: result.id, name: result.name};
        }

        throw new ReceiveError(result);
    }, [filePicker, repositories, resolveConflict]);

    return <ImportContext.Provider value={importCharacter}>{children}</ImportContext.Provider>;
}

export function useImportCharacter(): ImportCharacter {
    const value = useContext(ImportContext);
    if (value === null) {
        throw new Error('useImportCharacter must be used within an ImportProvider');
    }

    return value;
}
