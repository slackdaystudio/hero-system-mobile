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

import React, {createContext, useContext, useMemo} from 'react';
import {DieRoller} from 'core/dice';
import {mathRandomRng} from 'infra/rng/mathRandomRng';

const DiceContext = createContext<DieRoller | null>(null);

export interface DiceProviderProps {
    children: React.ReactNode;
    /** Inject a roller (e.g. with a seeded Rng) in tests; defaults to Math.random. */
    dieRoller?: DieRoller;
}

export function DiceProvider({children, dieRoller}: DiceProviderProps): React.JSX.Element {
    const roller = useMemo(() => dieRoller ?? new DieRoller(mathRandomRng()), [dieRoller]);

    return <DiceContext.Provider value={roller}>{children}</DiceContext.Provider>;
}

export function useDieRoller(): DieRoller {
    const roller = useContext(DiceContext);
    if (roller === null) {
        throw new Error('useDieRoller must be used within a DiceProvider');
    }

    return roller;
}
