import React from 'react';
import {View, Text} from 'react-native';
import {verticalScale} from 'react-native-size-matters';
import {Animated, useSlideInLeft} from '../Animated';
import {useSelector} from 'react-redux';
import {useColorTheme} from '../../hooks/useColorTheme';

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

export const Heading = ({text, animated = false}) => {
    const scheme = useSelector((state) => state.settings.colorScheme);

    const {styles} = useColorTheme(scheme);

    const slideIn = useSlideInLeft();

    if (animated) {
        return (
            <Animated animationProps={{duration: 3000, delay: 800, state: slideIn}} style={{flex: 1, maxHeight: verticalScale(48), paddingBottom: 20}}>
                <View style={{flex: 1, maxHeight: verticalScale(48), paddingBottom: verticalScale(48)}}>
                    <Text style={styles.heading}>{text}</Text>
                </View>
            </Animated>
        );
    }

    return (
        <View style={{flex: 1, maxHeight: verticalScale(48), paddingBottom: verticalScale(48)}}>
            <Text style={styles.heading}>{text}</Text>
        </View>
    );
};
