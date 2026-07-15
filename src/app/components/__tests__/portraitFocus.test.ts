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
 * The framing maths.
 *
 * This is where the risk is: the gesture on top of it can't be exercised by react-test-renderer
 * (no hit testing), so the part that can be wrong is kept pure and pinned here.
 *
 * Worked against the real portrait in the corpus — `Indigo Bunting.hdc`, 200×300, a figure on a
 * hilltop with their head near mid-height. It is the reason there is no clever default: a "faces
 * are at the top" rule would have framed the sky.
 */
import {CENTERED_PORTRAIT} from 'core/ports';
import {coverStyle, croppedAxis, focusAfterDrag, overflowOf} from '../portraitFocus';

/** The corpus portrait: 200 wide, 300 tall. */
const TALL = 200 / 300;
const WIDE = 300 / 200;

/** `-0` lays out exactly like `0` and stringifies to "0"; it's noise in an assertion. */
const noMinusZero = (value: number): number => (value === 0 ? 0 : value);

/** Which source rows a square shows, given the style — the thing a player actually sees. */
const rowsShown = (aspect: number, focus: {x: number; y: number}, sourceHeight = 300): [number, number] => {
    const style = coverStyle(aspect, focus) as {height: string; top: string};
    const scale = sourceHeight / parseFloat(style.height); // container% -> source px
    const top = (-parseFloat(style.top) / 100) * 100 * scale;

    return [noMinusZero(Math.round(top)), noMinusZero(Math.round(top + 100 * scale))];
};

describe('croppedAxis', () => {
    it('names the only axis that can move', () => {
        // Covering a square scales the short side to fit, so only the long side has anything spare.
        expect(croppedAxis(TALL)).toBe('y');
        expect(croppedAxis(WIDE)).toBe('x');
        expect(croppedAxis(1)).toBeNull();
    });
});

describe('overflowOf', () => {
    it('measures what falls outside the square', () => {
        // A 200x300 image covering a 200-square: 100px of it is cropped away.
        expect(overflowOf(TALL, 200)).toBeCloseTo(100);
        expect(overflowOf(WIDE, 200)).toBeCloseTo(100);
        expect(overflowOf(1, 200)).toBe(0);
    });
});

describe('coverStyle', () => {
    /**
     * The one that protects everybody's library: centred must be byte-for-byte what
     * `resizeMode="cover"` already did. Every unframed portrait in every install renders through
     * this now, so if centred moved, framing would have silently re-cropped the whole world.
     */
    it('reproduces the old centre crop exactly', () => {
        // Before framing existed, a 200x300 portrait showed source rows 50..250.
        expect(rowsShown(TALL, CENTERED_PORTRAIT)).toEqual([50, 250]);
    });

    it('pins the top and bottom edges at the extremes', () => {
        expect(rowsShown(TALL, {x: 0.5, y: 0})).toEqual([0, 200]);
        expect(rowsShown(TALL, {x: 0.5, y: 1})).toEqual([100, 300]);
    });

    it('scales the tall image to fill the width, and hangs the rest below', () => {
        const style = coverStyle(TALL, CENTERED_PORTRAIT);

        expect(style.width).toBe('100%');
        expect(style.height).toBe('150%'); // 300/200
        expect(style.top).toBe('-25%');
    });

    it('moves a wide image sideways instead', () => {
        const style = coverStyle(WIDE, CENTERED_PORTRAIT);

        expect(style.height).toBe('100%');
        expect(style.width).toBe('150%');
        expect(style.left).toBe('-25%');
        expect(style.top).toBe(0);
    });

    it('leaves a square image alone — there is nothing to crop', () => {
        expect(coverStyle(1, {x: 0, y: 0})).toMatchObject({width: '100%', height: '100%', left: '0%'});
    });

    it('clamps a focus from outside the image', () => {
        // Storage is only two numbers; a bad one must not push the image off its frame.
        expect(rowsShown(TALL, {x: 0.5, y: 5})).toEqual(rowsShown(TALL, {x: 0.5, y: 1}));
        expect(rowsShown(TALL, {x: 0.5, y: -3})).toEqual(rowsShown(TALL, {x: 0.5, y: 0}));
    });
});

describe('focusAfterDrag', () => {
    it('follows the finger — drag down to reveal what is above', () => {
        // 260-square preview, 100*260/200 = 130px of overflow. Half of it is 65px.
        const size = 200;
        const dragged = focusAfterDrag(CENTERED_PORTRAIT, TALL, size, 0, 50);

        expect(dragged.y).toBeCloseTo(0.5 - 50 / 100);
        expect(rowsShown(TALL, dragged)[0]).toBeLessThan(rowsShown(TALL, CENTERED_PORTRAIT)[0]);
    });

    it('drags a wide image sideways, and ignores the axis that cannot move', () => {
        const dragged = focusAfterDrag(CENTERED_PORTRAIT, WIDE, 200, 50, 999);

        expect(dragged.x).toBeCloseTo(0);
        expect(dragged.y).toBe(0.5); // a wide image has no vertical overflow to spend
    });

    it('ignores the cross-axis on a tall image', () => {
        expect(focusAfterDrag(CENTERED_PORTRAIT, TALL, 200, 999, 0).x).toBe(0.5);
    });

    it('cannot be dragged off its own frame', () => {
        expect(focusAfterDrag(CENTERED_PORTRAIT, TALL, 200, 0, 10_000).y).toBe(0);
        expect(focusAfterDrag(CENTERED_PORTRAIT, TALL, 200, 0, -10_000).y).toBe(1);
    });

    it('does nothing to a square image', () => {
        // No overflow, so every drag is a no-op rather than a divide-by-zero.
        expect(focusAfterDrag(CENTERED_PORTRAIT, 1, 200, 40, 40)).toEqual(CENTERED_PORTRAIT);
    });

    it('is anchored to where the drag started, not to where it has got to', () => {
        // PanResponder deltas are cumulative from touch-down. Applying each to the running focus
        // would accelerate the image away from the finger.
        const size = 200;
        const start = CENTERED_PORTRAIT;
        const halfway = focusAfterDrag(start, TALL, size, 0, 20);
        const full = focusAfterDrag(start, TALL, size, 0, 40);

        expect(full.y).toBeCloseTo(0.5 - 0.4);
        expect(halfway.y).toBeCloseTo(0.5 - 0.2);
    });
});
