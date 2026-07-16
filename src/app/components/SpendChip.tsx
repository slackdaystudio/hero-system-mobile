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

import React, {useCallback, useRef} from 'react';
import {Animated, Pressable, StyleSheet, View} from 'react-native';
import {useTheme} from 'app/theme';

export interface SpendChipProps {
    /** Called on tap — spend the cost. */
    onSpend: () => void;
    testID?: string;
    accessibilityLabel?: string;
    /** The chip's contents — typically the "END n" text. */
    children: React.ReactNode;
}

/**
 * A tappable cost chip that flashes a brief highlight behind its label when pressed — the local
 * confirmation that a spend registered, without a toast for every routine tap. Wraps the three END
 * spend controls (a power, STR, a movement mode). Opacity-only animation, so it runs on the native
 * driver and needs no colour interpolation.
 */
export function SpendChip({onSpend, testID, accessibilityLabel, children}: SpendChipProps): React.JSX.Element {
    const theme = useTheme();
    const flash = useRef(new Animated.Value(0)).current;

    const press = useCallback(() => {
        flash.stopAnimation();
        flash.setValue(1);
        Animated.timing(flash, {toValue: 0, duration: 500, useNativeDriver: true}).start();
        onSpend();
    }, [flash, onSpend]);

    const highlight = {
        backgroundColor: theme.colors.primary,
        borderRadius: theme.radius.sm,
        opacity: flash.interpolate({inputRange: [0, 1], outputRange: [0, 0.3]}),
    };

    return (
        <View>
            <Animated.View pointerEvents="none" style={[StyleSheet.absoluteFill, highlight]} />
            <Pressable testID={testID} accessibilityRole="button" accessibilityLabel={accessibilityLabel} onPress={press} style={styles.pad}>
                {children}
            </Pressable>
        </View>
    );
}

const styles = StyleSheet.create({
    pad: {
        paddingHorizontal: 6,
        paddingVertical: 2,
    },
});
