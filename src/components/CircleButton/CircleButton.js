import React, {Component} from 'react';
import PropTypes from 'prop-types';
import {Platform, Pressable, Text, View} from 'react-native';
import {verticalScale} from 'react-native-size-matters';
import {Icon} from '../Icon/Icon';

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

export default class CircleButton extends Component {
    static propTypes = {
        name: PropTypes.string.isRequired,
        size: PropTypes.number.isRequired,
        fontSize: PropTypes.number.isRequired,
        color: PropTypes.string.isRequired,
        onPress: PropTypes.func.isRequired,
    };

    render() {
        const size = verticalScale(this.props.size);
        const fontSize = verticalScale(this.props.fontSize);
        const borderWidth = 1;

        return (
            <Pressable onPress={this.props.onPress}>
                <View
                    style={{
                        alignItems: 'center',
                        justifyContent: 'center',
                        backgroundColor: '#1b1d1f',
                        borderColor: this.props.color,
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
                            color: '#F3EDE9',
                        }}
                    >
                        <Icon solid name={this.props.name} style={{fontSize: fontSize, color: this.props.color}} />
                    </Text>
                </View>
            </Pressable>
        );
    }
}
