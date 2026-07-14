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
import type {Character} from 'core/ports';
import {Card, Screen, Text} from 'app/components';
import type {RollRequest} from 'app/dice/rollRequest';
import {useRepositories} from 'app/providers/RepositoriesProvider';
import {useTheme} from 'app/theme';

type DiceMode = RollRequest['mode'];

export interface HomeScreenProps {
    onOpenCharacters: () => void;
    onOpenActiveCharacter: (id: string) => void;
    onOpenDice: (mode?: DiceMode) => void;
    onOpenStatistics: () => void;
    onOpenSettings: () => void;
}

const DICE_TILES: Array<{label: string; mode: DiceMode}> = [
    {label: 'Skill 3d6', mode: 'skill'},
    {label: 'To Hit', mode: 'hit'},
    {label: 'Damage', mode: 'normal'},
    {label: 'Effect', mode: 'effect'},
];

const AVATAR = 56;

/**
 * The landing hub: a quick view of the active character plus tiles into the
 * library, the dice rollers, and the game tools. Screen stays props-driven — the
 * navigator wires each callback — and loads the active character through the
 * repository port.
 */
export function HomeScreen({onOpenCharacters, onOpenActiveCharacter, onOpenDice, onOpenStatistics, onOpenSettings}: HomeScreenProps): React.JSX.Element {
    const {characters} = useRepositories();
    const [active, setActive] = useState<Character | null | undefined>(undefined);

    const load = useCallback(async () => {
        try {
            setActive(await characters.getActive());
        } catch {
            setActive(null);
        }
    }, [characters]);

    useEffect(() => {
        load();
    }, [load]);

    return (
        <Screen>
            <ScrollView contentContainerStyle={styles.content}>
                <Section title="Active Character">
                    <ActiveCharacterCard active={active} onOpen={onOpenActiveCharacter} />
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

function ActiveCharacterCard({active, onOpen}: {active: Character | null | undefined; onOpen: (id: string) => void}): React.JSX.Element {
    const theme = useTheme();

    if (active === undefined) {
        return (
            <Card>
                <Text muted>Loading…</Text>
            </Card>
        );
    }

    if (active === null) {
        return (
            <Card>
                <Text>No active character</Text>
                <Text variant="caption" muted>
                    Open a character from the library to make it active.
                </Text>
            </Card>
        );
    }

    const avatarStyle: ViewStyle = {backgroundColor: theme.colors.surfaceAlt, borderRadius: theme.radius.md};

    return (
        <Pressable testID="active-character" accessibilityRole="button" onPress={() => onOpen(active.id)}>
            <Card>
                <View style={styles.activeRow}>
                    <View style={[styles.avatar, avatarStyle]}>
                        {active.portraitUri ? (
                            <Image testID="active-portrait" source={{uri: active.portraitUri}} style={styles.avatarImage} />
                        ) : (
                            <Text variant="title" muted>
                                {(active.name.trim()[0] ?? '?').toUpperCase()}
                            </Text>
                        )}
                    </View>
                    <View style={styles.activeText}>
                        <Text variant="subtitle">{active.name}</Text>
                        <Text variant="caption" muted>
                            {active.player ? `${active.edition} · ${active.player}` : active.edition}
                        </Text>
                    </View>
                </View>
            </Card>
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
    activeRow: {
        flexDirection: 'row',
        alignItems: 'center',
        columnGap: 16,
    },
    avatar: {
        width: AVATAR,
        height: AVATAR,
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
    },
    avatarImage: {
        width: AVATAR,
        height: AVATAR,
    },
    activeText: {
        flex: 1,
        rowGap: 2,
    },
});
