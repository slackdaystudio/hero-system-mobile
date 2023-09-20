import React, {useState} from 'react';
import PropTypes from 'prop-types';
import {useDispatch, useSelector} from 'react-redux';
import {ImageBackground, Dimensions, Platform, View, Switch} from 'react-native';
import {Button, Text} from 'native-base';
import {TabView} from 'react-native-tab-view';
import DropDownPicker from 'react-native-dropdown-picker';
import {ScaledSheet, scale, verticalScale} from 'react-native-size-matters';
import {RouteBuilder, Tab} from '../Tab/Tab';
import Slider from '../Slider/Slider';
import Header from '../Header/Header';
import {dieRoller, KILLING_DAMAGE, NORMAL_DAMAGE, PARTIAL_DIE_PLUS_ONE, PARTIAL_DIE_HALF, PARTIAL_DIE_MINUS_ONE} from '../../lib/DieRoller';
import {updateFormValue} from '../../reducers/forms';
import moves from '../../../public/moves.json';
import styles from '../../Styles';

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

const DamageRoute = ({damageForm, picker, setOpen, setValue, setItems, updateForm, renderFadeRate, renderStunMultiplier, roll}) => {
    const tab = (
        <View style={[styles.tabContent, {paddingHorizontal: scale(10)}]}>
            <ImageBackground source={require('../../../public/background.png')} style={{flex: 1, flexDirection: 'column'}} imageStyle={{resizeMode: 'repeat'}}>
                <View>
                    <Slider
                        label="Dice:"
                        value={parseInt(damageForm.dice, 10)}
                        step={1}
                        min={0}
                        max={50}
                        onValueChange={(value) => updateForm('dice', value)}
                    />
                    <DropDownPicker
                        theme="DARK"
                        listMode="MODAL"
                        open={picker.open}
                        value={picker.value}
                        items={picker.items}
                        setOpen={setOpen}
                        setValue={setValue}
                        setItems={setItems}
                        onChangeValue={(val) => updateForm('partialDie', picker.value)}
                    />
                    <View style={{paddingBottom: scale(30)}} />
                    <View style={[localStyles.titleContainer, localStyles.checkContainer]}>
                        <Text style={styles.grey}>Is this a killing attack?</Text>
                        <View style={{paddingRight: scale(10)}}>
                            <Switch
                                value={damageForm.killingToggled}
                                onValueChange={() => updateForm('killingToggled', !damageForm.killingToggled)}
                                color="#3da0ff"
                                minimumTrackTintColor="#14354d"
                                maximumTrackTintColor="#14354d"
                                thumbColor="#14354d"
                                trackColor={{false: '#000', true: '#3d5478'}}
                                ios_backgroundColor="#3d5478"
                            />
                        </View>
                    </View>
                    {renderStunMultiplier()}
                    <View style={[localStyles.titleContainer, localStyles.checkContainer]}>
                        <Text style={styles.grey}>Is this an explosion?</Text>
                        <View style={{paddingRight: scale(10)}}>
                            <Switch
                                value={damageForm.isExplosion}
                                onValueChange={() => updateForm('isExplosion', !damageForm.isExplosion)}
                                minimumTrackTintColor="#14354d"
                                maximumTrackTintColor="#14354d"
                                thumbColor="#14354d"
                                trackColor={{false: '#000', true: '#3d5478'}}
                                ios_backgroundColor="#3d5478"
                            />
                        </View>
                    </View>
                    {renderFadeRate()}
                    <View style={[localStyles.titleContainer, localStyles.checkContainer]}>
                        <Text style={styles.grey}>Use hit locations?</Text>
                        <View style={{paddingRight: scale(10)}}>
                            <Switch
                                value={damageForm.useHitLocations}
                                onValueChange={() => updateForm('useHitLocations', !damageForm.useHitLocations)}
                                minimumTrackTintColor="#14354d"
                                maximumTrackTintColor="#14354d"
                                thumbColor="#14354d"
                                trackColor={{false: '#000', true: '#3d5478'}}
                                ios_backgroundColor="#3d5478"
                            />
                        </View>
                    </View>
                    <View style={[localStyles.titleContainer, localStyles.checkContainer]}>
                        <Text style={styles.grey}>Attack is a martial maneuver?</Text>
                        <View style={{paddingRight: scale(10)}}>
                            <Switch
                                value={damageForm.isMartialManeuver}
                                onValueChange={() => updateForm('isMartialManeuver', !damageForm.isMartialManeuver)}
                                minimumTrackTintColor="#14354d"
                                maximumTrackTintColor="#14354d"
                                thumbColor="#14354d"
                                trackColor={{false: '#000', true: '#3d5478'}}
                                ios_backgroundColor="#3d5478"
                            />
                        </View>
                    </View>
                    <View style={[localStyles.titleContainer, localStyles.checkContainer]}>
                        <Text style={styles.grey}>Target is in the air?</Text>
                        <View style={{paddingRight: scale(10)}}>
                            <Switch
                                value={damageForm.isTargetFlying}
                                onValueChange={() => updateForm('isTargetFlying', !damageForm.isTargetFlying)}
                                minimumTrackTintColor="#14354d"
                                maximumTrackTintColor="#14354d"
                                thumbColor="#14354d"
                                trackColor={{false: '#000', true: '#3d5478'}}
                                ios_backgroundColor="#3d5478"
                            />
                        </View>
                    </View>
                    <View style={[localStyles.titleContainer, localStyles.checkContainer]}>
                        <Text style={styles.grey}>Target is in zero gravity?</Text>
                        <View style={{paddingRight: scale(10)}}>
                            <Switch
                                value={damageForm.isTargetInZeroG}
                                onValueChange={() => updateForm('isTargetInZeroG', !damageForm.isTargetInZeroG)}
                                minimumTrackTintColor="#14354d"
                                maximumTrackTintColor="#14354d"
                                thumbColor="#14354d"
                                trackColor={{false: '#000', true: '#3d5478'}}
                                ios_backgroundColor="#3d5478"
                            />
                        </View>
                    </View>
                    <View style={[localStyles.titleContainer, localStyles.checkContainer]}>
                        <Text style={styles.grey}>Target is underwater?</Text>
                        <View style={{paddingRight: scale(10)}}>
                            <Switch
                                value={damageForm.isTargetUnderwater}
                                onValueChange={() => updateForm('isTargetUnderwater', !damageForm.isTargetUnderwater)}
                                minimumTrackTintColor="#14354d"
                                maximumTrackTintColor="#14354d"
                                thumbColor="#14354d"
                                trackColor={{false: '#000', true: '#3d5478'}}
                                ios_backgroundColor="#3d5478"
                            />
                        </View>
                    </View>
                    <View style={[localStyles.titleContainer, localStyles.checkContainer]}>
                        <Text style={styles.grey}>Target rolled with a punch?</Text>
                        <View style={{paddingRight: scale(10)}}>
                            <Switch
                                value={damageForm.rollWithPunch}
                                onValueChange={() => updateForm('rollWithPunch', !damageForm.rollWithPunch)}
                                minimumTrackTintColor="#14354d"
                                maximumTrackTintColor="#14354d"
                                thumbColor="#14354d"
                                trackColor={{false: '#000', true: '#3d5478'}}
                                ios_backgroundColor="#3d5478"
                            />
                        </View>
                    </View>
                    <View style={[localStyles.titleContainer, localStyles.checkContainer]}>
                        <Text style={styles.grey}>Target is using clinging?</Text>
                        <View style={{paddingRight: scale(10)}}>
                            <Switch
                                value={damageForm.isUsingClinging}
                                onValueChange={() => updateForm('isUsingClinging', !damageForm.isUsingClinging)}
                                minimumTrackTintColor="#14354d"
                                maximumTrackTintColor="#14354d"
                                thumbColor="#14354d"
                                trackColor={{false: '#000', true: '#3d5478'}}
                                ios_backgroundColor="#3d5478"
                            />
                        </View>
                    </View>
                    <View style={{paddingBottom: 30}} />
                    <Button block style={styles.button} onPress={roll}>
                        <Text uppercase={false}>Roll</Text>
                    </Button>
                </View>
                <View style={{paddingBottom: 30}} />
            </ImageBackground>
        </View>
    );

    return RouteBuilder('Damage', tab, false);
};

