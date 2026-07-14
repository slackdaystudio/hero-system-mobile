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
import {StyleSheet, Switch, View} from 'react-native';
import type {ColorScheme} from 'core/ports';
import {Card, Screen, SegmentedControl, Text, type Segment} from 'app/components';
import {useSettings} from 'app/providers/SettingsProvider';
import {useTheme} from 'app/theme';

const THEME_SEGMENTS: Segment[] = [
    {value: 'system', label: 'System'},
    {value: 'light', label: 'Light'},
    {value: 'dark', label: 'Dark'},
];

export function SettingsScreen(): React.JSX.Element {
    const {settings, update} = useSettings();
    const theme = useTheme();

    return (
        <Screen>
            <View style={styles.container}>
                <Card>
                    <View style={styles.section}>
                        <View style={styles.heading}>
                            <Text variant="label">Appearance</Text>
                            <Text variant="caption" muted>
                                {'System follows your device’s light/dark setting.'}
                            </Text>
                        </View>
                        <SegmentedControl
                            segments={THEME_SEGMENTS}
                            value={settings.colorScheme}
                            onChange={(value) => update('colorScheme', value as ColorScheme)}
                        />
                    </View>
                </Card>

                <Card>
                    <View style={styles.toggleRow}>
                        <View style={styles.heading}>
                            <Text variant="label">Screen animations</Text>
                            <Text variant="caption" muted>
                                Turn off to remove screen transitions.
                            </Text>
                        </View>
                        <Switch
                            testID="toggle-animations"
                            value={settings.showAnimations}
                            onValueChange={(value) => update('showAnimations', value)}
                            trackColor={{false: theme.colors.surfaceAlt, true: theme.colors.primary}}
                            thumbColor={theme.colors.onPrimary}
                            ios_backgroundColor={theme.colors.surfaceAlt}
                        />
                    </View>
                </Card>
            </View>
        </Screen>
    );
}

const styles = StyleSheet.create({
    container: {
        padding: 16,
        rowGap: 16,
    },
    section: {
        rowGap: 12,
    },
    heading: {
        flex: 1,
        rowGap: 4,
    },
    toggleRow: {
        flexDirection: 'row',
        alignItems: 'center',
        columnGap: 16,
    },
});
