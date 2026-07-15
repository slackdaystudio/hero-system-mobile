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
 * The framer's wiring.
 *
 * react-test-renderer does no hit testing, so a real finger can't be simulated. But the handlers RN
 * would call *can* be — driving `panHandlers` with a synthetic `touchHistory` runs the real
 * PanResponder, which computes gestureState exactly as it does on a device. That is enough to catch
 * both bugs this feature shipped with, and neither was in the maths.
 */
import React from 'react';
import {Image} from 'react-native';
import TestRenderer, {act, type ReactTestRenderer} from 'react-test-renderer';
import type {PortraitFocus} from 'core/ports';
import {ThemeProvider} from 'app/theme';
import {PortraitFramer} from '../PortraitFramer';

const TALL = 200 / 300;

const render = async (focus: PortraitFocus | null, saved: Array<PortraitFocus | null> = []): Promise<ReactTestRenderer> => {
    let tree!: ReactTestRenderer;

    await act(async () => {
        tree = TestRenderer.create(
            <ThemeProvider colorScheme="dark">
                <PortraitFramer uri="file:///p.jpg" focus={focus} aspect={TALL} visible onCancel={() => undefined} onSave={(next) => saved.push(next)} />
            </ThemeProvider>,
        );
    });
    await act(async () => {});

    return tree;
};

const press = async (tree: ReactTestRenderer, testID: string): Promise<void> => {
    const target = tree.root.findAllByProps({testID}).find((node) => typeof node.props.onPress === 'function');

    await act(async () => {
        target?.props.onPress();
    });
    await act(async () => {});
};

const handlers = (tree: ReactTestRenderer) => tree.root.findByProps({testID: 'framer-preview'}).props;

describe('PortraitFramer', () => {
    beforeEach(() => {
        jest.spyOn(Image, 'getSize').mockImplementation((_uri, success) => success(200, 300));
    });
    afterEach(() => jest.restoreAllMocks());

    /**
     * The bug this feature shipped with: the responder was rebuilt whenever the draft changed.
     *
     * Mid-drag that swaps the View's handlers under an in-flight touch, RN drops the responder, and
     * the next move arrives as a *fresh* gesture with dx/dy of 0 — which computes straight back to
     * where the drag started. The image moved, then snapped back, every time.
     *
     * The gesture can't be replayed here, but its cause can: the handlers must survive a state
     * change. If the live focus ever creeps back into the responder's deps, this goes red.
     */
    it('keeps one set of gesture handlers across a focus change', async () => {
        const tree = await render({x: 0.5, y: 0.2, scale: 1});
        const before = handlers(tree);

        // Reset changes the draft — the same state change a drag frame makes.
        await press(tree, 'framer-reset');
        const after = handlers(tree);

        expect(after.onResponderMove).toBe(before.onResponderMove);
        expect(after.onResponderGrant).toBe(before.onResponderGrant);
        expect(after.onStartShouldSetResponder).toBe(before.onStartShouldSetResponder);
    });

    it('opens showing the crop the character already has, not a centred one', async () => {
        const tree = await render({x: 0.5, y: 0, scale: 1});
        const image = tree.root.findAllByProps({testID: 'framer-image'}).find((node) => node.props.source !== undefined)!;

        expect(image.props.style).toMatchObject({top: '0%', height: '150%'});
    });

    it('redraws the preview when the draft moves', async () => {
        // The preview IS the crop, so a changed focus must reach the image.
        const tree = await render({x: 0.5, y: 0, scale: 1});
        const styleOf = () => (tree.root.findAllByProps({testID: 'framer-image'}).find((node) => node.props.source !== undefined)!.props.style as {top: string}).top;

        expect(styleOf()).toBe('0%');

        await press(tree, 'framer-reset');

        expect(styleOf()).toBe('-25%'); // centred on a 200x300
    });

    it('stores centred-and-unzoomed as unframed rather than as a choice', async () => {
        const saved: Array<PortraitFocus | null> = [];
        const tree = await render({x: 0.5, y: 0.1, scale: 2}, saved);

        await press(tree, 'framer-reset');
        await press(tree, 'framer-done');

        expect(saved).toEqual([null]);
    });

    it('saves a real framing as itself', async () => {
        const saved: Array<PortraitFocus | null> = [];
        const tree = await render({x: 0.5, y: 0.1, scale: 2}, saved);

        await press(tree, 'framer-done');

        expect(saved).toEqual([{x: 0.5, y: 0.1, scale: 2}]);
    });

    it('always reads out the zoom, so the buttons say what they did', async () => {
        const plain = await render({x: 0.5, y: 0.2, scale: 1});
        expect(JSON.stringify(plain.toJSON())).toContain('1.0×');

        const zoomed = await render({x: 0.5, y: 0.2, scale: 2.5});
        expect(JSON.stringify(zoomed.toJSON())).toContain('2.5×');
    });

    /**
     * Zoom has buttons as well as pinch, on purpose. The pinch gesture is the one thing here that
     * can't be tested, and it shipped broken once — so zoom does not depend on it.
     */
    describe('the zoom buttons', () => {
        const scaleShown = (tree: ReactTestRenderer): string => {
            const text = JSON.stringify(tree.toJSON());
            return /(\d\.\d)×/.exec(text)?.[1] ?? '';
        };

        it('zooms in and out without a gesture', async () => {
            const tree = await render(null);
            expect(scaleShown(tree)).toBe('1.0');

            await press(tree, 'framer-zoom-in');
            expect(scaleShown(tree)).toBe('1.3'); // 1.25, one decimal

            await press(tree, 'framer-zoom-out');
            expect(scaleShown(tree)).toBe('1.0');
        });

        it('stops offering a direction it cannot go', async () => {
            const tree = await render(null);
            const button = (testID: string) => tree.root.findAllByProps({testID}).find((node) => node.props.disabled !== undefined)!;

            expect(button('framer-zoom-out').props.disabled).toBe(true); // already at cover
            expect(button('framer-zoom-in').props.disabled).toBe(false);
        });

        it('saves the zoom it was given', async () => {
            const saved: Array<PortraitFocus | null> = [];
            const tree = await render(null, saved);

            await press(tree, 'framer-zoom-in');
            await press(tree, 'framer-done');

            expect(saved[0]?.scale).toBeCloseTo(1.25);
        });
    });
});
/**
 * Gestures, driven through the real PanResponder.
 *
 * Everything below `panHandlers` is RN's own code — it derives gestureState from the touch history
 * the same way here as on a phone. Only the platform delivering the touches is missing.
 */
