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

import React, {useCallback, useEffect, useState} from 'react';
import {Image, Pressable, ScrollView, StyleSheet, View, type ViewStyle} from 'react-native';
import type {CharacterSummary} from 'core/ports';
import {Card, Screen, Text} from 'app/components';
import type {RollRequest} from 'app/dice/rollRequest';
import {useRepositories} from 'app/providers/RepositoriesProvider';
import {useTheme} from 'app/theme';

type DiceMode = RollRequest['mode'];

/** How many recent characters the Home dashboard shows. */
const RECENT_LIMIT = 4;

export interface HomeScreenProps {
    onOpenCharacters: () => void;
    onOpenCharacter: (id: string) => void;
    onOpenDice: (mode?: DiceMode) => void;
    onOpenStatistics: () => void;
    onOpenSettings: () => void;
    /**
     * Change this value to force a reload. "Recent" is ordered by `accessed_at`, which opening a
     * character updates, so the list goes stale the moment you leave — and Home sits at the root of
     * the stack and never unmounts, so mounting alone can't reload it. The navigator bumps this on
     * focus; knowing *when* that is stays a navigator concern.
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
    const {characters} = useRepositories();
    const [recent, setRecent] = useState<CharacterSummary[] | undefined>(undefined);

    const load = useCallback(async () => {
        try {
            setRecent(await characters.recent(RECENT_LIMIT));
        } catch {
            setRecent([]);
        }
    }, [characters]);

    useEffect(() => {
        load();
    }, [load, refreshToken]);

    return (
        <Screen>
            <ScrollView contentContainerStyle={styles.content}>
                <Section title="Recent">
                    <RecentCharacters characters={recent} onOpen={onOpenCharacter} />
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

function RecentCharacters({characters, onOpen}: {characters: CharacterSummary[] | undefined; onOpen: (id: string) => void}): React.JSX.Element {
    if (characters === undefined) {
        return (
            <Card>
                <Text muted>Loading…</Text>
            </Card>
        );
    }

    if (characters.length === 0) {
        return (
            <Card>
                <Text>No characters yet</Text>
                <Text variant="caption" muted>
                    Import a character to get started.
                </Text>
            </Card>
        );
    }

    return (
        <View style={styles.recentRow}>
            {characters.map((character) => (
                <RecentCard key={character.id} character={character} onOpen={onOpen} />
            ))}
        </View>
    );
}

function RecentCard({character, onOpen}: {character: CharacterSummary; onOpen: (id: string) => void}): React.JSX.Element {
    const theme = useTheme();
    const square: ViewStyle = {backgroundColor: theme.colors.surfaceAlt, borderRadius: theme.radius.md};

    return (
        <Pressable testID={`recent-${character.id}`} accessibilityRole="button" onPress={() => onOpen(character.id)} style={styles.recentCard}>
            <View style={[styles.recentSquare, square]}>
                {character.portraitUri ? (
                    <Image testID={`recent-portrait-${character.id}`} source={{uri: character.portraitUri}} style={styles.recentImage} />
                ) : (
                    <Text variant="title" muted>
                        {(character.name.trim()[0] ?? '?').toUpperCase()}
                    </Text>
                )}
            </View>
            <Text variant="caption" numberOfLines={1} style={styles.recentName}>
                {character.name}
            </Text>
        </Pressable>
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
    recentRow: {
        flexDirection: 'row',
        columnGap: 10,
    },
    recentCard: {
        flex: 1,
        maxWidth: 96,
        rowGap: 4,
    },
    recentSquare: {
        aspectRatio: 1,
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
    },
    recentImage: {
        width: '100%',
        height: '100%',
    },
    recentName: {
        textAlign: 'center',
    },
});