const ManeuversRoute = ({}) => {
    const tab = (
        <View style={[styles.tabContent, {paddingBottom: scale(20), paddingHorizontal: scale(10)}]}>
            <ImageBackground source={require('../../../public/background.png')} style={{flex: 1, flexDirection: 'column'}} imageStyle={{resizeMode: 'repeat'}}>
                <View style={{flex: 1, flexDirection: 'row', alignSelf: 'stretch', paddingVertical: verticalScale(5)}}>
                    <View style={{flex: 1, alignSelf: 'stretch'}}>
                        <Text style={[styles.boldGrey, {textDecorationLine: 'underline'}]}>Move</Text>
                    </View>
                    <View style={{flex: 1, alignSelf: 'stretch'}}>
                        <Text style={[styles.boldGrey, {textDecorationLine: 'underline'}]}>Phase</Text>
                    </View>
                    <View style={{flex: 1, alignSelf: 'stretch'}}>
                        <Text style={[styles.boldGrey, {textDecorationLine: 'underline'}]}>OCV</Text>
                    </View>
                    <View style={{flex: 1, alignSelf: 'stretch'}}>
                        <Text style={[styles.boldGrey, {textDecorationLine: 'underline'}]}>DCV</Text>
                    </View>
                </View>
                {moves.map((move, index) => {
                    return (
                        <View key={'move-' + index}>
                            <View style={{flex: 1, flexDirection: 'row', alignSelf: 'stretch', paddingTop: verticalScale(5)}}>
                                <View style={{flex: 1, alignSelf: 'stretch'}}>
                                    <Text style={styles.grey}>{move.name}</Text>
                                </View>
                                <View style={{flex: 1, alignSelf: 'stretch'}}>
                                    <Text style={styles.grey}>{move.phase}</Text>
                                </View>
                                <View style={{flex: 1, alignSelf: 'stretch'}}>
                                    <Text style={styles.grey}>{move.ocv}</Text>
                                </View>
                                <View style={{flex: 1, alignSelf: 'stretch'}}>
                                    <Text style={styles.grey}>{move.dcv}</Text>
                                </View>
                            </View>
                            <View
                                style={{
                                    flex: 1,
                                    flexDirection: 'row',
                                    justifyContent: 'flex-start',
                                    alignSelf: 'flex-start',
                                    paddingBottom: verticalScale(5),
                                }}
                            >
                                <View style={{flex: 1, alignSelf: 'stretch', borderBottomWidth: 1, borderColor: '#D0D1D3'}}>
                                    <Text style={styles.grey} />
                                </View>
                                <View style={{flex: 3, justifyContent: 'flex-start', borderBottomWidth: 1, borderColor: '#D0D1D3'}}>
                                    <Text style={[styles.grey, {fontStyle: 'italic'}]}>{move.effect}</Text>
                                </View>
                            </View>
                        </View>
                    );
                })}
            </ImageBackground>
        </View>
    );

    return RouteBuilder('Maneuvers', tab, false);
};

