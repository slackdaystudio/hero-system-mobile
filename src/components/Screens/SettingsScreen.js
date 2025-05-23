import React, {useEffect, useMemo, useState} from 'react';
import {useDispatch, useSelector} from 'react-redux';
import {View, Text, Switch, ActivityIndicator} from 'react-native';
import {scale, verticalScale} from 'react-native-size-matters';
import {Header} from '../Header/Header';
import {Heading} from '../Heading/Heading';
import {Button} from '../Button/Button';
import {common} from '../../lib/Common';
import {resetForm} from '../../reducers/forms';
import {clearAllCharacters} from '../../reducers/character';
import {clearRandomHero} from '../../reducers/randomHero';
import {clearApplicationSettings, INIT_SETTINGS, toggleSetting} from '../../reducers/settings';
import {clearStatistics} from '../../reducers/statistics';
import {VirtualizedList} from '../VirtualizedList/VirtualizedList';
import {ALL_THEMES, useColorTheme} from '../../hooks/useColorTheme';
import RadioButtonsGroup from 'react-native-radio-buttons-group';
import {useDatabase} from '../../contexts/DatabaseContext';
import {getSettings} from '../../database/Settings';

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

export const SettingsScreen = () => {
    const dispatch = useDispatch();

    const db = useDatabase();

    const colorScheme = useSelector((state) => state.settings.colorScheme);

    const {Colors, styles} = useColorTheme(colorScheme);

    const [settings, setSettings] = useState(null);

    useEffect(() => {
        const fetchSettings = async () => {
            const s = await getSettings(db);

            setSettings(s);
        };

        fetchSettings().catch((error) => {
            console.log('Setting settings to default', error);

            setSettings(INIT_SETTINGS);
        });
    });

    const version = useSelector((state) => state.version);

    const [selectedTheme, setSelectedTheme] = useState(colorScheme);

    const themeRadioButtons = useMemo(() => {
        return ALL_THEMES.map((theme, i) => ({
            id: theme,
            label: common.capitalize(theme),
            value: theme,
            color: Colors.formControl,
            containerStyle: {minWidth: verticalScale(290)},
            labelStyle: {color: Colors.formAccent, fontSize: verticalScale(12), fontWeight: 'bold', paddingLeft: scale(5), paddingRight: scale(5)},
        }));
    }, [Colors.formAccent, Colors.formControl]);

    const clearFormData = (showToast = true) => {
        dispatch(resetForm({formName: 'skill'}));
        dispatch(resetForm({formName: 'hit'}));
        dispatch(resetForm({formName: 'damage'}));
        dispatch(resetForm({formName: 'effect'}));
        dispatch(resetForm({formName: 'costCruncher'}));
        dispatch(resetForm({formName: 'status'}));
        dispatch(resetForm({formName: 'playSounds'}));
        dispatch(resetForm({formName: 'onlyDiceSounds'}));
        dispatch(resetForm({formName: 'showAnimations'}));
        dispatch(resetForm({formName: 'increaseEntropy'}));
        dispatch(resetForm({formName: 'useFifthEdition'}));
        dispatch(resetForm({formName: 'colorScheme'}));

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
        dispatch(clearStatistics({db}));

        if (showToast) {
            common.toast('Statistical data has been cleared', 'success');
        }
    };

    const clearAll = () => {
        dispatch(clearApplicationSettings({db}));

        clearFormData(false);
        _clearCharacterData(false);
        clearHeroData(false);
        clearStatisticsData(false);

        common.toast('Everything has been cleared', 'success');
    };

    const toggle = ({key, value}) => {
        dispatch(toggleSetting({db, key, value}));
    };

    if (common.isEmptyObject(settings)) {
        return (
            <>
                <Header />
                <ActivityIndicator size="large" color={Colors.formAccent} style={{flex: 1, justifyContent: 'center', alignItems: 'center'}} />
            </>
        );
    }

    return (
        <>
            <Header />
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
                            onValueChange={() => toggle({key: 'useFifthEdition', value: !settings.useFifthEdition})}
                            color="#3da0ff"
                            minimumTrackTintColor={Colors.formAccent}
                            maximumTrackTintColor={Colors.secondaryForm}
                            thumbColor={Colors.formControl}
                            trackColor={{false: Colors.switchGutter, true: Colors.formAccent}}
                            ios_backgroundColor={Colors.switchGutter}
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
                            onValueChange={() => toggle({key: 'showAnimations', value: !settings.showAnimations})}
                            color="#3da0ff"
                            minimumTrackTintColor={Colors.formAccent}
                            maximumTrackTintColor={Colors.secondaryForm}
                            thumbColor={Colors.formControl}
                            trackColor={{false: Colors.switchGutter, true: Colors.formAccent}}
                            ios_backgroundColor={Colors.switchGutter}
                        />
                    </View>
                    <View flexDirection="row" justifyContent="space-between" style={{paddingBottom: verticalScale(10)}}>
                        <View>
                            <Text style={styles.boldGrey}>Increase roll entropy?</Text>
                        </View>
                        <Switch
                            value={settings.increaseEntropy}
                            onValueChange={() => toggle({key: 'increaseEntropy', value: !settings.increaseEntropy})}
                            color="#3da0ff"
                            minimumTrackTintColor={Colors.formAccent}
                            maximumTrackTintColor={Colors.secondaryForm}
                            thumbColor={Colors.formControl}
                            trackColor={{false: Colors.switchGutter, true: Colors.formAccent}}
                            ios_backgroundColor={Colors.switchGutter}
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
                            onValueChange={() => toggle({key: 'playSounds', value: !settings.playSounds})}
                            color="#3da0ff"
                            minimumTrackTintColor={Colors.formAccent}
                            maximumTrackTintColor={Colors.secondaryForm}
                            thumbColor={Colors.formControl}
                            trackColor={{false: Colors.switchGutter, true: Colors.formAccent}}
                            ios_backgroundColor={Colors.switchGutter}
                        />
                    </View>
                    <View flexDirection="row" justifyContent="space-between" style={{paddingBottom: verticalScale(10)}}>
                        <View>
                            <Text style={styles.boldGrey}>Play dice sounds only?</Text>
                        </View>
                        <Switch
                            value={settings.onlyDiceSounds}
                            onValueChange={() => toggle({key: 'onlyDiceSounds', value: !settings.onlyDiceSounds})}
                            color="#3da0ff"
                            minimumTrackTintColor={Colors.formAccent}
                            maximumTrackTintColor={Colors.secondaryForm}
                            thumbColor={Colors.formControl}
                            trackColor={{false: Colors.switchGutter, true: Colors.formAccent}}
                            ios_backgroundColor={Colors.switchGutter}
                            disabled={!settings.playSounds}
                        />
                    </View>
                </View>
                <Heading text="Color Theme" />
                <View style={{paddingHorizontal: scale(10), paddingBottom: verticalScale(20)}}>
                    <RadioButtonsGroup
                        flex={1}
                        color={Colors.formControl}
                        radioButtons={themeRadioButtons}
                        onPress={(val) => {
                            setSelectedTheme(val);

                            toggle({key: 'colorScheme', value: val});
                        }}
                        selectedId={selectedTheme}
                    />
                </View>
                <Heading text="Cache" />
                <View paddingHorizontal={scale(10)}>
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
        </>
    );
};
