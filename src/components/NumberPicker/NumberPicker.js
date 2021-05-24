import React, {Component} from 'react';
import PropTypes from 'prop-types';
import {View} from 'react-native';
import {Text, Icon} from 'native-base';
import {ScaledSheet, verticalScale} from 'react-native-size-matters';
import styles from '../../Styles';

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

export default class NumberPicker extends Component {
    static propTypes = {
        value: PropTypes.number.isRequired,
        step: PropTypes.number,
        increment: PropTypes.func.isRequired,
        decrement: PropTypes.func.isRequired,
        stateKey: PropTypes.string.isRequired,
        min: PropTypes.number,
        max: PropTypes.number,
    };

    render() {
        return (
            <View style={{flex: 1, flexDirection: 'row', justifyContent: 'center'}}>
                <View style={localStyles.row}>
                    <Icon
                        type="FontAwesome"
                        name="minus-square"
                        style={[styles.grey, {fontSize: verticalScale(22), color: '#14354d', alignItems: 'flex-start'}]}
                        onPress={() => this.props.decrement(this.props.stateKey, this.props.step)}
                    />
                </View>
                <View style={localStyles.row}>
                    <Text style={styles.grey}>{this.props.value}</Text>
                </View>
                <View style={localStyles.row}>
                    <Icon
                        type="FontAwesome"
                        name="plus-square"
                        style={[styles.grey, {fontSize: verticalScale(22), color: '#14354d', alignItems: 'flex-end'}]}
                        onPress={() => this.props.increment(this.props.stateKey, this.props.step)}
                    />
                </View>
            </View>
        );
    }
}

NumberPicker.defaultProps = {
    step: 1,
    min: -99,
    max: 99,
};

const localStyles = ScaledSheet.create({
    row: {
        alignSelf: 'center',
        alignItems: 'center',
        width: '30@s',
        height: '25@vs',
    },
    modalContent: {
        flex: 1,
        flexDirection: 'row',
        padding: 0,
        justifyContent: 'space-around',
        alignItems: 'stretch',
    },
});
