import React from 'react';
import {Pressable, Text, View} from 'react-native';
import {useSelector} from 'react-redux';
import {useColorTheme} from '../../hooks/useColorTheme';

// Copyright (C) Slack Day Studio - All Rights Reserved
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

export const Button = ({label, onPress, disabled, small, labelStyle, ...rest}) => {
    const scheme = useSelector((state) => state.settings.colorScheme);

    const {Colors, styles} = useColorTheme(scheme);

    let style = small ? {...styles.buttonSmall} : {...styles.buttonBig};

    let textStyle = {...styles.buttonText};

    if (rest.style !== undefined) {
        if (rest.hasOwnProperty('style')) {
            style = Object.assign(style, rest.style);

            delete rest.style;
        }
    }

    style.borderWidth = 0.75;
    style.borderColor = Colors.switchGutter;

    if (labelStyle !== undefined) {
        textStyle = Object.assign(textStyle, labelStyle);
    } else {
        labelStyle = styles.buttonText;
    }

    return (
        <Pressable flexDirection="row" onPress={disabled ? null : onPress} style={({pressed}) => ({...style, opacity: pressed ? 0.1 : 1})} {...rest}>
            <View style={style}>
                <Text style={textStyle}>{label}</Text>
            </View>
        </Pressable>
    );
};
