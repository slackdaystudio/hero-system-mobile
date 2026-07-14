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
import {StyleSheet, View} from 'react-native';
import type {ColorScheme} from 'core/ports';
import {Card, Screen, SegmentedControl, Text, type Segment} from 'app/components';
import {useSettings} from 'app/providers/SettingsProvider';

const THEME_SEGMENTS: Segment[] = [
    {value: 'system', label: 'System'},
    {value: 'light', label: 'Light'},
    {value: 'dark', label: 'Dark'},
];

export function SettingsScreen(): React.JSX.Element {
    const {settings, update} = useSettings();

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
        rowGap: 4,
    },
});
