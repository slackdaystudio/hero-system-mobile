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
import {ActivityIndicator, Alert, FlatList, StyleSheet, type ViewStyle} from 'react-native';
import type {CharacterSummary} from 'core/ports';
import {ListRow, Screen, Text} from 'app/components';
import {useCharacterRepository} from 'app/providers/RepositoriesProvider';
import {useTheme} from 'app/theme';

type LoadState = {status: 'loading'} | {status: 'ready'; characters: CharacterSummary[]} | {status: 'error'; message: string};

export interface CharacterListScreenProps {
    onSelect?: (id: string) => void;
    /** Change this value to force a reload (e.g. after importing a character). */
    refreshToken?: unknown;
}

/**
 * Deleting a character is **irreversible** — it drops the row and its portrait file, and an
 * imported `.hdc` may be the only copy. The confirmation names the character and defaults to
 * Cancel.
 *
 * It carries more weight now than it did: delete began as a long-press, which was safe but
 * undiscoverable. A trash button on every row fixes the discoverability and hands back the
 * fat-finger risk the long-press was avoiding, so this is the only thing standing between a
 * mis-tap and a character that is gone.
 */
const confirmDelete = (name: string, onConfirm: () => void): void =>
    Alert.alert(`Delete ${name}?`, 'This cannot be undone.', [
        {text: 'Cancel', style: 'cancel'},
        {text: 'Delete', style: 'destructive', onPress: onConfirm},
    ]);

/** Reads the character list straight off the repo's lifted columns (no document parse). */
const subtitleFor = (character: CharacterSummary): string => {
    const parts: string[] = [character.edition];
    if (character.player) {
        parts.push(character.player);
    }

    return parts.join(' · ');
};

export function CharacterListScreen({onSelect, refreshToken}: CharacterListScreenProps): React.JSX.Element {
    const repository = useCharacterRepository();
    const theme = useTheme();
    const [state, setState] = useState<LoadState>({status: 'loading'});

    const load = useCallback(async () => {
        try {
            const characters = await repository.list();
            setState({status: 'ready', characters});
        } catch (error) {
            setState({status: 'error', message: error instanceof Error ? error.message : 'Failed to load characters'});
        }
    }, [repository]);

    useEffect(() => {
        load();
    }, [load, refreshToken]);

    const remove = useCallback(
        (character: CharacterSummary) =>
            confirmDelete(character.name, () => {
                repository
                    .delete(character.id)
                    .then(load, (error: unknown) => Alert.alert('Delete failed', error instanceof Error ? error.message : 'That character could not be deleted.'));
            }),
        [repository, load],
    );

    if (state.status === 'loading') {
        return (
            <Screen style={styles.centered}>
                <ActivityIndicator testID="loading" color={theme.colors.primary} />
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

    if (state.characters.length === 0) {
        return (
            <Screen style={styles.centered}>
                <Text variant="subtitle">No characters yet</Text>
                <Text variant="caption" muted>
                    Import a HERO Designer character to get started.
                </Text>
            </Screen>
        );
    }

    const listContent: ViewStyle = {padding: theme.spacing(3), rowGap: theme.spacing(2)};

    return (
        <Screen>
            <FlatList
                data={state.characters}
                keyExtractor={(item) => item.id}
                contentContainerStyle={listContent}
                renderItem={({item}) => (
                    <ListRow
                        testID={`character-${item.id}`}
                        title={item.name}
                        subtitle={subtitleFor(item)}
                        imageUri={item.portraitUri}
                        active={item.isActive}
                        onPress={onSelect === undefined ? undefined : () => onSelect(item.id)}
                        // Both reach the same confirmation. The trash is the discoverable one; the
                        // long-press stays for anyone who already learned it.
                        onLongPress={() => remove(item)}
                        onDelete={() => remove(item)}
                    />
                )}
            />
        </Screen>
    );
}

const styles = StyleSheet.create({
    centered: {
        alignItems: 'center',
        justifyContent: 'center',
        rowGap: 4,
    },
});
