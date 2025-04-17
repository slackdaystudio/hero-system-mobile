import React, {useState} from 'react';
import PropTypes from 'prop-types';
import {useSelector, useDispatch} from 'react-redux';
import {ImageBackground, Dimensions, Text, View, Switch, TouchableHighlight, Platform} from 'react-native';
import {ScaledSheet, scale, verticalScale} from 'react-native-size-matters';
import {TabView} from 'react-native-tab-view';
import {Tab, RouteBuilder} from '../Tab/Tab';
import Slider from '../Slider/Slider';
import {Button} from '../Button/Button';
import {Icon} from '../Icon/Icon';
import Header from '../Header/Header';
import {dieRoller} from '../../lib/DieRoller';
import hitLocations from '../../../public/hitLocations.json';
import {updateFormValue} from '../../reducers/forms';
import styles, {Colors} from '../../Styles';

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

const windowWidth = Dimensions.get('window').width;

const windowHeight = Dimensions.get('window').height;

const RollRoute = ({hitForm, updateForm, roll, renderDcvSlider}) => {
    const tab = (
        <View flex={0} flexGrow={1}>
            <View paddingHorizontal={scale(10)}>
                <View paddingHorizontal={scale(Platform.OS === 'ios' ? 10 : 0)}>
                    <Slider label="Total OCV/OMCV:" value={hitForm.ocv} step={1} min={-30} max={30} onValueChange={updateForm} valueKey="ocv" />
                    <Slider label="Rolls:" value={hitForm.numberOfRolls} step={1} min={1} max={20} onValueChange={updateForm} valueKey="numberOfRolls" />
                </View>
                <View style={[localStyles.titleContainer, localStyles.checkContainer]}>
                    <Text style={styles.grey}>Is this an autofire attack?</Text>
                    <View style={{paddingRight: scale(10)}}>
                        <Switch
                            value={hitForm.isAutofire}
                            onValueChange={() => updateForm('isAutofire', !hitForm.isAutofire)}
                            color="#3da0ff"
                            minimumTrackTintColor={Colors.formControl}
                            maximumTrackTintColor={Colors.primary}
                            thumbColor={Colors.formControl}
                            ios_backgroundColor={Colors.switchGutter}
                        />
                    </View>
                </View>
                <View paddingHorizontal={scale(Platform.OS === 'ios' ? 10 : 0)}>{renderDcvSlider()}</View>
                <View style={styles.buttonContainer}>
                    <Button label="Roll" style={styles.button} onPress={roll} />
                </View>
            </View>
        </View>
    );

    return RouteBuilder('Roll To Hit', tab, false);
};

const RangeModsRoute = () => {
    const tab = (
        <View flex={0} flexGrow={1}>
            <ImageBackground source={require('../../../public/background.png')} style={{flex: 1, flexDirection: 'column'}} imageStyle={{resizeMode: 'repeat'}}>
                <View paddingHorizontal={scale(10)} alignItems="flex-start" alignSelf="center">
                    <View flexDirection="row" alignItems="space-evenly" justifyContent="space-between" paddingBottom={verticalScale(10)}>
                        <View flex={0.5}>
                            <Text style={[styles.boldGrey, {textDecorationLine: 'underline'}]}>Range (M)</Text>
                        </View>
                        <View>
                            <Text style={[styles.boldGrey, {textDecorationLine: 'underline'}]}>RMOD</Text>
                        </View>
                    </View>
                    <View flexDirection="row" alignItems="space-evenly" justifyContent="space-between" paddingBottom={verticalScale(10)}>
                        <View flex={0.5}>
                            <Text style={styles.grey}>0-8</Text>
                        </View>
                        <View>
                            <Text style={styles.grey}>0</Text>
                        </View>
                    </View>
                    <View flexDirection="row" alignItems="space-evenly" justifyContent="space-between" paddingBottom={verticalScale(10)}>
                        <View flex={0.5}>
                            <Text style={styles.grey}>9-16</Text>
                        </View>
                        <View>
                            <Text style={styles.grey}>-2</Text>
                        </View>
                    </View>
                    <View flexDirection="row" alignItems="space-evenly" justifyContent="space-between" paddingBottom={verticalScale(10)}>
                        <View flex={0.5}>
                            <Text style={styles.grey}>17-32</Text>
                        </View>
                        <View>
                            <Text style={styles.grey}>-4</Text>
                        </View>
                    </View>
                    <View flexDirection="row" alignItems="space-evenly" justifyContent="space-between" paddingBottom={verticalScale(10)}>
                        <View flex={0.5}>
                            <Text style={styles.grey}>33-64</Text>
                        </View>
                        <View>
                            <Text style={styles.grey}>-6</Text>
                        </View>
                    </View>
                    <View flexDirection="row" alignItems="space-evenly" justifyContent="space-between" paddingBottom={verticalScale(10)}>
                        <View flex={0.5}>
                            <Text style={styles.grey}>65-128</Text>
                        </View>
                        <View>
                            <Text style={styles.grey}>-8</Text>
                        </View>
                    </View>
                    <View flexDirection="row" alignItems="space-evenly" justifyContent="space-between" paddingBottom={verticalScale(10)}>
                        <View flex={0.5}>
                            <Text style={styles.grey}>129-250</Text>
                        </View>
                        <View>
                            <Text style={styles.grey}>-10</Text>
                        </View>
                    </View>
                </View>
            </ImageBackground>
        </View>
    );

    return RouteBuilder('Range Mods', tab, false);
};

