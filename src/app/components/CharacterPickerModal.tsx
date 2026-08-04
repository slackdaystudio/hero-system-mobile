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

/**
 * The Quick Pick curate sheet: what a long-press on a slot opens.
 *
 * Lists the characters available to pin — the caller passes candidates already stripped of anything
 * pinned elsewhere, since a character lives in one slot only. When the slot already holds a pin,
 * `canRemove` adds an "empty this slot" action at the top, so one gesture covers both replace and
 * remove.
 */
import React from 'react';
import {Modal, Pressable, ScrollView, StyleSheet, type ViewStyle} from 'react-native';
import type {CharacterSummary} from 'core/ports';
import {useTheme} from 'app/theme';
import {Button} from './Button';
import {ListRow} from './ListRow';
import {Text} from './Text';

export interface CharacterPickerModalProps {
    visible: boolean;
    /** Characters that may be pinned here — already filtered to those not pinned elsewhere. */
    characters: CharacterSummary[];
    /** The slot already holds a pin, so offer to clear it. */
    canRemove: boolean;
    onPick: (id: string) => void;
    onRemove: () => void;
    onClose: () => void;
}

const subtitleOf = (character: CharacterSummary): string => [character.edition, character.player].filter(Boolean).join(' · ');

export function CharacterPickerModal({visible, characters, canRemove, onPick, onRemove, onClose}: CharacterPickerModalProps): React.JSX.Element {
    const theme = useTheme();
    const card: ViewStyle = {backgroundColor: theme.colors.surface, borderRadius: theme.radius.lg};

    return (
        <Modal transparent visible={visible} animationType="fade" onRequestClose={onClose}>
            {/* accessible={false}: an accessible Pressable collapses its subtree on iOS, hiding the
                dialog content from VoiceOver/automation. Touch (dismiss/swallow) is unaffected. */}
            <Pressable testID="picker-backdrop" style={styles.backdrop} onPress={onClose} accessible={false}>
                <Pressable style={[styles.card, card]} onPress={() => undefined} accessible={false}>
                    <Text variant="subtitle">{canRemove ? 'Replace or remove' : 'Pin a character'}</Text>

                    {canRemove ? <Button testID="picker-remove" label="Remove from slot" variant="secondary" onPress={onRemove} /> : null}

                    {characters.length === 0 ? (
                        <Text variant="caption" muted>
                            No other characters to pin.
                        </Text>
                    ) : (
                        <ScrollView style={styles.list} contentContainerStyle={styles.listContent}>
                            {characters.map((character) => (
                                <ListRow
                                    key={character.id}
                                    testID={`picker-row-${character.id}`}
                                    title={character.name}
                                    subtitle={subtitleOf(character)}
                                    imageUri={character.portraitUri}
                                    imageFocus={character.portraitFocus}
                                    active={character.isActive}
                                    onPress={() => onPick(character.id)}
                                />
                            ))}
                        </ScrollView>
                    )}
                </Pressable>
            </Pressable>
        </Modal>
    );
}

const styles = StyleSheet.create({
    backdrop: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        padding: 24,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
    },
    card: {
        width: '100%',
        maxWidth: 380,
        padding: 20,
        rowGap: 12,
    },
    list: {
        // Keep the sheet from swallowing the screen when the library is large; the rest scrolls.
        maxHeight: 360,
    },
    listContent: {
        rowGap: 8,
    },
});
