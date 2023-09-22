import React, {Component} from 'react';
import PropTypes from 'prop-types';
import {Platform, View} from 'react-native';
import {Text} from 'native-base';
import {verticalScale} from 'react-native-size-matters';

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

export default class CircleText extends Component {
    static propTypes = {
        title: PropTypes.string.isRequired,
        size: PropTypes.number.isRequired,
        fontSize: PropTypes.number.isRequired,
        color: PropTypes.string.isRequired,
        fontColor: PropTypes.string,
        backgroundColor: PropTypes.string,
    };

    render() {
        const size = verticalScale(this.props.size);
        const fontSize = verticalScale(this.props.fontSize);
        const borderWidth = 1;

        return (
            <View
                style={{
                    alignItems: 'center',
                    justifyContent: 'center',
                    backgroundColor: this.props.backgroundColor,
                    borderColor: this.props.color,
                    width: size,
                    height: size,
                    borderRadius: size / 2,
                    borderWidth: borderWidth,
                    marginTop: verticalScale(2),
                }}
            >
                <Text
                    style={{
                        textAlign: 'center',
                        alignSelf: 'center',
                        justifyContent: 'center',
                        fontSize: fontSize - 2 * borderWidth,
                        lineHeight: fontSize - (Platform.OS === 'ios' ? 2 * borderWidth : borderWidth),
                        paddingTop: verticalScale(3),
                        fontWeight: 'bold',
                        color: this.props.fontColor,
                    }}
                >
                    {this.props.title}
                </Text>
            </View>
        );
    }
}

CircleText.defaultProps = {
    fontColor: '#F3EDE9',
    backgroundColor: '#000',
};
