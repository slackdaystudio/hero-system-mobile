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

import React, {useState} from 'react';
import {FlatList, Modal, Pressable, StyleSheet, View, type ViewStyle} from 'react-native';
import {Text} from './Text';
import {useTheme} from 'app/theme';

export interface SelectFieldProps {
    label: string;
    value: string;
    options: readonly string[];
    onChange: (value: string) => void;
    /** Shown under the label — e.g. what picking a different value will cost. */
    hint?: string;
    disabled?: boolean;
    testID?: string;
}

/**
 * Labelled one-of-many picker: reads like {@link TextField}, opens a sheet of options.
 *
 * A {@link SegmentedControl} is the right shape for two or three choices; this is for the dozen an
 * archetype list has. Deliberately not a native picker — those look nothing like each other across
 * platforms, and the app owns its look (see docs/KNOWN_DEVIATIONS.md on why we don't take UI kits).
 */
export function SelectField({label, value, options, onChange, hint, disabled = false, testID}: SelectFieldProps): React.JSX.Element {
    const theme = useTheme();
    const [open, setOpen] = useState(false);

    const box: ViewStyle = {
        backgroundColor: theme.colors.surface,
        borderColor: theme.colors.border,
        borderRadius: theme.radius.sm,
        opacity: disabled ? 0.5 : 1,
    };

    return (
        <View style={styles.field}>
            <Text variant="caption" muted>
                {label}
            </Text>
            <Pressable
                testID={testID}
                accessibilityRole="button"
                accessibilityState={{disabled, expanded: open}}
                disabled={disabled}
                onPress={() => setOpen(true)}
                style={[styles.box, box]}>
                <Text>{value}</Text>
                <Text muted>▾</Text>
            </Pressable>
            {hint !== undefined ? (
                <Text variant="caption" muted>
                    {hint}
                </Text>
            ) : null}

            <Modal visible={open} transparent animationType="fade" onRequestClose={() => setOpen(false)}>
                {/* Tapping outside dismisses — the only way back out on Android without a header. */}
                <Pressable testID={testID !== undefined ? `${testID}-backdrop` : undefined} style={styles.backdrop} onPress={() => setOpen(false)}>
                    <Pressable
                        style={[styles.sheet, {backgroundColor: theme.colors.surface, borderRadius: theme.radius.md}]}
                        onPress={() => {
                            // Swallow: a tap on the sheet itself must not dismiss it.
                        }}>
                        <Text variant="label" muted style={styles.sheetTitle}>
                            {label.toUpperCase()}
                        </Text>
                        <FlatList
                            data={options as string[]}
                            keyExtractor={(option) => option}
                            renderItem={({item}) => (
                                <Pressable
                                    testID={testID !== undefined ? `${testID}-option-${item}` : undefined}
                                    accessibilityRole="button"
                                    accessibilityState={{selected: item === value}}
                                    onPress={() => {
                                        setOpen(false);
                                        // Picking what's already picked is a no-op, not a re-roll.
                                        if (item !== value) {
                                            onChange(item);
                                        }
                                    }}
                                    style={styles.option}>
                                    <Text color={item === value ? theme.colors.primary : undefined}>{item}</Text>
                                    {item === value ? <Text color={theme.colors.primary}>✓</Text> : null}
                                </Pressable>
                            )}
                        />
                    </Pressable>
                </Pressable>
            </Modal>
        </View>
    );
}

const styles = StyleSheet.create({
    field: {
        rowGap: 4,
        flex: 1,
    },
    box: {
        alignItems: 'center',
        borderWidth: StyleSheet.hairlineWidth,
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingHorizontal: 12,
        paddingVertical: 12,
    },
    backdrop: {
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        flex: 1,
        justifyContent: 'center',
        padding: 24,
    },
    sheet: {
        maxHeight: '70%',
        paddingVertical: 8,
    },
    sheetTitle: {
        paddingHorizontal: 16,
        paddingVertical: 8,
    },
    option: {
        alignItems: 'center',
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingVertical: 14,
    },
});
