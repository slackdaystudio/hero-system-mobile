import React from 'react';
import {Text, View} from 'react-native';
import {Icon} from 'native-base';
import {scale, verticalScale} from 'react-native-size-matters';
import {PieChart} from 'react-native-gifted-charts';
import styles from '../Styles';

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

export const Chart = ({distributions}) => {
    const colors = ['#0ffc03', '#ff00e6', '#fc8403', '#0390fc', '#fcf803', '#ff4d00'];

    const data = Object.keys(distributions).map((key, i) => {
        return {
            value: distributions[key],
            color: colors[i],
            text: distributions[key].toString(),
            faceName: key,
        };
    });

    return (
        <>
            <Text style={[styles.boldGrey, {fontSize: verticalScale(20), textAlign: 'center', paddingBottom: verticalScale(10)}]}>Dice Face Distributions</Text>
            <View alignItems="center" justifyContent="center">
                <View paddingLeft={scale(30)} marginBottom={verticalScale(-170)}>
                    <PieChart semiCircle showText data={data} textColor="#000" fontWeight="bold" radius={scale(150)} labelsPosition="outward" />
                </View>
                <Text style={[styles.boldGrey, {fontSize: verticalScale(20), textAlign: 'center', paddingBottom: verticalScale(5)}]}>Legend</Text>
                <View width={scale(150)} flexDirection="row" justifyContent={'space-around'}>
                    {data.map((d, i) => {
                        return (
                            <Icon
                                key={`face-${i}`}
                                solid
                                type="FontAwesome5"
                                name={`dice-${d.faceName}`}
                                style={{fontSize: verticalScale(20), color: d.color}}
                            />
                        );
                    })}
                </View>
            </View>
        </>
    );
};
