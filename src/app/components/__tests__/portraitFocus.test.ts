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
import {CENTERED_PORTRAIT, type PortraitFocus} from 'core/ports';
import {clampScale, coverStyle, draggableAxes, focusAfterDrag, focusAfterZoom, MAX_SCALE, MIN_SCALE, overflowOf} from '../portraitFocus';

/** The corpus portrait: 200 wide, 300 tall. */
const TALL = 200 / 300;
const WIDE = 300 / 200;

/** `-0` lays out exactly like `0` and stringifies to "0"; it's noise in an assertion. */
const noMinusZero = (value: number): number => (value === 0 ? 0 : value);

/** Which source rows a square shows, given the style — the thing a player actually sees. */
const rowsShown = (aspect: number, focus: PortraitFocus, sourceHeight = 300): [number, number] => {
    const style = coverStyle(aspect, focus) as {height: string; top: string};
    const scale = sourceHeight / parseFloat(style.height); // container% -> source px
    const top = (-parseFloat(style.top) / 100) * 100 * scale;

    return [noMinusZero(Math.round(top)), noMinusZero(Math.round(top + 100 * scale))];
};

describe('draggableAxes', () => {
    it('offers only the axis with something spare, unzoomed', () => {
        // Covering a square scales the short side to fit, so only the long side has anything spare.
        expect(draggableAxes(TALL)).toEqual({x: false, y: true});
        expect(draggableAxes(WIDE)).toEqual({x: true, y: false});
        expect(draggableAxes(1)).toEqual({x: false, y: false});
    });

    it('opens up both axes once zoomed in — the point of zoom', () => {
        expect(draggableAxes(TALL, 1.5)).toEqual({x: true, y: true});
        expect(draggableAxes(1, 2)).toEqual({x: true, y: true});
    });
});

describe('overflowOf', () => {
    it('measures what falls outside the square, per axis', () => {
        // A 200x300 image covering a 200-square: 100px of height is cropped away, no width.
        expect(overflowOf(TALL, 200)).toEqual({x: 0, y: 100});
        expect(overflowOf(WIDE, 200)).toEqual({x: 100, y: 0});
        expect(overflowOf(1, 200)).toEqual({x: 0, y: 0});
    });

    it('grows both axes with zoom', () => {
        // 2x on a square: 200px wide image in a 100 box -> 100 spare each way.
        expect(overflowOf(1, 100, 2)).toEqual({x: 100, y: 100});
    });
});

describe('clampScale', () => {
    it('never zooms out past cover — that would letterbox, not frame', () => {
        expect(clampScale(0.2)).toBe(MIN_SCALE);
        expect(clampScale(99)).toBe(MAX_SCALE);
        expect(clampScale(2)).toBe(2);
    });
});

describe('focusAfterZoom', () => {
    it('closes in on what is already framed rather than jumping to the middle', () => {
        const framed = {x: 0.5, y: 0.2, scale: 1};

        expect(focusAfterZoom(framed, TALL, 2)).toMatchObject({y: 0.2, scale: 2});
    });

    it('re-centres an axis that zooming back to cover just made meaningless', () => {
        // At cover a tall image has no horizontal choice, so a stale x would be state nobody set,
        // waiting to reappear the next time they zoom in.
        const zoomed = {x: 0.9, y: 0.2, scale: 2};

        expect(focusAfterZoom(zoomed, TALL, 1)).toEqual({x: 0.5, y: 0.2, scale: 1});
    });

    it('clamps to the offered range', () => {
        expect(focusAfterZoom(CENTERED_PORTRAIT, TALL, 0.1).scale).toBe(MIN_SCALE);
        expect(focusAfterZoom(CENTERED_PORTRAIT, TALL, 50).scale).toBe(MAX_SCALE);
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
        expect(rowsShown(TALL, {x: 0.5, y: 0, scale: 1})).toEqual([0, 200]);
        expect(rowsShown(TALL, {x: 0.5, y: 1, scale: 1})).toEqual([100, 300]);
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
        expect(style.top).toBe('0%'); // no vertical overflow to offset
    });

    it('leaves a square image alone — there is nothing to crop', () => {
        expect(coverStyle(1, {x: 0, y: 0, scale: 1})).toMatchObject({width: '100%', height: '100%', left: '0%'});
    });

    it('clamps a focus from outside the image', () => {
        // Storage is only two numbers; a bad one must not push the image off its frame.
        expect(rowsShown(TALL, {x: 0.5, y: 5, scale: 1})).toEqual(rowsShown(TALL, {x: 0.5, y: 1, scale: 1}));
        expect(rowsShown(TALL, {x: 0.5, y: -3, scale: 1})).toEqual(rowsShown(TALL, {x: 0.5, y: 0, scale: 1}));
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

describe('zoomed framing', () => {
    it('scales both axes, so a tall image can finally move sideways', () => {
        const style = coverStyle(TALL, {x: 0, y: 0.5, scale: 2});

        // 2x: the width is twice the square, so there is real horizontal travel now.
        expect(style.width).toBe('200%');
        expect(style.height).toBe('300%'); // (100/0.667) * 2
        expect(style.left).toBe('0%'); // x=0 pins the left edge (-0 stringifies to "0")
    });

    it('drags on both axes when zoomed', () => {
        const zoomed = {x: 0.5, y: 0.5, scale: 2};
        const dragged = focusAfterDrag(zoomed, TALL, 200, 40, 40);

        expect(dragged.x).toBeLessThan(0.5);
        expect(dragged.y).toBeLessThan(0.5);
        expect(dragged.scale).toBe(2); // a drag never changes the zoom
    });

    it('is still exactly cover at scale 1', () => {
        // The whole library renders through this. Zoom must be inert until someone uses it.
        expect(rowsShown(TALL, CENTERED_PORTRAIT)).toEqual([50, 250]);
        expect(coverStyle(TALL, CENTERED_PORTRAIT)).toMatchObject({width: '100%', height: '150%', top: '-25%', left: '0%'});
    });
});
});