const HitLocationsRoute = ({setLocation, renderLocationDetails}) => {
    const tab = (
        <View flex={0} flexGrow={1}>
            <ImageBackground source={require('../../../public/background.png')} style={{flex: 1, flexDirection: 'column'}} imageStyle={{resizeMode: 'repeat'}}>
                <View paddingHorizontal={scale(10)} alignItems="center">
                    <View flexDirection="row" alignItems="space-evenly" justifyContent="space-between" paddingBottom={verticalScale(10)}>
                        <View style={{flex: 1, alignSelf: 'stretch'}}>
                            <Text style={[styles.boldGrey, {textDecorationLine: 'underline'}]}>Location</Text>
                        </View>
                        <View style={{flex: 1, alignSelf: 'stretch'}}>
                            <Text style={[styles.boldGrey, {textDecorationLine: 'underline'}]}>Roll</Text>
                        </View>
                        <View style={{flex: 1, alignSelf: 'stretch'}}>
                            <Text style={[styles.boldGrey, {textDecorationLine: 'underline'}]}>Hit</Text>
                        </View>
                        <View style={{flex: 1, alignSelf: 'stretch'}}>
                            <Text style={[styles.boldGrey, {textDecorationLine: 'underline'}]}>Damage</Text>
                        </View>
                    </View>
                    {hitLocations.map((hitLocation, index) => {
                        let stars = [];

                        for (let i = 0; i < hitLocation.stunX; i++) {
                            stars.push(<Icon solid key={'star-' + index + '-' + i} name="star" style={[styles.grey, {fontSize: verticalScale(14)}]} />);
                        }

                        return (
                            <TouchableHighlight
                                key={'hit-location-' + index}
                                style={{flex: 1, flexDirection: 'row', alignSelf: 'stretch'}}
                                underlayColor="#3da0ff"
                                onPress={() => setLocation(index)}
                            >
                                <View style={{flex: 1, flexDirection: 'row', alignSelf: 'stretch', paddingVertical: verticalScale(5)}}>
                                    <View style={{flex: 1, alignSelf: 'stretch'}}>
                                        <Text style={styles.grey}>{hitLocation.location}</Text>
                                    </View>
                                    <View style={{flex: 1, alignSelf: 'center'}}>
                                        <Text style={styles.grey}>{hitLocation.roll}</Text>
                                    </View>
                                    <View style={{flex: 1, alignSelf: 'stretch'}}>
                                        <Text style={styles.grey}>{hitLocation.penalty}</Text>
                                    </View>
                                    <View style={{flex: 1, flexDirection: 'row', alignSelf: 'stretch'}}>
                                        {stars.map((star) => {
                                            return star;
                                        })}
                                    </View>
                                </View>
                            </TouchableHighlight>
                        );
                    })}
                </View>
                {renderLocationDetails()}
            </ImageBackground>
        </View>
    );

    return RouteBuilder('Hit Locations', tab, false);
};

const TargetedShotsRoute = () => {
    const tab = (
        <View flex={0} flexGrow={1}>
            <ImageBackground source={require('../../../public/background.png')} style={{flex: 1, flexDirection: 'column'}} imageStyle={{resizeMode: 'repeat'}}>
                <View flex={0} justifyContent="center" alignItems="center" alignSelf="center">
                    <View>
                        <View flexDirection="row" justifyContent="center" paddingBottom={verticalScale(10)}>
                            <View width="40%">
                                <Text style={[styles.boldGrey, {textDecorationLine: 'underline'}]}>Targeted Shot</Text>
                            </View>
                            <View width="15%">
                                <Text style={[styles.boldGrey, {textDecorationLine: 'underline'}]}>Hit</Text>
                            </View>
                            <View width="30%">
                                <Text style={[styles.boldGrey, {textDecorationLine: 'underline'}]}>Location</Text>
                            </View>
                        </View>
                        <View flexDirection="row" justifyContent="center" paddingBottom={verticalScale(10)}>
                            <View width="40%">
                                <Text style={styles.grey}>Head Shot</Text>
                            </View>
                            <View width="15%" alignSelf="center">
                                <Text style={styles.grey}>-4</Text>
                            </View>
                            <View width="30%">
                                <Text style={styles.grey}>1d6+3</Text>
                            </View>
                        </View>
                        <View flexDirection="row" justifyContent="center" paddingBottom={verticalScale(10)}>
                            <View width="40%">
                                <Text style={styles.grey}>High Shot</Text>
                            </View>
                            <View width="15%" alignSelf="center">
                                <Text style={styles.grey}>-2</Text>
                            </View>
                            <View width="30%">
                                <Text style={styles.grey}>2d6+1</Text>
                            </View>
                        </View>
                        <View flexDirection="row" justifyContent="center" paddingBottom={verticalScale(10)}>
                            <View width="40%">
                                <Text style={styles.grey}>Low Shot</Text>
                            </View>
                            <View width="15%" alignSelf="center">
                                <Text style={styles.grey}>-2</Text>
                            </View>
                            <View width="30%">
                                <Text style={styles.grey}>2d6+7 (19=foot)</Text>
                            </View>
                        </View>
                        <View flexDirection="row" justifyContent="center" paddingBottom={verticalScale(10)}>
                            <View width="40%">
                                <Text style={styles.grey}>Leg Shot</Text>
                            </View>
                            <View width="15%" alignSelf="center">
                                <Text style={styles.grey}>-4</Text>
                            </View>
                            <View width="30%">
                                <Text style={styles.grey}>1d6+12</Text>
                            </View>
                        </View>
                    </View>
                </View>
            </ImageBackground>
        </View>
    );

    return RouteBuilder('Targeted Shots', tab, false);
};

