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
import {Button, Card, Screen, SegmentedControl, Text, type Segment} from 'app/components';
import {useSettings} from 'app/providers/SettingsProvider';
import {useTheme} from 'app/theme';

const THEME_SEGMENTS: Segment[] = [
    {value: 'system', label: 'System'},
    {value: 'light', label: 'Light'},
    {value: 'dark', label: 'Dark'},
];

const FONT_MIN = 0.8;
const FONT_MAX = 1.7;
const FONT_STEP = 0.1;

const clampScale = (value: number): number => Math.min(FONT_MAX, Math.max(FONT_MIN, Math.round(value * 10) / 10));

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
                    <View style={styles.section}>
                        <View style={styles.heading}>
                            <Text variant="label">Text size</Text>
                            <Text variant="caption" muted>
                                Scales all text throughout the app.
                            </Text>
                        </View>
                        <View style={styles.stepperRow}>
                            <View style={styles.stepperButton}>
                                <Button
                                    testID="font-decrease"
                                    label="A−"
                                    variant="secondary"
                                    disabled={settings.fontScale <= FONT_MIN}
                                    onPress={() => update('fontScale', clampScale(settings.fontScale - FONT_STEP))}
                                />
                            </View>
                            <Text testID="font-scale" variant="subtitle">
                                {`${Math.round(settings.fontScale * 100)}%`}
                            </Text>
                            <View style={styles.stepperButton}>
                                <Button
                                    testID="font-increase"
                                    label="A+"
                                    variant="secondary"
                                    disabled={settings.fontScale >= FONT_MAX}
                                    onPress={() => update('fontScale', clampScale(settings.fontScale + FONT_STEP))}
                                />
                            </View>
                        </View>
                        <Text style={styles.preview}>The quick brown fox rolled 3d6.</Text>
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
    stepperRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        columnGap: 16,
    },
    stepperButton: {
        minWidth: 72,
    },
    preview: {
        paddingTop: 4,
    },
});
