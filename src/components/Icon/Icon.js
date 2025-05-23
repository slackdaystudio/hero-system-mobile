import React from 'react';
import {Pressable, View} from 'react-native';
import FontAwesome6 from 'react-native-vector-icons/FontAwesome6';
import {verticalScale} from 'react-native-size-matters';
import {TEXT_COLOR} from '../../Styles';

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

export const Icon = ({name, size = verticalScale(14), color = TEXT_COLOR, onPress, onLongPress, ...rest}) => {
    if (typeof onPress === 'function') {
        return (
            <Pressable active onPress={() => onPress()} onLongPress={() => onLongPress()} style={({pressed}) => [{}, {opacity: pressed ? 0.1 : 1}]}>
                <View alignItems="center" justifyContent="center">
                    <FontAwesome6 name={name} size={size} color={color} {...rest} />
                </View>
            </Pressable>
        );
    }

    return <FontAwesome6 name={name} size={size} color={color} {...rest} />;
};
