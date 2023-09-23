import React from 'react';
import PropTypes from 'prop-types';
import {useDispatch, useSelector} from 'react-redux';
import {View, ImageBackground, Switch} from 'react-native';
import {Container, Button, Text, List, ListItem, Left, Right} from 'native-base';
import {verticalScale} from 'react-native-size-matters';
import Header from '../Header/Header';
import Heading from '../Heading/Heading';
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
            common.toast('Form data has been cleared');
        }
    };

    const _clearCharacterData = (showToast = true) => {
        dispatch(clearAllCharacters());

        if (showToast) {
            common.toast('Loaded characters have been cleared');
        }
    };

    const clearHeroData = (showToast = true) => {
        dispatch(clearRandomHero());

        if (showToast) {
            common.toast('H.E.R.O. character has been cleared');
        }
    };

    const clearStatisticsData = (showToast = true) => {
        dispatch(clearStatistics());

        if (showToast) {
            common.toast('Statistical data has been cleared');
        }
    };

    const clearAll = () => {
        dispatch(clearApplicationSettings());

        clearFormData(false);
        _clearCharacterData(false);
        clearHeroData(false);
        clearStatisticsData(false);

        common.toast('Everything has been cleared');
    };

    return (
        <Container style={styles.container}>
            <ImageBackground source={require('../../../public/background.png')} style={{flex: 1, flexDirection: 'column'}} imageStyle={{resizeMode: 'repeat'}}>
                <Header navigation={navigation} />
                <VirtualizedList>
                    <Heading text="App Version" />
                    <View style={{paddingLeft: 20, paddingBottom: verticalScale(20), paddingTop: verticalScale(10)}}>
                        <Text style={styles.grey}>
                            <Text style={styles.boldGrey}>HERO System Mobile v</Text>
                            {version.version}
                        </Text>
                    </View>
                    <Heading text="Game" />
                    <List>
                        <ListItem noIndent style={{borderBottomWidth: 0}}>
                            <Left>
                                <Text style={styles.boldGrey}>Use 5th Edition rules?</Text>
                            </Left>
                            <Right>
                                <Switch
                                    value={settings.useFifthEdition}
                                    onValueChange={() => dispatch(toggleSetting({key: 'useFifthEdition', value: !settings.useFifthEdition}))}
                                    minimumTrackTintColor="#14354d"
                                    maximumTrackTintColor="#14354d"
                                    thumbColor="#14354d"
                                    trackColor={{false: '#000', true: '#3d5478'}}
                                    ios_backgroundColor="#3d5478"
                                />
                            </Right>
                        </ListItem>
                    </List>
                    <Heading text="Performance" />
                    <List>
                        <ListItem noIndent style={{borderBottomWidth: 0}}>
                            <Left>
                                <Text style={styles.boldGrey}>Play animations?</Text>
                            </Left>
                            <Right>
                                <Switch
                                    value={settings.showAnimations}
                                    onValueChange={() => dispatch(toggleSetting({key: 'showAnimations', value: !settings.showAnimations}))}
                                    minimumTrackTintColor="#14354d"
                                    maximumTrackTintColor="#14354d"
                                    thumbColor="#14354d"
                                    trackColor={{false: '#000', true: '#3d5478'}}
                                    ios_backgroundColor="#3d5478"
                                />
                            </Right>
                        </ListItem>
                        <ListItem noIndent style={{borderBottomWidth: 0}}>
                            <Left>
                                <Text style={styles.boldGrey}>Increase roll entropy?</Text>
                            </Left>
                            <Right>
                                <Switch
                                    value={settings.increaseEntropy}
                                    onValueChange={() => dispatch(toggleSetting({key: 'increaseEntropy', value: !settings.increaseEntropy}))}
                                    minimumTrackTintColor="#14354d"
                                    maximumTrackTintColor="#14354d"
                                    thumbColor="#14354d"
                                    trackColor={{false: '#000', true: '#3d5478'}}
                                    ios_backgroundColor="#3d5478"
                                />
                            </Right>
                        </ListItem>
                    </List>
                    <Heading text="Sound" />
                    <List>
                        <ListItem noIndent>
                            <Left>
                                <Text style={styles.boldGrey}>Play rolling sounds?</Text>
                            </Left>
                            <Right>
                                <Switch
                                    value={settings.playSounds}
                                    onValueChange={() => dispatch(toggleSetting({key: 'playSounds', value: !settings.playSounds}))}
                                    minimumTrackTintColor="#14354d"
                                    maximumTrackTintColor="#14354d"
                                    thumbColor="#14354d"
                                    trackColor={{false: '#000', true: '#3d5478'}}
                                    ios_backgroundColor="#3d5478"
                                />
                            </Right>
                        </ListItem>
                        <ListItem noIndent style={{borderBottomWidth: 0}}>
                            <Left>
                                <Text style={styles.boldGrey}>Play dice sounds only?</Text>
                            </Left>
                            <Right>
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
                            </Right>
                        </ListItem>
                    </List>
                    <Heading text="Cache" />
                    <List>
                        <ListItem noIndent>
                            <Left>
                                <Text style={styles.boldGrey}>Form data</Text>
                            </Left>
                            <Right>
                                <Button style={styles.buttonSmall} onPress={() => clearFormData()}>
                                    <Text uppercase={false} style={styles.buttonText}>
                                        Clear
                                    </Text>
                                </Button>
                            </Right>
                        </ListItem>
                        <ListItem noIndent>
                            <Left>
                                <Text style={styles.boldGrey}>Loaded characters</Text>
                            </Left>
                            <Right>
                                <Button style={styles.buttonSmall} onPress={() => _clearCharacterData()}>
                                    <Text uppercase={false} style={styles.buttonText}>
                                        Clear
                                    </Text>
                                </Button>
                            </Right>
                        </ListItem>
                        <ListItem noIndent>
                            <Left>
                                <Text style={styles.boldGrey}>H.E.R.O.</Text>
                            </Left>
                            <Right>
                                <Button style={styles.buttonSmall} onPress={() => clearHeroData()}>
                                    <Text uppercase={false} style={styles.buttonText}>
                                        Clear
                                    </Text>
                                </Button>
                            </Right>
                        </ListItem>
                        <ListItem noIndent>
                            <Left>
                                <Text style={styles.boldGrey}>Statistics</Text>
                            </Left>
                            <Right>
                                <Button style={styles.buttonSmall} onPress={() => clearStatisticsData()}>
                                    <Text uppercase={false} style={styles.buttonText}>
                                        Clear
                                    </Text>
                                </Button>
                            </Right>
                        </ListItem>
                    </List>
                    <View style={{paddingTop: verticalScale(20), paddingBottom: verticalScale(20)}}>
                        <Button block style={styles.button} onPress={() => clearAll()}>
                            <Text uppercase={false} style={styles.buttonText}>
                                Clear All
                            </Text>
                        </Button>
                    </View>
                </VirtualizedList>
            </ImageBackground>
        </Container>
    );
};

SettingsScreen.propTypes = {
    navigation: PropTypes.object.isRequired,
};
