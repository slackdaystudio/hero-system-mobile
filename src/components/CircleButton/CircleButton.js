import React from 'react';
import {Platform, Pressable, Text, View} from 'react-native';
import {verticalScale} from 'react-native-size-matters';
import {Icon} from '../Icon/Icon';
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

export const CircleButton = ({name, size, fontSize, color, onPress}) => {
    const scheme = useSelector((state) => state.settings.colorScheme);

    const {Colors} = useColorTheme(scheme);

    const borderWidth = 1;

    return (
        <Pressable onPress={onPress}>
            <View
                style={{
                    alignItems: 'center',
                    justifyContent: 'center',
                    backgroundColor: color ? color : Colors.background,
                    borderColor: Colors.tertiary,
                    width: size,
                    height: size,
                    borderRadius: size / 2,
                    borderWidth: borderWidth,
                    marginVertical: verticalScale(8),
                }}
            >
                <Text
                    style={{
                        textAlign: 'center',
                        alignSelf: 'center',
                        justifyContent: 'center',
                        fontSize: fontSize - 2 * borderWidth,
                        lineHeight: fontSize - (Platform.OS === 'ios' ? 2 * borderWidth : borderWidth),
                        fontWeight: 'bold',
                        color: Colors.text,
                    }}
                >
                    <Icon solid name={name} style={{fontSize, color: Colors.tertiary}} />
                </Text>
            </View>
        </Pressable>
    );
};
