import React from 'react';
import PropTypes from 'prop-types';
import {useDispatch, useSelector} from 'react-redux';
import {View, ImageBackground, Text, Switch} from 'react-native';
import {scale, verticalScale} from 'react-native-size-matters';
import Header from '../Header/Header';
import Heading from '../Heading/Heading';
import {Button} from '../Button/Button';
import {common} from '../../lib/Common';
import styles from '../../Styles';
import {resetForm} from '../../reducers/forms';
import {clearAllCharacters} from '../../reducers/character';
import {clearRandomHero} from '../../reducers/randomHero';
import {clearApplicationSettings, toggleSetting} from '../../reducers/settings';
import {clearStatistics} from '../../reducers/statistics';
import {selectSettingsData} from '../../reducers/selectors';
import {VirtualizedList} from '../VirtualizedList/VirtualizedList';

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

export const SettingsScreen = ({navigation}) => {
    const dispatch = useDispatch();

    const {settings, version} = useSelector((state) => selectSettingsData(state));

    const clearFormData = (showToast = true) => {
        dispatch(resetForm({formName: 'skill'}));
        dispatch(resetForm({formName: 'hit'}));
        dispatch(resetForm({formName: 'damage'}));
        dispatch(resetForm({formName: 'effect'}));
        dispatch(resetForm({formName: 'costCruncher'}));
        dispatch(resetForm({formName: 'status'}));

        if (showToast) {
            common.toast('Form data has been cleared', 'success');
        }
    };

    const _clearCharacterData = (showToast = true) => {
        dispatch(clearAllCharacters());

        if (showToast) {
            common.toast('Loaded characters have been cleared', 'success');
        }
    };

    const clearHeroData = (showToast = true) => {
        dispatch(clearRandomHero());

        if (showToast) {
            common.toast('H.E.R.O. character has been cleared', 'success');
        }
    };

    const clearStatisticsData = (showToast = true) => {
        dispatch(clearStatistics());

        if (showToast) {
            common.toast('Statistical data has been cleared', 'success');
        }
    };

    const clearAll = () => {
        dispatch(clearApplicationSettings());

        clearFormData(false);
        _clearCharacterData(false);
        clearHeroData(false);
        clearStatisticsData(false);

        common.toast('Everything has been cleared', 'success');
    };

    return (
        <ImageBackground source={require('../../../public/background.png')} style={{flex: 1, flexDirection: 'column'}} imageStyle={{resizeMode: 'repeat'}}>
            <Header navigation={navigation} />
            <VirtualizedList>
                <Heading text="App Version" />
                <View style={{paddingHorizontal: scale(10), paddingBottom: verticalScale(20), paddingTop: verticalScale(10)}}>
                    <Text style={styles.grey}>
                        <Text style={styles.boldGrey}>HERO System Mobile v</Text>
                        {version.version}
                    </Text>
                </View>
                <Heading text="Game" />
                <View>
                    <View flexDirection="row" justifyContent="space-between" style={{paddingHorizontal: scale(10), paddingBottom: verticalScale(10)}}>
                        <View>
                            <Text style={styles.boldGrey}>Use 5th Edition rules?</Text>
                        </View>
                        <Switch
                            value={settings.useFifthEdition}
                            onValueChange={() => dispatch(toggleSetting({key: 'useFifthEdition', value: !settings.useFifthEdition}))}
                            minimumTrackTintColor="#14354d"
                            maximumTrackTintColor="#14354d"
                            thumbColor="#14354d"
                            trackColor={{false: '#000', true: '#3d5478'}}
                            ios_backgroundColor="#3d5478"
                        />
                    </View>
                </View>
                <Heading text="Performance" />
                <View style={{paddingHorizontal: scale(10)}}>
                    <View flexDirection="row" justifyContent="space-between" style={{paddingBottom: verticalScale(10)}}>
                        <View>
                            <Text style={styles.boldGrey}>Play animations?</Text>
                        </View>
                        <Switch
                            value={settings.showAnimations}
                            onValueChange={() => dispatch(toggleSetting({key: 'showAnimations', value: !settings.showAnimations}))}
                            minimumTrackTintColor="#14354d"
                            maximumTrackTintColor="#14354d"
                            thumbColor="#14354d"
                            trackColor={{false: '#000', true: '#3d5478'}}
                            ios_backgroundColor="#3d5478"
                        />
                    </View>
                    <View flexDirection="row" justifyContent="space-between" style={{paddingBottom: verticalScale(10)}}>
                        <View>
                            <Text style={styles.boldGrey}>Increase roll entropy?</Text>
                        </View>
                        <Switch
                            value={settings.increaseEntropy}
                            onValueChange={() => dispatch(toggleSetting({key: 'increaseEntropy', value: !settings.increaseEntropy}))}
                            minimumTrackTintColor="#14354d"
                            maximumTrackTintColor="#14354d"
                            thumbColor="#14354d"
                            trackColor={{false: '#000', true: '#3d5478'}}
                            ios_backgroundColor="#3d5478"
                        />
                    </View>
                </View>
                <Heading text="Sound" />
                <View style={{paddingHorizontal: scale(10)}}>
                    <View flexDirection="row" justifyContent="space-between" style={{paddingBottom: verticalScale(10)}}>
                        <View>
                            <Text style={styles.boldGrey}>Play rolling sounds?</Text>
                        </View>
                        <Switch
                            value={settings.playSounds}
                            onValueChange={() => dispatch(toggleSetting({key: 'playSounds', value: !settings.playSounds}))}
                            minimumTrackTintColor="#14354d"
                            maximumTrackTintColor="#14354d"
                            thumbColor="#14354d"
                            trackColor={{false: '#000', true: '#3d5478'}}
                            ios_backgroundColor="#3d5478"
                        />
                    </View>
                    <View flexDirection="row" justifyContent="space-between" style={{paddingBottom: verticalScale(10)}}>
                        <View>
                            <Text style={styles.boldGrey}>Play dice sounds only?</Text>
                        </View>
                        <Switch
                            value={settings.onlyDiceSounds}
                            onValueChange={() => dispatch(toggleSetting({key: 'onlyDiceSounds', value: !settings.onlyDiceSounds}))}
                            minimumTrackTintColor="#14354d"
                            maximumTrackTintColor="#14354d"
                            thumbColor="#14354d"
                            trackColor={{false: '#000', true: '#3d5478'}}
                            ios_backgroundColor="#3d5478"
                            disabled={!settings.playSounds}
                        />
                    </View>
                </View>
                <Heading text="Cache" />
                <View>
                    <View flexDirection="row" justifyContent="space-between" style={{paddingBottom: verticalScale(10)}}>
                        <View alignSelf="center">
                            <Text style={styles.boldGrey}>Form data</Text>
                        </View>
                        <Button label="Clear" style={styles.buttonTiny} onPress={() => clearFormData()} />
                    </View>
                    <View flexDirection="row" justifyContent="space-between" style={{paddingBottom: verticalScale(10)}}>
                        <View alignSelf="center">
                            <Text style={styles.boldGrey}>Loaded characters</Text>
                        </View>
                        <Button label="Clear" style={styles.buttonTiny} onPress={() => _clearCharacterData()} />
                    </View>
                    <View flexDirection="row" justifyContent="space-between" style={{paddingBottom: verticalScale(10)}}>
                        <View alignSelf="center">
                            <Text style={styles.boldGrey}>H.E.R.O.</Text>
                        </View>
                        <Button label="Clear" style={styles.buttonTiny} onPress={() => clearHeroData()} />
                    </View>
                    <View flexDirection="row" justifyContent="space-between" style={{paddingBottom: verticalScale(10)}}>
                        <View alignSelf="center">
                            <Text style={styles.boldGrey}>Statistics</Text>
                        </View>
                        <Button label="Clear" style={styles.buttonTiny} onPress={() => clearStatisticsData()} />
                    </View>
                </View>
                <View style={[styles.buttonContainer, {paddingTop: verticalScale(20), paddingBottom: verticalScale(20)}]}>
                    <Button label="Clear All" onPress={() => clearAll()} />
                </View>
            </VirtualizedList>
        </ImageBackground>
    );
};

SettingsScreen.propTypes = {
    navigation: PropTypes.object.isRequired,
};
