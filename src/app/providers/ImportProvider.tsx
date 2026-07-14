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
import type {FilePicker} from 'core/ports';
import {importHdc, type ImportResult} from 'infra/import';
import {useRepositories} from 'app/providers/RepositoriesProvider';

/**
 * Provides the "import a HERO Designer character" action to the tree. Composes the
 * injected {@link FilePicker} (native document picker in the app; a fake in tests)
 * with the repositories, so callers get a single `() => Promise<ImportResult | null>`
 * (null when the user cancels).
 */
type ImportCharacter = () => Promise<ImportResult | null>;

const ImportContext = createContext<ImportCharacter | null>(null);

export interface ImportProviderProps {
    filePicker: FilePicker;
    children: React.ReactNode;
}

export function ImportProvider({filePicker, children}: ImportProviderProps): React.JSX.Element {
    const repositories = useRepositories();

    const importCharacter = useCallback<ImportCharacter>(async () => {
        const file = await filePicker.pickCharacter();
        if (file === null) {
            return null;
        }

        return importHdc(file.bytes, file.name, repositories);
    }, [filePicker, repositories]);

    return <ImportContext.Provider value={importCharacter}>{children}</ImportContext.Provider>;
}

export function useImportCharacter(): ImportCharacter {
    const value = useContext(ImportContext);
    if (value === null) {
        throw new Error('useImportCharacter must be used within an ImportProvider');
    }

    return value;
}
