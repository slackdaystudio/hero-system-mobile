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
 * The Quick Pick grid: nine character tiles, three across.
 *
 * Presentational only — it renders whatever {@link Slot}s it is handed and reports two intents.
 * **Tap** a tile with a character means "make this the one I'm looking at" (`onActivate`); it never
 * pins, so a borrowed suggestion is not silently promoted just by opening it. **Long-press** any
 * tile — filled or empty — means "curate this slot" (`onEditSlot`), which the host turns into the
 * pick/remove picker.
 *
 * Committed pins carry a small dot so you can tell what you've curated from what the grid borrowed;
 * the active character wears a ring. Suggestions are drawn at full strength — dimming them read as
 * "artificially dark", worst on transparent portraits, and made a fresh (all-suggestion) grid murky.
 */
import React from 'react';
import {Pressable, StyleSheet, View, type ViewStyle} from 'react-native';
import {useTheme} from 'app/theme';
import {PortraitImage} from './PortraitImage';
import {Text} from './Text';
import type {Slot} from './quickPick/slots';

export interface QuickPickGridProps {
    slots: Slot[];
    /** Tap a filled tile: make that character active and open it. */
    onActivate: (id: string) => void;
    /** Long-press any tile: curate that grid position. */
    onEditSlot: (position: number) => void;
}

const initialOf = (name: string): string => (name.trim()[0] ?? '?').toUpperCase();

export function QuickPickGrid({slots, onActivate, onEditSlot}: QuickPickGridProps): React.JSX.Element {
    return (
        <View style={styles.grid}>
            {slots.map((slot) => (
                <QuickPickTile key={slot.position} slot={slot} onActivate={onActivate} onEditSlot={onEditSlot} />
            ))}
        </View>
    );
}

function QuickPickTile({slot, onActivate, onEditSlot}: {slot: Slot; onActivate: (id: string) => void; onEditSlot: (position: number) => void}): React.JSX.Element {
    const theme = useTheme();
    const {character, kind, position} = slot;
    const active = character?.isActive === true;

    const square: ViewStyle = {
        backgroundColor: theme.colors.surfaceAlt,
        borderRadius: theme.radius.md,
        // The ring is the active marker; a matching-width transparent border keeps every tile the
        // same size so activating one doesn't nudge the grid.
        borderWidth: 2,
        borderColor: active ? theme.colors.active : 'transparent',
    };

    const label =
        character !== null
            ? `${character.name}${kind === 'suggested' ? ', recent' : ''}${active ? ', active' : ''}`
            : `Empty slot ${position + 1}, long press to add a character`;

    return (
        <Pressable
            testID={`quickpick-slot-${position}`}
            accessibilityRole="button"
            accessibilityLabel={label}
            // Tap only means something on a filled tile; an empty slot is long-press-to-add.
            onPress={character !== null ? () => onActivate(character.id) : undefined}
            onLongPress={() => onEditSlot(position)}
            style={styles.tile}>
            <View style={[styles.square, square]}>
                {character !== null && character.portraitUri !== null ? (
                    <PortraitImage testID={`quickpick-portrait-${position}`} uri={character.portraitUri} focus={character.portraitFocus} />
                ) : character !== null ? (
                    <Text variant="title" muted>
                        {initialOf(character.name)}
                    </Text>
                ) : (
                    <Text testID={`quickpick-empty-${position}`} variant="title" muted>
                        +
                    </Text>
                )}
                {kind === 'pinned' ? <View testID={`quickpick-pinned-${position}`} style={[styles.dot, {backgroundColor: theme.colors.primary}]} /> : null}
            </View>
            {character !== null ? (
                <Text testID={`quickpick-name-${position}`} variant="caption" numberOfLines={1} style={styles.name}>
                    {character.name}
                </Text>
            ) : (
                <Text variant="caption" muted numberOfLines={1} style={styles.name}>
                    &nbsp;
                </Text>
            )}
            {active ? <View testID={`quickpick-active-${position}`} style={styles.activeMarker} /> : null}
        </Pressable>
    );
}

const styles = StyleSheet.create({
    grid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 12,
    },
    tile: {
        flexBasis: '30%',
        flexGrow: 1,
        rowGap: 4,
    },
    square: {
        aspectRatio: 1,
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
    },
    dot: {
        position: 'absolute',
        top: 5,
        right: 5,
        width: 8,
        height: 8,
        borderRadius: 4,
    },
    name: {
        textAlign: 'center',
    },
    // A zero-size sentinel so tests (and only tests) can assert which tile is active without
    // reaching into style objects; the visible ring is the border above.
    activeMarker: {
        width: 0,
        height: 0,
    },
});
