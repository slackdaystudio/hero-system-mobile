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
import {StyleSheet, TextInput, View, type TextStyle} from 'react-native';
import {useTheme} from 'app/theme';
import {Text} from './Text';

export interface NumberFieldProps {
    label: string;
    value: string;
    onChangeText: (value: string) => void;
    placeholder?: string;
    testID?: string;
}

/** Labelled numeric input. Value is kept as a string so the field can be empty mid-edit. */
export function NumberField({label, value, onChangeText, placeholder, testID}: NumberFieldProps): React.JSX.Element {
    const theme = useTheme();
    const inputStyle: TextStyle = {
        color: theme.colors.text,
        backgroundColor: theme.colors.surface,
        borderColor: theme.colors.border,
        borderRadius: theme.radius.sm,
    };

    return (
        <View style={styles.field}>
            <Text variant="caption" muted>
                {label}
            </Text>
            <TextInput
                testID={testID}
                value={value}
                onChangeText={onChangeText}
                keyboardType="number-pad"
                placeholder={placeholder}
                placeholderTextColor={theme.colors.textMuted}
                style={[styles.input, inputStyle]}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    field: {
        rowGap: 4,
        flex: 1,
    },
    input: {
        borderWidth: StyleSheet.hairlineWidth,
        paddingHorizontal: 12,
        paddingVertical: 10,
        fontSize: 16,
    },
});
