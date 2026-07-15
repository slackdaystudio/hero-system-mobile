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
 * The maths behind framing a portrait: where a square shows, and what a drag does to it.
 *
 * Pure and separate from the components on purpose. A drag gesture can't be exercised by
 * react-test-renderer (it does no hit testing), so the part that can be wrong lives here where it
 * can be tested, and the component is left as thin wiring over it.
 */
import type {ImageStyle} from 'react-native';
import type {PortraitFocus} from 'core/ports';

const clamp = (value: number): number => Math.min(1, Math.max(0, value));

/**
 * Which axis a square actually crops.
 *
 * Only one ever does: covering a square scales the short side to fit, so the long side is the only
 * one with anything to spare. The framer uses this to drag on the axis that can move — offering the
 * other would be a control that does nothing.
 */
export const croppedAxis = (aspect: number): 'y' | 'x' | null => (aspect < 1 ? 'y' : aspect > 1 ? 'x' : null);

/** How much image, in pixels, falls outside a `size`-square — all of it on one axis. */
export function overflowOf(aspect: number, size: number): number {
    return aspect < 1 ? size * (1 / aspect - 1) : size * (aspect - 1);
}

/**
 * How to place an image inside a square so it covers, anchored at `focus`.
 *
 * Percentages, not pixels — they resolve against the parent, so this needs no measurement of the
 * container and behaves identically at 44pt in a list and 240pt in the framer.
 *
 * `{x: 0.5, y: 0.5}` reproduces `resizeMode="cover"` exactly, which is what every portrait did
 * before framing existed. Nothing moves until someone moves it.
 */
export function coverStyle(aspect: number, focus: PortraitFocus): ImageStyle {
    if (aspect < 1) {
        // Taller than wide: fills the width, overflows below.
        const height = 100 / aspect;

        return {position: 'absolute', left: 0, width: '100%', height: `${height}%`, top: `${-(height - 100) * clamp(focus.y)}%`};
    }

    // Wider than tall (or square, where the shift is zero either way): fills the height.
    const width = 100 * aspect;

    return {position: 'absolute', top: 0, height: '100%', width: `${width}%`, left: `${-(width - 100) * clamp(focus.x)}%`};
}

/**
 * The focus after dragging the image by (dx, dy) inside a `size`-square preview.
 *
 * Dragging **down** reveals what's **above** — the image follows the finger — so the focus moves
 * against the gesture. Both ends clamp, so a drag can't push the image off its own frame.
 */
export function focusAfterDrag(focus: PortraitFocus, aspect: number, size: number, dx: number, dy: number): PortraitFocus {
    const overflow = overflowOf(aspect, size);

    if (overflow <= 0) {
        return focus; // a square image in a square crop: nothing to move
    }

    return croppedAxis(aspect) === 'y' ? {x: focus.x, y: clamp(focus.y - dy / overflow)} : {x: clamp(focus.x - dx / overflow), y: focus.y};
}
