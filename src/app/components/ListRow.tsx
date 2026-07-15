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
import {Pressable, StyleSheet, View, type ViewStyle} from 'react-native';
import type {PortraitFocus} from 'core/ports';
import {useTheme} from 'app/theme';
import {TrashIcon} from './icons';
import {PortraitImage} from './PortraitImage';
import {Text} from './Text';

export interface ListRowProps {
    title: string;
    subtitle?: string | null;
    /** Portrait `file://` uri; falls back to the title's initial when absent. */
    imageUri?: string | null;
    /** Which part of the portrait to show; null/absent is the centre crop. */
    imageFocus?: PortraitFocus | null;
    active?: boolean;
    onPress?: () => void;
    /** Long-press action. Used for destructive actions, which should confirm before acting. */
    onLongPress?: () => void;
    /**
     * Shows a trash button at the trailing edge. Destructive, so it must confirm before acting —
     * a visible control is easier to hit by accident than the long-press it supplements.
     */
    onDelete?: () => void;
    /** Names the target for screen readers: "Delete Defensor", not a bare "Delete". */
    deleteLabel?: string;
    testID?: string;
}

const initialOf = (title: string): string => (title.trim()[0] ?? '?').toUpperCase();

/** A tappable list row: leading portrait/initial, title + subtitle, active badge, trailing delete. */
export function ListRow({title, subtitle, imageUri, imageFocus, active = false, onPress, onLongPress, onDelete, deleteLabel, testID}: ListRowProps): React.JSX.Element {
    const theme = useTheme();

    const container: ViewStyle = {
        borderColor: theme.colors.border,
        borderRadius: theme.radius.md,
        padding: theme.spacing(3),
        columnGap: theme.spacing(3),
    };
    const avatar: ViewStyle = {backgroundColor: theme.colors.surfaceAlt, borderRadius: theme.radius.sm};
    const badge: ViewStyle = {backgroundColor: theme.colors.active, borderRadius: theme.radius.pill};

    return (
        <Pressable
            testID={testID}
            accessibilityRole="button"
            disabled={onPress === undefined && onLongPress === undefined}
            onPress={onPress}
            onLongPress={onLongPress}
            style={({pressed}) => [styles.row, container, {backgroundColor: pressed ? theme.colors.surfaceAlt : theme.colors.surface}]}>
            <View style={[styles.avatar, avatar]}>
                {imageUri ? (
                    <PortraitImage testID="portrait" uri={imageUri} focus={imageFocus} size={AVATAR_SIZE} />
                ) : (
                    <Text variant="subtitle" muted>
                        {initialOf(title)}
                    </Text>
                )}
            </View>
            <View style={styles.body}>
                <Text variant="subtitle" numberOfLines={1}>
                    {title}
                </Text>
                {subtitle ? (
                    <Text variant="caption" muted numberOfLines={1}>
                        {subtitle}
                    </Text>
                ) : null}
            </View>
            {active ? (
                <View testID="active-badge" style={[styles.badge, badge]}>
                    <Text variant="caption" color={theme.colors.onPrimary}>
                        Active
                    </Text>
                </View>
            ) : null}
            {onDelete !== undefined ? (
                <Pressable
                    testID={testID !== undefined ? `${testID}-delete` : 'delete'}
                    accessibilityRole="button"
                    accessibilityLabel={deleteLabel ?? `Delete ${title}`}
                    // A nested Pressable consumes the touch, so this never also opens the row.
                    onPress={onDelete}
                    // The icon is small; the target must not be. Padding takes it to ~44pt without
                    // widening the trash itself, and it sits at the trailing edge, away from where
                    // a thumb lands to open the row.
                    hitSlop={8}
                    style={({pressed}) => [styles.delete, {opacity: pressed ? 0.5 : 1}]}>
                    <TrashIcon color={theme.colors.danger} />
                </Pressable>
            ) : null}
        </Pressable>
    );
}

const AVATAR_SIZE = 44;

const styles = StyleSheet.create({
    row: {
        flexDirection: 'row',
        alignItems: 'center',
        borderWidth: StyleSheet.hairlineWidth,
    },
    avatar: {
        width: AVATAR_SIZE,
        height: AVATAR_SIZE,
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
    },
    body: {
        flex: 1,
    },
    delete: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 12,
        paddingVertical: 13,
    },
    badge: {
        paddingHorizontal: 8,
        paddingVertical: 2,
    },
});
