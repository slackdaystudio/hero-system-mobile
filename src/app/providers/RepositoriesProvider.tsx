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

import React, {createContext, useContext} from 'react';
import type {CharacterRepository} from 'core/ports';
import type {Repositories} from 'infra/persistence/repositories';

/**
 * Makes the composed {@link Repositories} available to the tree. The app's entry
 * feeds the real composition root (op-sqlite + RNFS); tests feed fakes. Screens
 * consume the port interfaces below — never a raw database handle.
 */
const RepositoriesContext = createContext<Repositories | null>(null);

export interface RepositoriesProviderProps {
    repositories: Repositories;
    children: React.ReactNode;
}

export function RepositoriesProvider({repositories, children}: RepositoriesProviderProps): React.JSX.Element {
    return <RepositoriesContext.Provider value={repositories}>{children}</RepositoriesContext.Provider>;
}

export function useRepositories(): Repositories {
    const repositories = useContext(RepositoriesContext);
    if (repositories === null) {
        throw new Error('useRepositories must be used within a RepositoriesProvider');
    }

    return repositories;
}

export function useCharacterRepository(): CharacterRepository {
    return useRepositories().characters;
}
