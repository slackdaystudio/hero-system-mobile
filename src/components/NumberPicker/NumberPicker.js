import React from 'react';
import {View, Text} from 'react-native';
import {ScaledSheet, verticalScale} from 'react-native-size-matters';
import {Icon} from '../Icon/Icon';
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

export const NumberPicker = ({value, step, increment, decrement, stateKey, min, max}) => {
    const scheme = useSelector((state) => state.settings.colorScheme);

    const {Colors, styles} = useColorTheme(scheme);

    return (
        <View style={{flexDirection: 'row', justifyContent: 'center'}}>
            <View style={localStyles.row}>
                <Icon
                    solid
                    name="square-minus"
                    style={[styles.grey, {fontSize: verticalScale(22), color: Colors.formControl, alignItems: 'flex-start'}]}
                    onPress={() => decrement(stateKey, step)}
                />
            </View>
            <View style={localStyles.row}>
                <Text style={styles.grey}>{value}</Text>
            </View>
            <View style={localStyles.row}>
                <Icon
                    solid
                    name="square-plus"
                    style={[styles.grey, {fontSize: verticalScale(22), color: Colors.formControl, alignItems: 'flex-end'}]}
                    onPress={() => increment(stateKey, step)}
                />
            </View>
        </View>
    );
};

const localStyles = ScaledSheet.create({
    row: {
        alignSelf: 'center',
        alignItems: 'center',
        width: '30@s',
        height: '25@vs',
    },
});
