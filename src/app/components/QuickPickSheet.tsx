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
 * Quick Pick as a pull-up: the always-there switcher on the character sheet.
 *
 * A persistent handle sits at the bottom of the screen — the modern take on the legacy app's
 * bottom-of-screen character switcher. Tapping it slides the same {@link QuickPick} grid up over a
 * dimmed backdrop. The host must pad its scroll content by {@link QUICK_PICK_HANDLE_SPACE} so nothing
 * hides behind the handle.
 *
 * The slide is a plain `Animated` translate — no `PanResponder`, no gesture library. Drag-to-dismiss
 * is deliberately out of scope: gestures here have shipped broken twice (see CLAUDE.md), and a
 * tap-to-open/tap-to-dismiss sheet needs none of that surface. Reduce-motion (`showAnimations`)
 * snaps instead of sliding.
 */
import React, {useCallback, useEffect, useRef, useState} from 'react';
import {Animated, Modal, Pressable, StyleSheet, View, type ViewStyle} from 'react-native';
import {useSettings} from 'app/providers/SettingsProvider';
import {useTheme} from 'app/theme';
import {QuickPick} from './QuickPick';
import {Text} from './Text';

/** Bottom padding a host's scroll content needs so the last row clears the persistent handle. */
export const QUICK_PICK_HANDLE_SPACE = 64;

/** How far below the screen the panel starts — comfortably taller than the panel itself. */
const PANEL_OFFSET = 600;

export interface QuickPickSheetProps {
    /** Open a chosen character. On the sheet this replaces the current one (no back-stack growth). */
    onActivate: (id: string) => void;
    /** Bump to reload when the sheet's host regains focus. */
    refreshToken?: unknown;
}

export function QuickPickSheet({onActivate, refreshToken}: QuickPickSheetProps): React.JSX.Element {
    const theme = useTheme();
    const {settings} = useSettings();
    const [open, setOpen] = useState(false);
    const translateY = useRef(new Animated.Value(PANEL_OFFSET)).current;

    const slideTo = useCallback(
        (to: number, done?: () => void) => {
            if (!settings.showAnimations) {
                translateY.setValue(to);
                done?.();
                return;
            }
            Animated.timing(translateY, {toValue: to, duration: 220, useNativeDriver: true}).start(({finished}) => {
                if (finished) {
                    done?.();
                }
            });
        },
        [settings.showAnimations, translateY],
    );

    // Mounting the modal (open) slides the panel up from below.
    useEffect(() => {
        if (open) {
            translateY.setValue(PANEL_OFFSET);
            slideTo(0);
        }
    }, [open, slideTo, translateY]);

    const close = useCallback(() => slideTo(PANEL_OFFSET, () => setOpen(false)), [slideTo]);

    const handle: ViewStyle = {backgroundColor: theme.colors.surface, borderColor: theme.colors.border, borderRadius: theme.radius.pill};
    const panel: ViewStyle = {backgroundColor: theme.colors.background, borderTopLeftRadius: theme.radius.lg, borderTopRightRadius: theme.radius.lg};
    const grabber: ViewStyle = {backgroundColor: theme.colors.border};

    return (
        <>
            {/* box-none: only the handle takes touches; the rest of this overlay passes them through
                to the scroll view beneath. */}
            <View style={styles.handleWrap} pointerEvents="box-none">
                <Pressable testID="quickpick-handle" accessibilityRole="button" accessibilityLabel="Switch character" onPress={() => setOpen(true)} style={[styles.handle, handle]}>
                    <Text variant="label" color={theme.colors.primary}>
                        Switch character ▲
                    </Text>
                </Pressable>
            </View>

            <Modal transparent visible={open} animationType="none" onRequestClose={close}>
                {/* accessible={false}: an accessible Pressable collapses its subtree on iOS, hiding
                    the sheet content from VoiceOver/automation. Touch (dismiss/swallow) is unaffected. */}
                <Pressable testID="quickpick-sheet-backdrop" style={styles.backdrop} onPress={close} accessible={false}>
                    <Animated.View style={[styles.panel, panel, {transform: [{translateY}]}]}>
                        <Pressable onPress={() => undefined} accessible={false} style={styles.panelInner}>
                            <View style={[styles.grabber, grabber]} />
                            <Text variant="label" muted>
                                SWITCH CHARACTER
                            </Text>
                            <QuickPick onActivate={onActivate} refreshToken={refreshToken} />
                        </Pressable>
                    </Animated.View>
                </Pressable>
            </Modal>
        </>
    );
}

const styles = StyleSheet.create({
    handleWrap: {
        position: 'absolute',
        left: 0,
        right: 0,
        bottom: 0,
        alignItems: 'center',
        paddingVertical: 10,
    },
    handle: {
        paddingHorizontal: 20,
        paddingVertical: 8,
        borderWidth: StyleSheet.hairlineWidth,
    },
    backdrop: {
        flex: 1,
        justifyContent: 'flex-end',
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
    },
    panel: {
        paddingBottom: 24,
    },
    panelInner: {
        padding: 16,
        rowGap: 12,
    },
    grabber: {
        alignSelf: 'center',
        width: 40,
        height: 4,
        borderRadius: 2,
        marginBottom: 4,
    },
});
