import React from 'react';
import {useDispatch, useSelector} from 'react-redux';
import {Platform, Text, TextInput, View} from 'react-native';
import {scale, verticalScale} from 'react-native-size-matters';
import Slider from '../Slider/Slider';
import {Header} from '../Header/Header';
import {updateFormValue} from '../../reducers/forms';
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

export const CostCruncherScreen = ({navigation}) => {
    const scheme = useSelector((state) => state.settings.colorScheme);

    const {styles} = useColorTheme(scheme);

    const dispatch = useDispatch();

    const costCruncherForm = useSelector((state) => state.forms.costCruncher);

    const _updateFormValue = (key, value) => {
        if (key === 'cost') {
            if (/^[0-9]*$/.test(value) === false) {
                return;
            }
        }

        dispatch(updateFormValue({formName: 'costCruncher', key, value: key === 'cost' ? parseInt(value, 10) : parseFloat(value)}));
    };

    const renderActiveCost = () => {
        return <Text style={[styles.grey, {fontSize: verticalScale(75)}]}>{Math.round(costCruncherForm.cost * (1 + costCruncherForm.advantages))}</Text>;
    };

    const renderRealCost = () => {
        let cost = Math.round((costCruncherForm.cost * (1 + costCruncherForm.advantages)) / (1 + Math.abs(costCruncherForm.limitations)));

        return <Text style={[styles.grey, {fontSize: verticalScale(75)}]}>{cost}</Text>;
    };

    return (
        <>
            <Header navigation={navigation} />
            <Text style={styles.heading}>Cruncher</Text>
            <View paddingHorizontal={scale(10)} paddingTop={verticalScale(10)}>
                <Text style={[styles.grey, {textAlign: 'center'}]}>Use this tool to calculate power costs on the fly.</Text>
                <View style={{flexDirection: 'row', justifyContent: 'space-around', alignItems: 'center', paddingTop: 20}}>
                    <Text style={styles.boldGrey}>Active Cost</Text>
                    <Text style={styles.boldGrey}>Real Cost</Text>
                </View>
                <View style={{flexDirection: 'row', justifyContent: 'space-around', alignItems: 'center'}}>
                    {renderActiveCost()}
                    {renderRealCost()}
                </View>
                <View flexDirection="row" justifyContent="space-between" paddingHorizontal={scale(10)}>
                    <View alignSelf="center">
                        <Text style={styles.boldGrey}>Base Cost:</Text>
                    </View>
                    <TextInput
                        style={styles.textInput}
                        keyboardType="numeric"
                        maxLength={3}
                        defaultValue={costCruncherForm.cost.toString()}
                        onEndEditing={(event) => _updateFormValue('cost', event.nativeEvent.text)}
                    />
                </View>
                <View paddingHorizontal={scale(Platform.OS === 'ios' ? 10 : 0)}>
                    <Slider
                        label="Advantages:"
                        value={costCruncherForm.advantages}
                        step={0.25}
                        min={0}
                        max={5}
                        onValueChange={(val) => _updateFormValue('advantages', val)}
                    />
                    <Slider
                        label="Limitations:"
                        value={costCruncherForm.limitations}
                        step={0.25}
                        min={-5}
                        max={0}
                        onValueChange={(val) => _updateFormValue('limitations', val)}
                    />
                </View>
            </View>
        </>
    );
};
