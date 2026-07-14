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
import {Pressable, ScrollView, StyleSheet, type ViewStyle} from 'react-native';
import {useTheme} from 'app/theme';
import {Text} from './Text';

export interface Segment {
    value: string;
    label: string;
}

export interface SegmentedControlProps {
    segments: Segment[];
    value: string;
    onChange: (value: string) => void;
}

/** A horizontal row of mutually-exclusive options; the selected one takes the accent. */
export function SegmentedControl({segments, value, onChange}: SegmentedControlProps): React.JSX.Element {
    const theme = useTheme();

    return (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.row}>
            {segments.map((segment) => {
                const selected = segment.value === value;
                const pill: ViewStyle = {backgroundColor: selected ? theme.colors.primary : theme.colors.surfaceAlt, borderRadius: theme.radius.pill};
                return (
                    <Pressable
                        key={segment.value}
                        testID={`segment-${segment.value}`}
                        accessibilityRole="button"
                        accessibilityState={{selected}}
                        onPress={() => onChange(segment.value)}
                        style={[styles.segment, pill]}>
                        <Text variant="label" color={selected ? theme.colors.onPrimary : theme.colors.textMuted}>
                            {segment.label}
                        </Text>
                    </Pressable>
                );
            })}
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    row: {
        columnGap: 8,
        paddingVertical: 4,
    },
    segment: {
        paddingVertical: 8,
        paddingHorizontal: 14,
    },
});
