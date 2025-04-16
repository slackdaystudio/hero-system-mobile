import React, {useState} from 'react';
import PropTypes from 'prop-types';
import {useDispatch, useSelector} from 'react-redux';
import {ImageBackground, Dimensions, Text, Platform, View, Switch as RNSwitch} from 'react-native';
import {TabView} from 'react-native-tab-view';
import DropDownPicker from 'react-native-dropdown-picker';
import {ScaledSheet, scale, verticalScale} from 'react-native-size-matters';
import {RouteBuilder, Tab} from '../Tab/Tab';
import Slider from '../Slider/Slider';
import {Button} from '../Button/Button';
import Header from '../Header/Header';
import {Card} from '../Card/Card';
import {dieRoller, KILLING_DAMAGE, NORMAL_DAMAGE, PARTIAL_DIE_PLUS_ONE, PARTIAL_DIE_HALF, PARTIAL_DIE_MINUS_ONE, PARTIAL_DIE_NONE} from '../../lib/DieRoller';
import {updateFormValue} from '../../reducers/forms';
import moves from '../../../public/moves.json';
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

const ManeuversRoute = ({}) => {
    const tab = (
        <View style={[styles.tabContent, {paddingBottom: scale(20)}]}>
            <ImageBackground source={require('../../../public/background.png')} style={{flex: 1, flexDirection: 'column'}} imageStyle={{resizeMode: 'repeat'}}>
                {moves.map((move, index) => {
                    const heading = <Text style={[styles.grey, {fontSize: verticalScale(18)}]}>{move.name}</Text>;
                    const body = (
                        <>
                            <View style={{flex: 1, flexDirection: 'row', alignSelf: 'stretch', paddingVertical: verticalScale(5)}}>
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
                            <View style={{flex: 1, flexDirection: 'row', alignSelf: 'stretch', paddingVertical: verticalScale(5)}}>
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
                        </>
                    );

                    const footer = (
                        <View
                            style={{
                                flex: 1,
                                flexDirection: 'row',
                                justifyContent: 'flex-start',
                                alignSelf: 'flex-start',
                                paddingBottom: verticalScale(5),
                            }}
                        >
                            <View>
                                <Text style={[styles.grey, {fontStyle: 'italic'}]}>{move.effect}</Text>
                            </View>
                        </View>
                    );

                    return (
                        <View key={'move-' + index}>
                            <Card heading={heading} body={body} footer={footer} />
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

    const [value, setValue] = useState(PARTIAL_DIE_NONE);

    const [items, setItems] = useState([
        {label: 'No partial die', value: PARTIAL_DIE_NONE},
        {label: '+1 pip', value: PARTIAL_DIE_PLUS_ONE},
        {label: '½D6', value: PARTIAL_DIE_HALF},
        {label: '1d6-1', value: PARTIAL_DIE_MINUS_ONE},
    ]);

    const [index, setIndex] = useState(0);

    const routes = [
        {key: 'damage', title: 'Damage'},
        {key: 'maneuvers', title: 'Maneuvers'},
    ];

    const DamageRoute = ({picker, updateForm, renderFadeRate, renderStunMultiplier, roll}) => {
        const tab = (
            <View style={[styles.tabContent, {paddingHorizontal: scale(10)}]}>
                <View>
                    <Slider label="Dice:" value={parseInt(damageForm.dice, 10)} step={1} min={0} max={50} onValueChange={(val) => updateForm('dice', val)} />
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
                        style={{backgroundColor: Colors.formControl}}
                        labelStyle={{fontSize: verticalScale(12), color: Colors.text, paddingLeft: scale(5)}}
                        listItemContainerStyle={{backgroundColor: Colors.background}}
                        selectedItemContainerStyle={{backgroundColor: Colors.formAccent}}
                        modalContentContainerStyle={{backgroundColor: Colors.primary}}
                    />
                    <View style={{paddingBottom: scale(10)}} />
                    <View style={[localStyles.titleContainer, localStyles.checkContainer]}>
                        <Text style={styles.grey}>Is this a killing attack?</Text>
                        <View style={{paddingRight: scale(10)}}>
                            <RNSwitch
                                value={damageForm.killingToggled}
                                onValueChange={() => updateForm('killingToggled', !damageForm.killingToggled)}
                                color="#3da0ff"
                                minimumTrackTintColor={Colors.formAccent}
                                maximumTrackTintColor={Colors.secondaryForm}
                                thumbColor={Colors.formControl}
                                trackColor={{false: Colors.switchGutter, true: Colors.formAccent}}
                                ios_backgroundColor="#3d5478"
                            />
                        </View>
                    </View>
                    {renderStunMultiplier()}
                    <View style={[localStyles.titleContainer, localStyles.checkContainer]}>
                        <Text style={styles.grey}>Is this an explosion?</Text>
                        <View style={{paddingRight: scale(10)}}>
                            <RNSwitch
                                value={damageForm.isExplosion}
                                onValueChange={() => updateForm('isExplosion', !damageForm.isExplosion)}
                                minimumTrackTintColor={Colors.formAccent}
                                maximumTrackTintColor={Colors.secondaryForm}
                                thumbColor={Colors.formControl}
                                trackColor={{false: Colors.switchGutter, true: Colors.formAccent}}
                                ios_backgroundColor="#3d5478"
                            />
                        </View>
                    </View>
                    {renderFadeRate()}
                    <View style={[localStyles.titleContainer, localStyles.checkContainer]}>
                        <Text style={styles.grey}>Use hit locations?</Text>
                        <View style={{paddingRight: scale(10)}}>
                            <RNSwitch
                                value={damageForm.useHitLocations}
                                onValueChange={() => updateForm('useHitLocations', !damageForm.useHitLocations)}
                                minimumTrackTintColor={Colors.formAccent}
                                maximumTrackTintColor={Colors.secondaryForm}
                                thumbColor={Colors.formControl}
                                trackColor={{false: Colors.switchGutter, true: Colors.formAccent}}
                                ios_backgroundColor="#3d5478"
                            />
                        </View>
                    </View>
                    <View style={[localStyles.titleContainer, localStyles.checkContainer]}>
                        <Text style={styles.grey}>Attack is a martial maneuver?</Text>
                        <View style={{paddingRight: scale(10)}}>
                            <RNSwitch
                                value={damageForm.isMartialManeuver}
                                onValueChange={() => updateForm('isMartialManeuver', !damageForm.isMartialManeuver)}
                                minimumTrackTintColor={Colors.formAccent}
                                maximumTrackTintColor={Colors.secondaryForm}
                                thumbColor={Colors.formControl}
                                trackColor={{false: Colors.switchGutter, true: Colors.formAccent}}
                                ios_backgroundColor="#3d5478"
                            />
                        </View>
                    </View>
                    <View style={[localStyles.titleContainer, localStyles.checkContainer]}>
                        <Text style={styles.grey}>Target is in the air?</Text>
                        <View style={{paddingRight: scale(10)}}>
                            <RNSwitch
                                value={damageForm.isTargetFlying}
                                onValueChange={() => updateForm('isTargetFlying', !damageForm.isTargetFlying)}
                                minimumTrackTintColor={Colors.formAccent}
                                maximumTrackTintColor={Colors.secondaryForm}
                                thumbColor={Colors.formControl}
                                trackColor={{false: Colors.switchGutter, true: Colors.formAccent}}
                                ios_backgroundColor="#3d5478"
                            />
                        </View>
                    </View>
                    <View style={[localStyles.titleContainer, localStyles.checkContainer]}>
                        <Text style={styles.grey}>Target is in zero gravity?</Text>
                        <View style={{paddingRight: scale(10)}}>
                            <RNSwitch
                                value={damageForm.isTargetInZeroG}
                                onValueChange={() => updateForm('isTargetInZeroG', !damageForm.isTargetInZeroG)}
                                minimumTrackTintColor={Colors.formAccent}
                                maximumTrackTintColor={Colors.secondaryForm}
                                thumbColor={Colors.formControl}
                                trackColor={{false: Colors.switchGutter, true: Colors.formAccent}}
                                ios_backgroundColor="#3d5478"
                            />
                        </View>
                    </View>
                    <View style={[localStyles.titleContainer, localStyles.checkContainer]}>
                        <Text style={styles.grey}>Target is underwater?</Text>
                        <View style={{paddingRight: scale(10)}}>
                            <RNSwitch
                                value={damageForm.isTargetUnderwater}
                                onValueChange={() => updateForm('isTargetUnderwater', !damageForm.isTargetUnderwater)}
                                minimumTrackTintColor={Colors.formAccent}
                                maximumTrackTintColor={Colors.secondaryForm}
                                thumbColor={Colors.formControl}
                                trackColor={{false: Colors.switchGutter, true: Colors.formAccent}}
                                ios_backgroundColor="#3d5478"
                            />
                        </View>
                    </View>
                    <View style={[localStyles.titleContainer, localStyles.checkContainer]}>
                        <Text style={styles.grey}>Target rolled with a punch?</Text>
                        <View style={{paddingRight: scale(10)}}>
                            <RNSwitch
                                value={damageForm.rollWithPunch}
                                onValueChange={() => updateForm('rollWithPunch', !damageForm.rollWithPunch)}
                                minimumTrackTintColor={Colors.formAccent}
                                maximumTrackTintColor={Colors.secondaryForm}
                                thumbColor={Colors.formControl}
                                trackColor={{false: Colors.switchGutter, true: Colors.formAccent}}
                                ios_backgroundColor="#3d5478"
                            />
                        </View>
                    </View>
                    <View style={[localStyles.titleContainer, localStyles.checkContainer]}>
                        <Text style={styles.grey}>Target is using clinging?</Text>
                        <View style={{paddingRight: scale(10)}}>
                            <RNSwitch
                                value={damageForm.isUsingClinging}
                                onValueChange={() => updateForm('isUsingClinging', !damageForm.isUsingClinging)}
                                minimumTrackTintColor={Colors.formAccent}
                                maximumTrackTintColor={Colors.secondaryForm}
                                thumbColor={Colors.formControl}
                                trackColor={{false: Colors.switchGutter, true: Colors.formAccent}}
                                ios_backgroundColor="#3d5478"
                            />
                        </View>
                    </View>
                    <View style={{paddingBottom: 30}} />
                    <View style={styles.buttonContainer}>
                        <Button solid label="Roll" disabled={damageForm.dice === 0 && picker.value <= PARTIAL_DIE_PLUS_ONE} onPress={roll} />
                    </View>
                </View>
                <View style={{paddingBottom: 30}} />
            </View>
        );

        return RouteBuilder('Damage', tab, false);
    };

    const renderScene = () => {
        switch (index) {
            case 0:
                return (
                    <DamageRoute
                        picker={{
                            open,
                            value,
                            items,
                        }}
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
                style={{backgroundColor: Colors.background}}
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
