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
import {Pressable, ScrollView, StyleSheet, View, type ViewStyle} from 'react-native';
import {QuickPick, Screen, Text} from 'app/components';
import type {RollRequest} from 'app/dice/rollRequest';
import {useTheme} from 'app/theme';

type DiceMode = RollRequest['mode'];

export interface HomeScreenProps {
    onOpenCharacters: () => void;
    onOpenCharacter: (id: string) => void;
    onOpenDice: (mode?: DiceMode) => void;
    onOpenStatistics: () => void;
    onOpenSettings: () => void;
    /**
     * Change this value to force a reload. The Quick Pick grid fills empty slots from the recent
     * list, which is ordered by `accessed_at` and goes stale the moment you open a character — and
     * Home sits at the root of the stack and never unmounts, so mounting alone can't reload it. The
     * navigator bumps this on focus; knowing *when* that is stays a navigator concern.
     */
    refreshToken?: unknown;
}

const DICE_TILES: Array<{label: string; mode: DiceMode}> = [
    {label: 'Skill 3d6', mode: 'skill'},
    {label: 'To Hit', mode: 'hit'},
    {label: 'Damage', mode: 'normal'},
    {label: 'Effect', mode: 'effect'},
];

/**
 * The landing hub: recently opened characters plus tiles into the library, the
 * dice rollers, and the game tools. Screen stays props-driven — the navigator
 * wires each callback — and reads the recent list through the repository port.
 */
export function HomeScreen({onOpenCharacters, onOpenCharacter, onOpenDice, onOpenStatistics, onOpenSettings, refreshToken}: HomeScreenProps): React.JSX.Element {
    return (
        <Screen>
            <ScrollView contentContainerStyle={styles.content}>
                <Section title="Quick Pick">
                    <QuickPick onActivate={onOpenCharacter} refreshToken={refreshToken} />
                </Section>

                <Section title="Library">
                    <View style={styles.grid}>
                        <Tile label="All Characters" onPress={onOpenCharacters} />
                    </View>
                </Section>

                <Section title="Dice Rollers">
                    <View style={styles.grid}>
                        {DICE_TILES.map((tile) => (
                            <Tile key={tile.mode} label={tile.label} onPress={() => onOpenDice(tile.mode)} />
                        ))}
                    </View>
                </Section>

                <Section title="Game">
                    <View style={styles.grid}>
                        <Tile label="Statistics" onPress={onOpenStatistics} />
                        <Tile label="Settings" onPress={onOpenSettings} />
                    </View>
                </Section>
            </ScrollView>
        </Screen>
    );
}

function Tile({label, onPress}: {label: string; onPress: () => void}): React.JSX.Element {
    const theme = useTheme();
    const tile: ViewStyle = {backgroundColor: theme.colors.surfaceAlt, borderRadius: theme.radius.md};

    return (
        <Pressable
            testID={`tile-${label}`}
            accessibilityRole="button"
            onPress={onPress}
            style={({pressed}) => [styles.tile, tile, {opacity: pressed ? 0.85 : 1}]}>
            <Text variant="label">{label}</Text>
        </Pressable>
    );
}

function Section({title, children}: {title: string; children: React.ReactNode}): React.JSX.Element {
    return (
        <View style={styles.section}>
            <Text variant="label" muted>
                {title.toUpperCase()}
            </Text>
            {children}
        </View>
    );
}

const styles = StyleSheet.create({
    content: {
        padding: 16,
        rowGap: 20,
    },
    section: {
        rowGap: 8,
    },
    grid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 12,
    },
    tile: {
        flexGrow: 1,
        flexBasis: '46%',
        minHeight: 64,
        alignItems: 'center',
        justifyContent: 'center',
        padding: 16,
    },
});
