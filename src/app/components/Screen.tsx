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

import React from 'react';
import {StatusBar, StyleSheet, View, type ViewProps, type ViewStyle} from 'react-native';
import {useTheme} from 'app/theme';

export interface ScreenProps extends ViewProps {
    children?: React.ReactNode;
}

/** Full-bleed themed screen container + matching status-bar style. */
export function Screen({style, children, ...rest}: ScreenProps): React.JSX.Element {
    const theme = useTheme();
    const background: ViewStyle = {backgroundColor: theme.colors.background};

    return (
        <View style={[styles.screen, background, style]} {...rest}>
            <StatusBar barStyle={theme.scheme === 'dark' ? 'light-content' : 'dark-content'} />
            {children}
        </View>
    );
}

const styles = StyleSheet.create({
    screen: {
        flex: 1,
    },
});
