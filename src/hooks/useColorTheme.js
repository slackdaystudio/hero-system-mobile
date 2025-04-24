import {useColorScheme} from 'react-native';
import {createStyles, getColorTheme} from '../Styles';

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

export const DARK = 'dark';

export const LIGHT = 'light';

export const SYSTEM = 'system';

export const THEMES = [LIGHT, DARK];

export const ALL_THEMES = [SYSTEM, LIGHT, DARK];

export const useColorTheme = (userScheme) => {
    const systemScheme = useColorScheme();

    let scheme = SYSTEM;

    if (THEMES.includes(userScheme)) {
        scheme = userScheme;
    } else {
        scheme = systemScheme;
    }

    return {
        Colors: getColorTheme(scheme),
        styles: createStyles(scheme),
        systemScheme,
    };
};