describe('PortraitFramer gestures', () => {
    beforeEach(() => {
        jest.spyOn(Image, 'getSize').mockImplementation((_uri, success) => success(200, 300));
    });
    afterEach(() => jest.restoreAllMocks());

    /** One finger, as RN's touch bank records it. */
    const track = (x: number, y: number, at: number, from?: {x: number; y: number; at: number}) => ({
        touchActive: true,
        currentPageX: x,
        currentPageY: y,
        currentTimeStamp: at,
        previousPageX: from?.x ?? x,
        previousPageY: from?.y ?? y,
        previousTimeStamp: from?.at ?? at,
        startPageX: x,
        startPageY: y,
        startTimeStamp: 0,
    });

    const event = (bank: ReturnType<typeof track>[], at: number) =>
        ({
            nativeEvent: {touches: bank.map((t) => ({pageX: t.currentPageX, pageY: t.currentPageY}))},
            touchHistory: {numberActiveTouches: bank.length, indexOfSingleActiveTouch: 0, mostRecentTimeStamp: at, touchBank: bank},
        }) as never;

    const gestures = (tree: ReactTestRenderer) => tree.root.findByProps({testID: 'framer-preview'}).props;
    const scaleOf = (tree: ReactTestRenderer): string => /(\d\.\d)×/.exec(JSON.stringify(tree.toJSON()))?.[1] ?? '';
    const topOf = (tree: ReactTestRenderer): number =>
        parseFloat((tree.root.findAllByProps({testID: 'framer-image'}).find((node) => node.props.source !== undefined)!.props.style as {top: string}).top);

    /**
     * The second bug this shipped with, and the subtle one.
     *
     * RN dispatches `onMoveShouldSetResponderCapture` to the current responder — its own source
     * calls that "incorrect" — and that handler stamps `_accountsForMovesUpTo`. `onResponderMove`
     * then sees the frame already accounted for and returns *before* calling `onPanResponderMove`.
     * A one-finger drag skips the capture dispatch, so pan worked while pinch never fired once: the
     * second finger is precisely what brings capture into play.
     */
    it('zooms when the move arrives via the capture dispatch — where pinch actually lands', async () => {
        const tree = await render(null);
        const handlers = gestures(tree);

        await act(async () => {
            handlers.onStartShouldSetResponder(event([track(100, 100, 1)], 1));
            handlers.onResponderGrant(event([track(100, 100, 1)], 1));
        });

        // Two fingers, 100px apart: the anchoring frame.
        await act(async () => {
            handlers.onResponderMove(event([track(100, 100, 2), track(200, 100, 2)], 2));
        });
        expect(scaleOf(tree)).toBe('1.0');

        // Spread to 200px — 2x — arriving the way a real multi-touch move does.
        await act(async () => {
            const frame = event([track(50, 100, 3), track(250, 100, 3)], 3);
            handlers.onMoveShouldSetResponderCapture(frame);
            handlers.onResponderMove(frame);
        });

        expect(scaleOf(tree)).toBe('2.0');
    });

    it('declines the capture — handling a move is not a claim on the responder', async () => {
        const tree = await render(null);

        expect(gestures(tree).onMoveShouldSetResponderCapture(event([track(0, 0, 1), track(10, 0, 1)], 1))).toBe(false);
    });

    it('pans on one finger, following it', async () => {
        const tree = await render(null);
        const handlers = gestures(tree);

        await act(async () => {
            handlers.onResponderGrant(event([track(100, 100, 1)], 1));
        });
        const before = topOf(tree);

        // Drag down 40px: reveals what is above, so the offset gets less negative.
        await act(async () => {
            handlers.onResponderMove(event([track(100, 140, 2, {x: 100, y: 100, at: 1})], 2));
        });

        expect(topOf(tree)).toBeGreaterThan(before);
    });

    it('counts one frame once, however many paths deliver it', async () => {
        // Both dispatches fire for the same move. Without the timestamp guard the image would
        // travel twice as far as the finger.
        const tree = await render(null);
        const handlers = gestures(tree);

        await act(async () => {
            handlers.onResponderGrant(event([track(100, 100, 1)], 1));
        });

        const frame = event([track(100, 140, 2, {x: 100, y: 100, at: 1})], 2);
        await act(async () => {
            handlers.onMoveShouldSetResponderCapture(frame);
            handlers.onResponderMove(frame);
        });
        const once = topOf(tree);

        await act(async () => {
            handlers.onResponderMove(frame);
        });

        expect(topOf(tree)).toBe(once);
    });

    it('refuses to hand the gesture over mid-frame', async () => {
        const tree = await render(null);

        expect(gestures(tree).onResponderTerminationRequest(event([track(0, 0, 1)], 1))).toBe(false);
    });
});

