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
import {Pressable, StyleSheet, View, type ViewStyle} from 'react-native';
import {Text} from './Text';
import {useTheme} from 'app/theme';

export interface ToggleItem {
    /** Stable identity — the adder's xmlid. */
    readonly key: string;
    readonly label: string;
    /** What taking it costs. Shown on the chip, signed, and omitted when it is free. */
    readonly cost: number;
    readonly selected: boolean;
}

export interface ToggleListProps {
    label: string;
    items: readonly ToggleItem[];
    onToggle: (key: string, selected: boolean) => void;
    /** Shown under the label — what the whole group is for, or what it currently comes to. */
    hint?: string;
    testID?: string;
}

/**
 * Any-number-of-many: a wrapped row of chips, each on or off.
 *
 * The shape neither {@link SelectField} nor {@link SegmentedControl} covers. A pick-one is a
 * SelectField and two-or-three exclusive choices are a SegmentedControl, but a Weapon Familiarity
 * is *fourteen independent yes/no purchases* — and their absence is what made a whole class of
 * trait unbuildable: the trait form rendered an adder with no options as nothing at all, so
 * Damage Negation could not satisfy its own required adders and no attack could buy a half-die.
 *
 * Chips rather than a list of rows because these run long — Fringe Benefit has 43 — and a wrapping
 * flow shows far more of them per screen than one row each. Each chip carries its own price,
 * because with this many independent purchases "what did that cost me" is otherwise a subtraction
 * the player has to do against the meter.
 */
export function ToggleList({label, items, onToggle, hint, testID}: ToggleListProps): React.JSX.Element {
    const theme = useTheme();

    return (
        <View style={styles.field} testID={testID}>
            <Text variant="caption" muted>
                {label}
            </Text>

            <View style={styles.chips}>
                {items.map((item) => {
                    const chip: ViewStyle = {
                        backgroundColor: item.selected ? theme.colors.primary : theme.colors.surface,
                        borderColor: item.selected ? theme.colors.primary : theme.colors.border,
                        borderRadius: theme.radius.pill,
                    };

                    return (
                        <Pressable
                            key={item.key}
                            testID={testID === undefined ? undefined : `${testID}-${item.key}`}
                            accessibilityRole="checkbox"
                            accessibilityState={{checked: item.selected}}
                            accessibilityLabel={item.cost === 0 ? item.label : `${item.label}, ${item.cost} points`}
                            onPress={() => onToggle(item.key, !item.selected)}
                            style={[styles.chip, chip]}>
                            <Text color={item.selected ? theme.colors.onPrimary : undefined}>{item.label}</Text>
                            {/* A free adder shows no price rather than a "+0" nobody needs to read. */}
                            {item.cost === 0 ? null : (
                                <Text variant="caption" color={item.selected ? theme.colors.onPrimary : theme.colors.textMuted}>
                                    {item.cost > 0 ? `+${item.cost}` : String(item.cost)}
                                </Text>
                            )}
                        </Pressable>
                    );
                })}
            </View>

            {hint === undefined ? null : (
                <Text variant="caption" muted>
                    {hint}
                </Text>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    field: {
        rowGap: 6,
    },
    chips: {
        columnGap: 8,
        flexDirection: 'row',
        flexWrap: 'wrap',
        rowGap: 8,
    },
    chip: {
        alignItems: 'center',
        borderWidth: StyleSheet.hairlineWidth,
        columnGap: 6,
        flexDirection: 'row',
        paddingHorizontal: 12,
        paddingVertical: 8,
    },
});
