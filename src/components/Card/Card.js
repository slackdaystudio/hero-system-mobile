import React from 'react';
import PropTypes from 'prop-types';
import {View} from 'react-native';
import {verticalScale, scale} from 'react-native-size-matters';

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

export const Card = ({heading, body, footer, showHorizontalLine = true}) => {
    return (
        <View
            flex={1}
            backgroundColor="#1b1d1f"
            borderColor="#F3EDE9"
            borderWidth={0.25}
            borderRadius={4}
            paddingBottom={2}
            marginBottom={verticalScale(5)}
            paddingHorizontal={scale(5)}
            alignSelf="center"
            width="95%"
        >
            <View
                flex={1}
                flexDirection="row"
                justifyContent="space-between"
                paddingHorizontal={scale(1)}
                paddingTop={scale(5)}
                paddingBottom={0}
                marginBottom={0}
                borderBottomWidth={showHorizontalLine ? 0.25 : 0}
                borderBottomColor="#F3EDE9"
            >
                {heading === undefined ? null : heading}
            </View>
            <View paddingHorizontal={scale(1)}>{body}</View>
            <View
                paddingHorizontal={scale(10)}
                paddingTop={showHorizontalLine ? verticalScale(10) : 0}
                borderTopWidth={showHorizontalLine ? 0.25 : 0}
                borderTopColor="#F3EDE9"
            >
                {footer === undefined ? null : footer}
            </View>
        </View>
    );
};

Card.propTypes = {
    heading: PropTypes.object.isRequired,
    body: PropTypes.object,
    footer: PropTypes.object,
    showHorizontalLine: PropTypes.bool,
};
