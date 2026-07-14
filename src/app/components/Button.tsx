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
import {Pressable, StyleSheet} from 'react-native';
import {useTheme} from 'app/theme';
import {Text} from './Text';

export interface ButtonProps {
    label: string;
    onPress?: () => void;
    variant?: 'primary' | 'secondary';
    disabled?: boolean;
    testID?: string;
}

/** Themed button. `primary` is filled with the accent; `secondary` is a subtle surface. */
export function Button({label, onPress, variant = 'primary', disabled = false, testID}: ButtonProps): React.JSX.Element {
    const theme = useTheme();
    const background = variant === 'primary' ? theme.colors.primary : theme.colors.surfaceAlt;
    const foreground = variant === 'primary' ? theme.colors.onPrimary : theme.colors.text;

    return (
        <Pressable
            testID={testID}
            accessibilityRole="button"
            disabled={disabled || onPress === undefined}
            onPress={onPress}
            style={({pressed}) => [styles.button, {backgroundColor: background, borderRadius: theme.radius.md, opacity: disabled ? 0.5 : pressed ? 0.85 : 1}]}>
            <Text variant="label" color={foreground} style={styles.label}>
                {label}
            </Text>
        </Pressable>
    );
}

const styles = StyleSheet.create({
    button: {
        paddingVertical: 12,
        paddingHorizontal: 16,
        alignItems: 'center',
        justifyContent: 'center',
    },
    label: {
        fontWeight: '600',
    },
});
