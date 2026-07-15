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
 * The maths behind framing a portrait: where a square shows, and what a drag or a pinch does to it.
 *
 * Pure and separate from the components on purpose. Gestures can't be exercised by
 * react-test-renderer (it does no hit testing), so the part that can be wrong lives here where it
 * can be tested, and the components are left as thin wiring over it.
 */
import type {ImageStyle} from 'react-native';
import {CENTERED_PORTRAIT, type PortraitFocus} from 'core/ports';

/**
 * Zoom is bounded below at 1 — "cover" — so the square is always full. Letting it go lower would
 * mean bars down the sides, which is a worse picture, not a framing choice.
 */
export const MIN_SCALE = 1;
export const MAX_SCALE = 4;

const clamp = (value: number, low = 0, high = 1): number => Math.min(high, Math.max(low, value));

export const clampScale = (scale: number): number => clamp(scale, MIN_SCALE, MAX_SCALE);

/**
 * How big the image is, as a percentage of the square, once it covers and is zoomed.
 *
 * At `scale: 1` the short side is exactly 100% and only the long side overflows — which is what
 * `resizeMode="cover"` does, and what every portrait did before framing existed. Zoom scales both.
 */
function scaledPercent(aspect: number, scale: number): {width: number; height: number} {
    const cover = aspect < 1 ? {width: 100, height: 100 / aspect} : {width: 100 * aspect, height: 100};

    return {width: cover.width * scale, height: cover.height * scale};
}

/** How much image, in pixels, falls outside a `size`-square, per axis. */
export function overflowOf(aspect: number, size: number, scale = 1): {x: number; y: number} {
    const percent = scaledPercent(aspect, scale);

    return {x: (size * (percent.width - 100)) / 100, y: (size * (percent.height - 100)) / 100};
}

/**
 * Which axes a drag can actually move.
 *
 * Unzoomed, only one ever can: covering a square scales the short side to fit, so the long side is
 * the only one with anything spare. **Zoomed in, both can** — which is the point of zoom, and why
 * this returns a pair rather than the single axis it used to.
 */
export function draggableAxes(aspect: number, scale = 1): {x: boolean; y: boolean} {
    const overflow = overflowOf(aspect, 100, scale);

    // A hair of tolerance: floating point leaves ~1e-14 of "overflow" on an exactly square image,
    // which would offer a drag that visibly does nothing.
    return {x: overflow.x > 0.001, y: overflow.y > 0.001};
}

/**
 * How to place an image inside a square so it covers, anchored at `focus`.
 *
 * Percentages, not pixels — they resolve against the parent, so this needs no measurement of the
 * container and behaves identically at 44pt in a list and 260pt in the framer.
 *
 * `{x: 0.5, y: 0.5, scale: 1}` reproduces `resizeMode="cover"` exactly, which is what every
 * portrait did before framing existed. Nothing moves until someone moves it.
 */
export function coverStyle(aspect: number, focus: PortraitFocus): ImageStyle {
    const scale = clampScale(focus.scale);
    const percent = scaledPercent(aspect, scale);

    return {
        position: 'absolute',
        width: `${percent.width}%`,
        height: `${percent.height}%`,
        left: `${-(percent.width - 100) * clamp(focus.x)}%`,
        top: `${-(percent.height - 100) * clamp(focus.y)}%`,
    };
}

/**
 * The focus after dragging the image by (dx, dy) inside a `size`-square preview.
 *
 * Dragging **down** reveals what's **above** — the image follows the finger — so the focus moves
 * against the gesture. Both ends clamp, so a drag can't push the image off its own frame. An axis
 * with nothing to spare is left exactly alone rather than divided by zero.
 */
export function focusAfterDrag(focus: PortraitFocus, aspect: number, size: number, dx: number, dy: number): PortraitFocus {
    const overflow = overflowOf(aspect, size, clampScale(focus.scale));

    return {
        ...focus,
        x: overflow.x > 0 ? clamp(focus.x - dx / overflow.x) : focus.x,
        y: overflow.y > 0 ? clamp(focus.y - dy / overflow.y) : focus.y,
    };
}

/**
 * The focus after pinching to `scale`.
 *
 * Zooming keeps x/y, so it closes in on whatever is already framed rather than jumping to the
 * middle. Zooming back to 1 re-centres the axis that just lost its overflow — at cover there is
 * only one thing that axis can show, so leaving a stale fraction there would be meaningless state
 * that reappears the next time someone zooms in.
 */
export function focusAfterZoom(focus: PortraitFocus, aspect: number, scale: number): PortraitFocus {
    const next = clampScale(scale);
    const axes = draggableAxes(aspect, next);

    return {
        x: axes.x ? clamp(focus.x) : CENTERED_PORTRAIT.x,
        y: axes.y ? clamp(focus.y) : CENTERED_PORTRAIT.y,
        scale: next,
    };
}

/** Distance between two touch points — the raw material of a pinch. */
export function touchDistance(a: {pageX: number; pageY: number}, b: {pageX: number; pageY: number}): number {
    return Math.hypot(a.pageX - b.pageX, a.pageY - b.pageY);
}
