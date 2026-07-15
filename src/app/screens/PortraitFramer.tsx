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
 * Choose which part of a portrait the square shows: drag to move, pinch to zoom.
 *
 * The preview *is* the crop — the same {@link PortraitImage} the list and the sheet draw, just
 * bigger — so what you drag is what you get, rather than a representation of it.
 *
 * Non-destructive: this stores three numbers and never touches the image bytes, so Reset always
 * gets the original framing back and nothing can be lost by fiddling.
 *
 * **The responder is built exactly once.** Rebuilding it mid-gesture — which is what happens if the
 * live focus is a dependency — swaps the View's handlers under an in-flight touch, RN drops the
 * responder, and the next move arrives as a *fresh* gesture with dx/dy of 0. That computes straight
 * back to where the drag started, so the image visibly snaps back. Everything the handlers need to
 * read is a ref for that reason; the deps array is empty and must stay empty.
 *
 * **Gestures here are tested**, contrary to the obvious assumption. react-test-renderer does no hit
 * testing, so a finger can't be simulated — but everything below `panHandlers` is RN's own code, and
 * feeding it a synthetic `touchHistory` derives gestureState exactly as a device does. Both bugs
 * this shipped with were found that way, and neither was in the maths. See its test.
 */
import React, {useMemo, useRef, useState} from 'react';
import {Modal, PanResponder, Pressable, StyleSheet, View, type GestureResponderEvent, type PanResponderGestureState, type ViewStyle} from 'react-native';
import {CENTERED_PORTRAIT, type PortraitFocus} from 'core/ports';
import {Button, PortraitImage, Text} from 'app/components';
import {
    draggableAxes,
    focusAfterDrag,
    focusAfterZoom,
    MAX_SCALE,
    MIN_SCALE,
    pinchSpread,
    ZOOM_STEP,
    zoomedBy,
    type TouchHistoryLike,
} from 'app/components/portraitFocus';

/**
 * RN's **TypeScript** types declare `GestureResponderEvent` as a plain `NativeSyntheticEvent` and
 * omit `touchHistory` — but Flow types it as a `ResponderSyntheticEvent`, which has it, and
 * PanResponder reads it on every move. The types are wrong, not the event.
 */
type ResponderEvent = GestureResponderEvent & {touchHistory: TouchHistoryLike};
import {useTheme} from 'app/theme';

const PREVIEW = 260;

export interface PortraitFramerProps {
    uri: string;
    /** Where it's framed now; null reads as centred. */
    focus: PortraitFocus | null;
    aspect: number | undefined;
    visible: boolean;
    onCancel: () => void;
    /** null = reset to centred and unzoomed (stored as "never framed"). */
    onSave: (focus: PortraitFocus | null) => void;
}

const isUnframed = (focus: PortraitFocus): boolean =>
    focus.x === CENTERED_PORTRAIT.x && focus.y === CENTERED_PORTRAIT.y && focus.scale === CENTERED_PORTRAIT.scale;

