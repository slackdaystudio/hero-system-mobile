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
import {useColorScheme} from 'react-native';
import type {ColorScheme} from 'core/ports';
import {type Theme, themeFor} from './theme';

const ThemeContext = createContext<Theme | null>(null);

export interface ThemeProviderProps {
    /** From settings: 'system' follows the OS; 'light'/'dark' pin it. */
    colorScheme?: ColorScheme;
    children: React.ReactNode;
}

export function ThemeProvider({colorScheme = 'system', children}: ThemeProviderProps): React.JSX.Element {
    const systemScheme = useColorScheme();
    const resolved = colorScheme === 'system' ? systemScheme ?? 'dark' : colorScheme;
    const theme = useMemo(() => themeFor(resolved), [resolved]);

    return <ThemeContext.Provider value={theme}>{children}</ThemeContext.Provider>;
}

export function useTheme(): Theme {
    const theme = useContext(ThemeContext);
    if (theme === null) {
        throw new Error('useTheme must be used within a ThemeProvider');
    }

    return theme;
}
