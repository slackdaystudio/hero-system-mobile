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
 * Choose which part of a portrait the square shows.
 *
 * The preview *is* the crop — the same {@link PortraitImage} the list and the sheet draw, just
 * bigger — so what you drag is what you get, rather than a representation of it.
 *
 * Non-destructive: this stores two numbers and never touches the image bytes, so Reset always gets
 * the original framing back and nothing can be lost by fiddling.
 *
 * The drag itself is wiring; the maths lives in `components/portraitFocus` where it can be tested.
 * A pan gesture can't be exercised by react-test-renderer, so the thin part is the untested part.
 */
import React, {useMemo, useRef, useState} from 'react';
import {Modal, PanResponder, Pressable, StyleSheet, View, type ViewStyle} from 'react-native';
import {CENTERED_PORTRAIT, type PortraitFocus} from 'core/ports';
import {Button, PortraitImage, Text} from 'app/components';
import {croppedAxis, focusAfterDrag} from 'app/components/portraitFocus';
import {useTheme} from 'app/theme';

const PREVIEW = 260;

export interface PortraitFramerProps {
    uri: string;
    /** Where it's framed now; null reads as centred. */
    focus: PortraitFocus | null;
    aspect: number | undefined;
    visible: boolean;
    onCancel: () => void;
    /** null = reset to centred (stored as "never framed"). */
    onSave: (focus: PortraitFocus | null) => void;
}

export function PortraitFramer({uri, focus, aspect, visible, onCancel, onSave}: PortraitFramerProps): React.JSX.Element {
    const theme = useTheme();
    const [draft, setDraft] = useState<PortraitFocus>(focus ?? CENTERED_PORTRAIT);

    // The focus the gesture started from. Deltas are cumulative from the touch down, so applying
    // them to a moving `draft` would accelerate the image away from the finger.
    const start = useRef<PortraitFocus>(draft);
    const axis = aspect === undefined ? null : croppedAxis(aspect);

    const responder = useMemo(
        () =>
            PanResponder.create({
                onStartShouldSetPanResponder: () => axis !== null,
                onMoveShouldSetPanResponder: () => axis !== null,
                onPanResponderGrant: () => {
                    start.current = draft;
                },
                onPanResponderMove: (_event, gesture) => {
                    if (aspect !== undefined) {
                        setDraft(focusAfterDrag(start.current, aspect, PREVIEW, gesture.dx, gesture.dy));
                    }
                },
            }),
        [aspect, axis, draft],
    );

    const sheet: ViewStyle = {backgroundColor: theme.colors.surface, borderRadius: theme.radius.md};

    return (
        <Modal visible={visible} transparent animationType="fade" onRequestClose={onCancel}>
            <View style={styles.backdrop}>
                <View style={[styles.sheet, sheet]}>
                    <Text variant="label" muted>
                        {axis === null ? 'NOTHING TO FRAME' : axis === 'y' ? 'DRAG UP AND DOWN' : 'DRAG LEFT AND RIGHT'}
                    </Text>

                    <View testID="framer-preview" style={styles.preview} {...responder.panHandlers}>
                        <PortraitImage uri={uri} focus={draft} size={PREVIEW} radius={theme.radius.sm} testID="framer-image" />
                    </View>

                    <Text variant="caption" muted style={styles.hint}>
                        {axis === null
                            ? 'This portrait is already square — the whole image fits.'
                            : 'This is exactly what the square will show. The image itself is never changed.'}
                    </Text>

                    <View style={styles.actions}>
                        <Button label="Reset" variant="secondary" onPress={() => setDraft(CENTERED_PORTRAIT)} testID="framer-reset" />
                        <Button label="Cancel" variant="secondary" onPress={onCancel} testID="framer-cancel" />
                        <Button
                            label="Done"
                            // Centred is stored as "never framed" — the state the app has always had —
                            // rather than as a deliberate 0.5/0.5. Reset really resets.
                            onPress={() => onSave(draft.x === 0.5 && draft.y === 0.5 ? null : draft)}
                            testID="framer-done"
                        />
                    </View>
                </View>
            </View>
            <Pressable style={styles.dismiss} onPress={onCancel} testID="framer-backdrop" />
        </Modal>
    );
}

const styles = StyleSheet.create({
    backdrop: {
        alignItems: 'center',
        backgroundColor: 'rgba(0, 0, 0, 0.6)',
        flex: 1,
        justifyContent: 'center',
        padding: 20,
    },
    sheet: {
        alignItems: 'center',
        padding: 20,
        rowGap: 12,
    },
    preview: {
        height: PREVIEW,
        width: PREVIEW,
    },
    hint: {
        maxWidth: PREVIEW,
        textAlign: 'center',
    },
    actions: {
        columnGap: 8,
        flexDirection: 'row',
    },
    dismiss: {
        // Behind the sheet: catches taps that miss it, without stealing the drag.
        bottom: 0,
        left: 0,
        position: 'absolute',
        right: 0,
        top: 0,
        zIndex: -1,
    },
});