export const DamageScreen = ({navigation}) => {
    const dispatch = useDispatch();

    const damageForm = useSelector((state) => state.forms.damage);

    const [open, setOpen] = useState(false);

    const [value, setValue] = useState(null);

    const [items, setItems] = useState([
        {label: 'No partial die', value: 0},
        {label: '+1 pip', value: PARTIAL_DIE_PLUS_ONE},
        {label: '+½ die', value: PARTIAL_DIE_HALF},
        {label: '-1 pip', value: PARTIAL_DIE_MINUS_ONE},
    ]);

    const [index, setIndex] = useState(0);

    const routes = [
        {key: 'damage', title: 'Damage'},
        {key: 'maneuvers', title: 'Maneuvers'},
    ];

    const renderScene = () => {
        switch (index) {
            case 0:
                return (
                    <DamageRoute
                        damageForm={damageForm}
                        picker={{
                            open,
                            value,
                            items,
                        }}
                        setOpen={setOpen}
                        setValue={setValue}
                        setItems={setItems}
                        updateForm={_updateFormValue}
                        renderFadeRate={renderFadeRate}
                        renderStunMultiplier={renderStunMultiplier}
                        roll={roll}
                    />
                );
            case 1:
                return <ManeuversRoute />;
            default:
                return null;
        }
    };

    const roll = () => {
        navigation.navigate('Result', {from: 'Damage', result: dieRoller.rollDamage(damageForm)});
    };

    const _updateFormValue = (key, val) => {
        val = ['dice', 'stunMultiplier', 'fadeRate'].includes(key) ? parseInt(val, 10) : val;

        if (key === 'killingToggled') {
            dispatch(updateFormValue({formName: 'damage', key: 'killingToggled', value: val}));
            dispatch(updateFormValue({formName: 'damage', key: 'damageType', value: val ? KILLING_DAMAGE : NORMAL_DAMAGE}));
        } else {
            dispatch(updateFormValue({formName: 'damage', key, value: val}));
        }
    };

    const renderFadeRate = () => {
        if (damageForm.isExplosion) {
            return <Slider label="Fade Rate:" value={damageForm.fadeRate} step={1} min={1} max={10} onValueChange={_updateFormValue} valueKey="fadeRate" />;
        }

        return null;
    };

    const renderStunMultiplier = () => {
        if (damageForm.killingToggled) {
            return (
                <Slider
                    label="+/- Stun Multiplier:"
                    value={damageForm.stunMultiplier}
                    step={1}
                    min={-10}
                    max={10}
                    onValueChange={_updateFormValue}
                    valueKey="stunMultiplier"
                />
            );
        }

        return null;
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

DamageScreen.propTypes = {
    navigation: PropTypes.object.isRequired,
};

const localStyles = ScaledSheet.create({
    titleContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingTop: '5@vs',
    },
    checkContainer: {
        paddingBottom: '5@vs',
    },
    picker: {
        color: '#fff',
    },
    list: {
        paddingBottom: '10@vs',
    },
    grey: {
        ...Platform.select({
            android: {
                color: '#D0D1D3',
            },
        }),
    },
});
