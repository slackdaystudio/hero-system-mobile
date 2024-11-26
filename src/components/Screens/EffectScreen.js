import React, {useMemo, useState} from 'react';
import PropTypes from 'prop-types';
import {useDispatch, useSelector} from 'react-redux';
import {View, ImageBackground} from 'react-native';
import DropDownPicker from 'react-native-dropdown-picker';
import {verticalScale} from 'react-native-size-matters';
import {RadioGroup} from 'react-native-radio-buttons-group';
import Slider from '../Slider/Slider';
import {Button} from '../Button/Button';
import Header from '../Header/Header';
import Heading from '../Heading/Heading';
import {dieRoller, PARTIAL_DIE_PLUS_ONE, PARTIAL_DIE_HALF, PARTIAL_DIE_MINUS_ONE, PARTIAL_DIE_NONE} from '../../lib/DieRoller';
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

const effectTypes = ['None', 'Aid', 'Dispel', 'Drain', 'Entangle', 'Flash', 'Healing', 'Luck', 'Unluck'];

export const EffectScreen = ({navigation}) => {
    const dispatch = useDispatch();

    const effectForm = useSelector((state) => state.forms.effect);

    const [open, setOpen] = useState(false);

    const [value, setValue] = useState(PARTIAL_DIE_NONE);

    const [selectedId, setSelectedId] = useState(0);

    const [items, setItems] = useState([
        {label: 'No partial die', value: PARTIAL_DIE_NONE},
        {label: '+1 pip', value: PARTIAL_DIE_PLUS_ONE},
        {label: '½d6', value: PARTIAL_DIE_HALF},
        {label: '1d6-1', value: PARTIAL_DIE_MINUS_ONE},
    ]);

    const radioButtons = useMemo(() => {
        return effectTypes.map((type, i) => ({
            id: i,
            label: type,
            value: type,
            color: '#fff',
            containerStyle: {minWidth: verticalScale(290)},
            labelStyle: {color: '#fff'},
        }));
    }, []);

    const roll = () => {
        navigation.navigate('Result', {
            from: 'Effect',
            result: dieRoller.rollEffect(effectForm),
        });
    };

    const selectEffect = (id) => {
        setSelectedId(id);

        dispatch(updateFormValue({formName: 'effect', key: 'effectType', value: radioButtons.find((rb) => rb.id === id).value}));
    };

    const setSliderState = (key, val) => {
        dispatch(updateFormValue({formName: 'effect', key, value: parseInt(val, 10)}));
    };

    const renderEffects = () => {
        return (
            <View flex={1} alignItems="stretch">
                <RadioGroup flex={1} color="#fff" radioButtons={radioButtons} onPress={selectEffect} selectedId={selectedId} />
            </View>
        );
    };

    return (
        <ImageBackground source={require('../../../public/background.png')} style={{flex: 1, flexDirection: 'column'}} imageStyle={{resizeMode: 'repeat'}}>
            <Header navigation={navigation} />
            <Heading text="Effect Roll" />
            <View>
                <Slider label="Dice:" value={effectForm.dice} step={1} min={1} max={50} onValueChange={setSliderState} valueKey="dice" />
            </View>
            <View>
                <DropDownPicker
                    theme="DARK"
                    listMode="MODAL"
                    open={open}
                    value={value}
                    items={items}
                    setOpen={setOpen}
                    setValue={setValue}
                    setItems={setItems}
                    onChangeValue={(val) => dispatch(updateFormValue({formName: 'effect', key: 'partialDie', value: val}))}
                />
            </View>
            <Heading text="Effect" />
            {renderEffects()}
            <View style={{paddingBottom: verticalScale(20)}} />
            <View style={styles.buttonContainer}>
                <Button solid label="Roll" style={styles.button} onPress={roll} />
            </View>
            <View style={{paddingBottom: verticalScale(20)}} />
        </ImageBackground>
    );
};

EffectScreen.propTypes = {
    navigation: PropTypes.object.isRequired,
};
