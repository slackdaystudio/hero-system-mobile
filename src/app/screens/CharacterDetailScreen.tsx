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

import React, {useCallback, useEffect, useRef, useState} from 'react';
import {ActivityIndicator, Image, ScrollView, StyleSheet, View, type ViewStyle} from 'react-native';
import type {Character} from 'core/ports';
import {Card, Screen, Text} from 'app/components';
import {useCharacterRepository} from 'app/providers/RepositoriesProvider';
import {useTheme} from 'app/theme';

type LoadState = {status: 'loading'} | {status: 'ready'; character: Character} | {status: 'not-found'} | {status: 'error'; message: string};

export interface CharacterDetailScreenProps {
    characterId: string;
    /** Fired once the character loads — the navigator uses it to set the header title. */
    onReady?: (character: Character) => void;
}

const asObjects = (value: unknown): Array<Record<string, unknown>> =>
    Array.isArray(value) ? value.filter((entry): entry is Record<string, unknown> => typeof entry === 'object' && entry !== null) : [];

const firstString = (item: Record<string, unknown>, keys: string[]): string => {
    for (const key of keys) {
        const value = item[key];
        if (typeof value === 'string' && value.length > 0) {
            return value;
        }
    }
    return '—';
};

const AVATAR = 96;

export function CharacterDetailScreen({characterId, onReady}: CharacterDetailScreenProps): React.JSX.Element {
    const repository = useCharacterRepository();
    const theme = useTheme();
    const [state, setState] = useState<LoadState>({status: 'loading'});

    // Keep the latest onReady without making `load` depend on its identity (the
    // navigator passes a fresh closure each render).
    const onReadyRef = useRef(onReady);
    onReadyRef.current = onReady;

    const load = useCallback(async () => {
        try {
            const character = await repository.get(characterId);
            if (character === null) {
                setState({status: 'not-found'});
                return;
            }
            setState({status: 'ready', character});
            onReadyRef.current?.(character);
        } catch (error) {
            setState({status: 'error', message: error instanceof Error ? error.message : 'Failed to load character'});
        }
    }, [repository, characterId]);

    useEffect(() => {
        load();
    }, [load]);

    if (state.status === 'loading') {
        return (
            <Screen style={styles.centered}>
                <ActivityIndicator testID="loading" color={theme.colors.primary} />
            </Screen>
        );
    }

    if (state.status === 'not-found') {
        return (
            <Screen style={styles.centered}>
                <Text variant="subtitle">Character not found</Text>
            </Screen>
        );
    }

    if (state.status === 'error') {
        return (
            <Screen style={styles.centered}>
                <Text muted>{state.message}</Text>
            </Screen>
        );
    }

    const {character} = state;
    const powers = asObjects(character.document.powers);
    const characteristics = asObjects(character.document.characteristics);

    const avatarStyle: ViewStyle = {backgroundColor: theme.colors.surfaceAlt, borderRadius: theme.radius.md};
    const content: ViewStyle = {padding: theme.spacing(4), rowGap: theme.spacing(4)};

    return (
        <Screen>
            <ScrollView contentContainerStyle={content}>
                <View style={styles.header}>
                    <View style={[styles.avatar, avatarStyle]}>
                        {character.portraitUri ? (
                            <Image testID="portrait" source={{uri: character.portraitUri}} style={styles.avatarImage} />
                        ) : (
                            <Text variant="title" muted>
                                {(character.name.trim()[0] ?? '?').toUpperCase()}
                            </Text>
                        )}
                    </View>
                    <View style={styles.headerText}>
                        <Text variant="title">{character.name}</Text>
                        <Text variant="caption" muted>
                            {character.player ? `${character.edition} · ${character.player}` : character.edition}
                        </Text>
                        {character.isActive ? (
                            <Text variant="caption" color={theme.colors.active}>
                                Active
                            </Text>
                        ) : null}
                    </View>
                </View>

                <Section title="Details">
                    <Row label="Edition" value={character.edition} />
                    <Row label="Slot" value={character.slot === null ? 'Unassigned' : `Slot ${character.slot + 1}`} />
                    <Row label="File" value={character.filename ?? '—'} />
                </Section>

                {characteristics.length > 0 ? (
                    <Section title="Characteristics">
                        {characteristics.map((item, index) => (
                            <Row key={index} label={firstString(item, ['name', 'xmlid'])} value={typeof item.value === 'number' ? String(item.value) : firstString(item, ['value'])} />
                        ))}
                    </Section>
                ) : null}

                {powers.length > 0 ? (
                    <Section title="Powers">
                        {powers.map((item, index) => (
                            <Text key={index}>{firstString(item, ['name', 'alias', 'xmlid'])}</Text>
                        ))}
                    </Section>
                ) : null}
            </ScrollView>
        </Screen>
    );
}

function Section({title, children}: {title: string; children: React.ReactNode}): React.JSX.Element {
    return (
        <View style={styles.section}>
            <Text variant="label" muted>
                {title.toUpperCase()}
            </Text>
            <Card>{children}</Card>
        </View>
    );
}

function Row({label, value}: {label: string; value: string}): React.JSX.Element {
    return (
        <View style={styles.row}>
            <Text muted>{label}</Text>
            <Text>{value}</Text>
        </View>
    );
}

const styles = StyleSheet.create({
    centered: {
        alignItems: 'center',
        justifyContent: 'center',
    },
    header: {
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
    headerText: {
        flex: 1,
        rowGap: 2,
    },
    section: {
        rowGap: 6,
    },
    row: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingVertical: 4,
    },
});
