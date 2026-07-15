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
 * Icons, drawn from plain Views.
 *
 * The app has no icon set, and one icon is a poor reason to take on `react-native-svg` — a native
 * module, rebuild and all — or an emoji, which ignores the theme and renders as a different picture
 * on every platform. These take a colour like any other themed element and look identical on both.
 *
 * If this file grows past a handful, that's the argument for a real vector set; a couple of shapes
 * is not (see the design-system note in CLAUDE.md — third-party lives at the leaf, if at all).
 */
import React from 'react';
import {StyleSheet, View} from 'react-native';

export interface IconProps {
    color: string;
    /** Height and width of the icon's box. Parts scale with it. */
    size?: number;
}

/**
 * A waste basket: handle, lid, body.
 *
 * Proportioned off `size` so it stays itself at any scale. The parts plus their margins must stay
 * inside the `size` box — Android clips overflow where iOS doesn't, so a body that "just fits"
 * loses its bottom edge on one platform only.
 */
export function TrashIcon({color, size = 18}: IconProps): React.JSX.Element {
    const bar = Math.max(1, Math.round(size / 12));
    const handle = {width: size * 0.4, height: bar, backgroundColor: color};
    const lid = {width: size, height: bar, backgroundColor: color};
    const body = {
        width: size * 0.72,
        height: size * 0.55,
        borderColor: color,
        borderLeftWidth: bar,
        borderRightWidth: bar,
        borderBottomWidth: bar,
        borderBottomLeftRadius: bar * 2,
        borderBottomRightRadius: bar * 2,
    };

    return (
        <View style={[styles.icon, {width: size, height: size}]}>
            <View style={[styles.handle, handle]} />
            <View style={lid} />
            <View style={[styles.body, body]} />
        </View>
    );
}

const styles = StyleSheet.create({
    icon: {
        alignItems: 'center',
        justifyContent: 'center',
    },
    handle: {
        marginBottom: 1,
    },
    body: {
        marginTop: 2,
    },
});
