import React from 'react';
import PropTypes from 'prop-types';
import {useDispatch, useSelector} from 'react-redux';
import {View, ImageBackground, Switch} from 'react-native';
import {Container, Button, Text} from 'native-base';
import {ScaledSheet, scale} from 'react-native-size-matters';
import Slider from '../Slider/Slider';
import Header from '../Header/Header';
import {dieRoller} from '../../lib/DieRoller';
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

export const SkillScreen = ({navigation}) => {
    const dispatch = useDispatch();

    const skillForm = useSelector((state) => state.forms.skill);

    const roll = () => {
        const threshold = skillForm.skillCheck ? skillForm.value + '-' : null;

        navigation.navigate('Result', {from: 'Skill', result: dieRoller.rollCheck(threshold)});
    };

    const _updateFormValue = (key, value) => {
        if (key === 'value') {
            value = parseInt(value, 10);
        }

        dispatch(updateFormValue({formName: 'skill', key, value}));
    };

    const renderSlider = () => {
        if (skillForm.skillCheck) {
            return (
                <Slider
                    style={styles.switchStyle}
                    label="Skill Level:"
                    value={skillForm.value}
                    step={1}
                    min={-30}
                    max={30}
                    onValueChange={updateFormValue}
                    valueKey="value"
                />
            );
        }

        return null;
    };

    return (
        <Container style={styles.container}>
            <ImageBackground source={require('../../../public/background.png')} style={{flex: 1, flexDirection: 'column'}} imageStyle={{resizeMode: 'repeat'}}>
                <Header navigation={navigation} />
                <Text style={styles.heading}>Roll 3d6</Text>
                <View paddingHorizontal={scale(10)}>
                    <View style={[localStyles.titleContainer, localStyles.checkContainer]}>
                        <Text style={styles.grey}>Is skill check?</Text>
                        <View style={{paddingRight: scale(10)}}>
                            <Switch
                                value={skillForm.skillCheck}
                                onValueChange={() => _updateFormValue('skillCheck', !skillForm.skillCheck)}
                                minimumTrackTintColor="#14354d"
                                maximumTrackTintColor="#14354d"
                                thumbColor="#14354d"
                                trackColor={{false: '#000', true: '#3d5478'}}
                                ios_backgroundColor="#3d5478"
                            />
                        </View>
                    </View>
                    {renderSlider()}
                    <View style={styles.buttonContainer}>
                        <Button block style={styles.button} onPress={roll}>
                            <Text uppercase={false}>Roll</Text>
                        </Button>
                    </View>
                </View>
            </ImageBackground>
        </Container>
    );
};

SkillScreen.propTypes = {
    navigation: PropTypes.object.isRequired,
};

const localStyles = ScaledSheet.create({
    titleContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingTop: '10@vs',
    },
    checkContainer: {
        paddingBottom: '20@vs',
    },
});
