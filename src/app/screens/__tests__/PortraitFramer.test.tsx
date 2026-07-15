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
 * The drag itself can't be exercised here — react-test-renderer does no hit testing and RN's
 * responder system isn't running — so the maths lives in `components/portraitFocus` and is tested
 * there. What *is* testable, and what actually broke in the first cut, is the identity of the
 * gesture handlers. See the regression below.
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

    it('shows the zoom only once there is some', async () => {
        const plain = await render({x: 0.5, y: 0.2, scale: 1});
        expect(JSON.stringify(plain.toJSON())).not.toContain('×');

        const zoomed = await render({x: 0.5, y: 0.2, scale: 2.5});
        expect(JSON.stringify(zoomed.toJSON())).toContain('2.5×');
    });
});