export function PortraitFramer({uri, focus, aspect, visible, onCancel, onSave}: PortraitFramerProps): React.JSX.Element {
    const theme = useTheme();
    const [draft, setDraft] = useState<PortraitFocus>(focus ?? CENTERED_PORTRAIT);

    // Read by the handlers, which are built once and would otherwise close over the first render's
    // values forever.
    const live = useRef(draft);
    live.current = draft;
    const aspectRef = useRef(aspect);
    aspectRef.current = aspect;

    // Where the gesture began. PanResponder deltas are cumulative from touch-down, so applying them
    // to a moving draft would accelerate the image away from the finger.
    const start = useRef<PortraitFocus>(draft);
    const pinchFrom = useRef<number | null>(null);

    /**
     * One move handler, reached from **both** dispatch paths.
     *
     * `onPanResponderMove` alone is not enough. RN dispatches `onMoveShouldSetResponderCapture` to
     * the current responder too — its own source calls that "incorrect" — and that handler runs
     * `_updateGestureStateOnMove`, which stamps `_accountsForMovesUpTo`. `onResponderMove` then sees
     * the timestamp already accounted for and returns *before* calling `onPanResponderMove`. A
     * single-finger drag skips the capture dispatch (the responder is its own common ancestor), so
     * pan worked and pinch never fired once — the second finger is exactly what brings capture in.
     *
     * So: handle it from whichever arrives, and guard on the timestamp so it only counts once.
     * gestureState is already updated by the time either calls us.
     */
    const handled = useRef(0);

    const onMove = (event: GestureResponderEvent, gesture: PanResponderGestureState): void => {
        const currentAspect = aspectRef.current;
        const history = (event as ResponderEvent).touchHistory;

        if (currentAspect === undefined || handled.current === history.mostRecentTimeStamp) {
            return;
        }

        handled.current = history.mostRecentTimeStamp;

        // `numberActiveTouches` + `touchHistory`, not `nativeEvent.touches` — the latter is filtered
        // to the event's target and does not reliably carry the second finger.
        const spread = gesture.numberActiveTouches >= 2 ? pinchSpread(history) : null;

        if (spread !== null && spread > 0) {
            // First frame of the pinch: remember the span and the scale to grow from, so a second
            // finger arriving mid-drag doesn't jump.
            if (pinchFrom.current === null) {
                pinchFrom.current = spread;
                start.current = live.current;
                return;
            }

            setDraft(focusAfterZoom(start.current, currentAspect, start.current.scale * (spread / pinchFrom.current)));
            return;
        }

        // Back to one finger: re-anchor so the pan doesn't inherit the pinch's travel.
        if (pinchFrom.current !== null) {
            pinchFrom.current = null;
            start.current = live.current;
            return;
        }

        setDraft(focusAfterDrag(start.current, currentAspect, PREVIEW, gesture.dx, gesture.dy));
    };

    const onMoveRef = useRef(onMove);
    onMoveRef.current = onMove;

    const responder = useMemo(
        () =>
            PanResponder.create({
                onStartShouldSetPanResponder: () => true,
                onMoveShouldSetPanResponder: () => true,
                // Not a claim — the responder is already ours. This is the only place a multi-touch
                // move reliably arrives, so it does the work and declines the capture.
                onMoveShouldSetPanResponderCapture: (event, gesture) => {
                    onMoveRef.current(event, gesture);
                    return false;
                },
                onPanResponderGrant: () => {
                    start.current = live.current;
                    pinchFrom.current = null;
                    handled.current = 0;
                },
                onPanResponderMove: (event, gesture) => onMoveRef.current(event, gesture),
                onPanResponderRelease: () => {
                    pinchFrom.current = null;
                },
                // Nothing may take the gesture mid-frame.
                onPanResponderTerminationRequest: () => false,
            }),
        // Must stay empty — see the note above. Everything mutable is read through a ref.
        [],
    );

    // Buttons as well as pinch. Pinch shipped broken twice, and a phone is still the only place
    // that proves a finger lands where you think — so zoom does not depend on the gesture.
    const zoom = (factor: number): void => setDraft((current) => (aspect === undefined ? current : zoomedBy(current, aspect, factor)));

    const axes = aspect === undefined ? {x: false, y: false} : draggableAxes(aspect, draft.scale);
    const canDrag = axes.x || axes.y;
    const sheet: ViewStyle = {backgroundColor: theme.colors.surface, borderRadius: theme.radius.md};

    return (
        <Modal visible={visible} transparent animationType="fade" onRequestClose={onCancel}>
            <View style={styles.backdrop}>
                <View style={[styles.sheet, sheet]}>
                    <Text variant="label" muted>
                        {canDrag ? 'DRAG TO MOVE · PINCH TO ZOOM' : 'PINCH TO ZOOM'}
                    </Text>

                    <View testID="framer-preview" style={styles.preview} {...responder.panHandlers}>
                        <PortraitImage uri={uri} focus={draft} size={PREVIEW} radius={theme.radius.sm} testID="framer-image" />
                    </View>

                    <View style={styles.zoom}>
                        <Button label="–" variant="secondary" disabled={draft.scale <= MIN_SCALE} onPress={() => zoom(1 / ZOOM_STEP)} testID="framer-zoom-out" />
                        <Text variant="label" muted>
                            {`${draft.scale.toFixed(1)}×`}
                        </Text>
                        <Button label="+" variant="secondary" disabled={draft.scale >= MAX_SCALE} onPress={() => zoom(ZOOM_STEP)} testID="framer-zoom-in" />
                    </View>

                    <Text variant="caption" muted style={styles.hint}>
                        This is exactly what the square will show. The image itself is never changed.
                    </Text>

                    <View style={styles.actions}>
                        <Button label="Reset" variant="secondary" onPress={() => setDraft(CENTERED_PORTRAIT)} testID="framer-reset" />
                        <Button label="Cancel" variant="secondary" onPress={onCancel} testID="framer-cancel" />
                        <Button
                            label="Done"
                            // Centred and unzoomed is stored as "never framed" — the state the app
                            // has always had — rather than as a deliberate 0.5/0.5/1. Reset resets.
                            onPress={() => onSave(isUnframed(draft) ? null : draft)}
                            testID="framer-done"
                        />
                    </View>
                </View>
            </View>
            <Pressable style={styles.dismiss} onPress={onCancel} testID="framer-backdrop" />
        </Modal>
    );
}

/** Exported for its test: the zoom bounds the framer offers. */
export const ZOOM_RANGE = {min: MIN_SCALE, max: MAX_SCALE};

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
    zoom: {
        alignItems: 'center',
        columnGap: 12,
        flexDirection: 'row',
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