export const HitScreen = ({navigation}) => {
    const dispatch = useDispatch();

    const hitForm = useSelector((state) => state.forms.hit);

    const [index, setIndex] = useState(0);

    const [location, setLocation] = useState(-1);

    const routes = [
        {key: 'roll', title: 'Roll To Hit'},
        {key: 'range', title: 'Range Mods'},
        {key: 'hit', title: 'Hit Locations'},
        {key: 'targeted', title: 'Targeted Shots'},
    ];

    const roll = () => {
        navigation.navigate('Result', {
            from: 'Hit',
            result: dieRoller.rollToHit(hitForm.ocv, hitForm.numberOfRolls, hitForm.isAutofire, hitForm.targetDcv),
        });
    };

    const _updateFormValue = (key, value) => {
        if (key === 'numberOfRolls') {
            value = parseInt(value, 10);
        }

        dispatch(updateFormValue({formName: 'hit', key, value}));
    };

    const _setLocation = (loc) => {
        if (hitForm.selectedLocation === loc) {
            loc = -1;
        }

        setLocation(loc);
    };

    const renderDcvSlider = () => {
        if (hitForm.isAutofire) {
            return (
                <Slider label="Target DCV/DMCV:" value={hitForm.targetDcv} step={1} min={-30} max={30} onValueChange={_updateFormValue} valueKey="targetDcv" />
            );
        }

        return null;
    };

    const renderLocationDetails = () => {
        if (location === -1) {
            return null;
        }

        return (
            <View>
                <Text style={[styles.grey, styles.subHeading]}>Damage Multipliers</Text>
                <View style={{flex: 1, alignItems: 'center', justifyContent: 'center'}}>
                    <View style={{flex: 1, flexDirection: 'row', alignSelf: 'center', paddingBottom: verticalScale(10)}}>
                        <View style={{flex: 1, alignSelf: 'stretch'}}>
                            <Text style={styles.boldGrey}>STUNx</Text>
                        </View>
                        <View style={{flex: 1, alignSelf: 'stretch'}}>
                            <Text style={styles.boldGrey}>NSTUN</Text>
                        </View>
                        <View style={{flex: 1, alignSelf: 'stretch'}}>
                            <Text style={styles.boldGrey}>BODYx</Text>
                        </View>
                    </View>
                    <View style={{flex: 1, flexDirection: 'row', alignSelf: 'center', paddingBottom: verticalScale(10)}}>
                        <View style={{flex: 1, alignSelf: 'stretch'}}>
                            <Text style={styles.boldGrey}>x{hitLocations[location].stunX}</Text>
                        </View>
                        <View style={{flex: 1, alignSelf: 'stretch'}}>
                            <Text style={styles.boldGrey}>x{hitLocations[location].nStun}</Text>
                        </View>
                        <View style={{flex: 1, alignSelf: 'stretch'}}>
                            <Text style={styles.boldGrey}>x{hitLocations[location].bodyX}</Text>
                        </View>
                    </View>
                </View>
            </View>
        );
    };

    const renderScene = () => {
        switch (index) {
            case 0:
                return <RollRoute hitForm={hitForm} updateForm={_updateFormValue} roll={roll} renderDcvSlider={renderDcvSlider} />;
            case 1:
                return <RangeModsRoute />;
            case 2:
                return <HitLocationsRoute setLocation={_setLocation} renderLocationDetails={renderLocationDetails} />;
            case 3:
                return <TargetedShotsRoute />;
            default:
                return null;
        }
    };

    return (
        <>
            <Header navigation={navigation} hasTabs={true} />
            <TabView
                navigationState={{index, setIndex, routes}}
                renderScene={renderScene}
                renderTabBar={Tab}
                onIndexChange={setIndex}
                initialLayout={{height: windowHeight, width: windowWidth}}
                swipeEnabled={false}
            />
        </>
    );
};

HitScreen.propTypes = {
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
