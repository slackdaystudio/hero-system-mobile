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
 * A portrait in a square, showing the part of it the player chose.
 *
 * `<Image resizeMode="cover">` crops to the centre and there is no way to tell it otherwise — RN
 * has no `object-position`. So the cover maths is done here: scale to fill, then slide the overflow
 * by the focal point.
 *
 * A default would have been cheaper, but there isn't a good one. HERO portraits are artwork, not
 * headshots: the one in the corpus is a figure on a hilltop with their head at mid-height, where a
 * centre crop is right and a "faces are at the top" rule would frame the sky. Composition varies
 * per image, so the player says. {@link CENTERED_PORTRAIT} — what everything did before this
 * existed — remains the default for anything unframed.
 */
import React, {useEffect, useState} from 'react';
import {Image, StyleSheet, View, type ViewStyle} from 'react-native';
import {CENTERED_PORTRAIT, type PortraitFocus} from 'core/ports';
import {coverStyle} from './portraitFocus';

/**
 * Intrinsic sizes, kept for the process.
 *
 * `Image.getSize` re-reads the file per call, and a FlatList remounts rows as it recycles — without
 * this, scrolling a library would re-measure the same portraits over and over. Keyed by uri, and
 * the ImageStore never reuses an id for different bytes, so an entry can't go stale.
 */
const aspects = new Map<string, number>();

export interface PortraitImageProps {
    uri: string;
    focus?: PortraitFocus | null;
    /** Square side. Omit to fill the parent, which must size itself. */
    size?: number;
    /** Rounding for the crop window. */
    radius?: number;
    testID?: string;
}

export function PortraitImage({uri, focus, size, radius, testID}: PortraitImageProps): React.JSX.Element {
    const [aspect, setAspect] = useState<number | undefined>(() => aspects.get(uri));

    useEffect(() => {
        if (aspects.has(uri)) {
            setAspect(aspects.get(uri));
            return;
        }

        let live = true;

        Image.getSize(
            uri,
            (width, height) => {
                if (height <= 0 || width <= 0) {
                    return;
                }
                aspects.set(uri, width / height);
                if (live) {
                    setAspect(width / height);
                }
            },
            () => {
                // Unreadable: leave the aspect unknown and fall back to a plain centred cover, which
                // is what this always did. A portrait that won't measure still draws.
            },
        );

        return () => {
            live = false;
        };
    }, [uri]);

    const box: ViewStyle = {overflow: 'hidden', borderRadius: radius, ...(size === undefined ? styles.fill : {width: size, height: size})};

    // Until the size is known — and forever, if it never resolves — this is exactly the old
    // behaviour, so a portrait never waits on a measurement to appear.
    if (aspect === undefined) {
        return (
            <View style={box}>
                <Image testID={testID} source={{uri}} resizeMode="cover" style={styles.fill} />
            </View>
        );
    }

    return (
        <View style={box}>
            <Image testID={testID} source={{uri}} style={coverStyle(aspect, focus ?? CENTERED_PORTRAIT)} />
        </View>
    );
}

const styles = StyleSheet.create({
    fill: {
        width: '100%',
        height: '100%',
    },
});
