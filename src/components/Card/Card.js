import React from 'react';
import {View} from 'react-native';
import {verticalScale, scale} from 'react-native-size-matters';
import {Colors} from '../../Styles';

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

export const ROUNDED = 0;

export const SQUARE = 1;

export const Card = ({heading, body, footer, cardShape = ROUNDED}) => {
    return (
        <View
            flex={1}
            backgroundColor={Colors.primary}
            borderColor={Colors.formAccent}
            borderWidth={0.5}
            borderRadius={verticalScale(10)}
            paddingTop={verticalScale(5)}
            minHeight={verticalScale(53)}
            alignSelf="center"
            width="100%"
        >
            {heading === undefined ? null : heading}
            {body === undefined ? null : (
                <View
                    marginTop={verticalScale(10)}
                    paddingHorizontal={scale(1)}
                    borderBottomLeftRadius={verticalScale(cardShape === ROUNDED ? 10 : 0)}
                    borderBottomRightRadius={verticalScale(cardShape === ROUNDED ? 10 : 0)}
                    backgroundColor={Colors.background}
                >
                    {body}
                </View>
            )}
            <View flexDirection="row" justifyContent="space-around" alignItems="center">
                {footer === undefined ? null : footer}
            </View>
        </View>
    );
};
