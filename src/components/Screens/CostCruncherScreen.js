import React from 'react';
import PropTypes from 'prop-types';
import {useDispatch, useSelector} from 'react-redux';
import {ImageBackground, Text, TextInput, View} from 'react-native';
import {scale, verticalScale} from 'react-native-size-matters';
import Slider from '../Slider/Slider';
import Header from '../Header/Header';
import styles from '../../Styles';
import {updateFormValue} from '../../reducers/forms';

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
        <ImageBackground source={require('../../../public/background.png')} style={{flex: 1, flexDirection: 'column'}} imageStyle={{resizeMode: 'repeat'}}>
            <Header navigation={navigation} />

            <Text style={styles.heading}>Cruncher</Text>
            <Text style={styles.grey}>Use this tool to calculate power costs on the fly.</Text>
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
        </ImageBackground>
    );
};

CostCruncherScreen.propTypes = {
    navigation: PropTypes.object.isRequired,
};
