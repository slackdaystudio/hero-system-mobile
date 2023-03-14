import React, {Component} from 'react';
import PropTypes from 'prop-types';
import {connect} from 'react-redux';
import {Dimensions, Platform, View, Switch} from 'react-native';
import {Button, Text} from 'native-base';
import {TabView} from 'react-native-tab-view';
import DropDownPicker from 'react-native-dropdown-picker';
import {ScaledSheet, scale, verticalScale} from 'react-native-size-matters';
import {RouteBuilder, Tab} from '../Tab/Tab';
import Slider from '../Slider/Slider';
import Header from '../Header/Header';
import {dieRoller, KILLING_DAMAGE, NORMAL_DAMAGE, PARTIAL_DIE_PLUS_ONE, PARTIAL_DIE_HALF, PARTIAL_DIE_MINUS_ONE} from '../../lib/DieRoller';
import {common as libCommon} from '../../lib/Common';
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

class DamageScreen extends Component {
    static propTypes = {
        navigation: PropTypes.object.isRequired,
        damageForm: PropTypes.object.isRequired,
        updateFormValue: PropTypes.func.isRequired,
    };

    constructor(props) {
        super(props);

        this.state = {
            index: 0,
            routes: [
                {key: 'damage', title: 'Damage'},
                {key: 'maneuvers', title: 'Maneuvers'},
            ],
            open: false,
            value: props.damageForm === undefined ? 0 : props.damageForm.partialDie,
            items: [
                {label: 'No partial die', value: 0},
                {label: '+1 pip', value: PARTIAL_DIE_PLUS_ONE},
                {label: '+½ die', value: PARTIAL_DIE_HALF},
                {label: '-1 pip', value: PARTIAL_DIE_MINUS_ONE},
            ],
        };

        this.updateFormValue = this._updateFormValue.bind(this);
        this.roll = this._roll.bind(this);
        this.setOpen = this._setOpen.bind(this);
        this.setValue = this._setValue.bind(this);
        this.setIndex = this._setIndex.bind(this);
        this.renderStunMultiplier = this._renderStunMultiplier.bind(this);
        this.renderFadeRate = this._renderFadeRate.bind(this);
        this.renderScene = this._renderScene.bind(this);
    }

    componentDidUpdate(prevProps) {
        if (!libCommon.isEmptyObject(this.props.damageForm)) {
            if (libCommon.isEmptyObject(prevProps.damageForm) || this.props.damageForm.partialDie !== prevProps.damageForm.partialDie) {
                this.setState((state) => ({...state, value: this.props.damageForm.partialDie}));
            }
        }
    }

    DamageRoute() {
        const tab = (
            <View style={[styles.tabContent, {paddingHorizontal: scale(10)}]}>
                <View>
                    <Slider
                        label="Dice:"
                        value={parseInt(this.props.damageForm.dice, 10)}
                        step={1}
                        min={0}
                        max={50}
                        onValueChange={(value) => this.props.updateFormValue({formName: 'damage', key: 'dice', value})}
                    />
                    <DropDownPicker
                        theme="DARK"
                        listMode="MODAL"
                        open={this.state.open}
                        value={this.state.value}
                        items={this.state.items}
                        setOpen={this.setOpen}
                        setValue={this.setValue}
                    />
                    <View style={{paddingBottom: scale(30)}} />
                    <View style={[localStyles.titleContainer, localStyles.checkContainer]}>
                        <Text style={styles.grey}>Is this a killing attack?</Text>
                        <View style={{paddingRight: scale(10)}}>
                            <Switch
                                value={this.props.damageForm.killingToggled}
                                onValueChange={() =>
                                    this.props.updateFormValue({formName: 'damage', key: 'killingToggled', value: !this.props.damageForm.killingToggled})
                                }
                                color="#3da0ff"
                                minimumTrackTintColor="#14354d"
                                maximumTrackTintColor="#14354d"
                                thumbColor="#14354d"
                                trackColor={{false: '#000', true: '#3d5478'}}
                                ios_backgroundColor="#3d5478"
                            />
                        </View>
                    </View>
                    {this.renderStunMultiplier()}
                    <View style={[localStyles.titleContainer, localStyles.checkContainer]}>
                        <Text style={styles.grey}>Is this an explosion?</Text>
                        <View style={{paddingRight: scale(10)}}>
                            <Switch
                                value={this.props.damageForm.isExplosion}
                                onValueChange={() =>
                                    this.props.updateFormValue({formName: 'damage', key: 'isExplosion', value: !this.props.damageForm.isExplosion})
                                }
                                minimumTrackTintColor="#14354d"
                                maximumTrackTintColor="#14354d"
                                thumbColor="#14354d"
                                trackColor={{false: '#000', true: '#3d5478'}}
                                ios_backgroundColor="#3d5478"
                            />
                        </View>
                    </View>
                    {this.renderFadeRate()}
                    <View style={[localStyles.titleContainer, localStyles.checkContainer]}>
                        <Text style={styles.grey}>Use hit locations?</Text>
                        <View style={{paddingRight: scale(10)}}>
                            <Switch
                                value={this.props.damageForm.useHitLocations}
                                onValueChange={() =>
                                    this.props.updateFormValue({formName: 'damage', key: 'useHitLocations', value: !this.props.damageForm.useHitLocations})
                                }
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
                                value={this.props.damageForm.isMartialManeuver}
                                onValueChange={() =>
                                    this.props.updateFormValue({formName: 'damage', key: 'isMartialManeuver', value: !this.props.damageForm.isMartialManeuver})
                                }
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
                                value={this.props.damageForm.isTargetFlying}
                                onValueChange={() =>
                                    this.props.updateFormValue({formName: 'damage', key: 'isTargetFlying', value: !this.props.damageForm.isTargetFlying})
                                }
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
                                value={this.props.damageForm.isTargetInZeroG}
                                onValueChange={() =>
                                    this.props.updateFormValue({formName: 'damage', key: 'isTargetInZeroG', value: !this.props.damageForm.isTargetInZeroG})
                                }
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
                                value={this.props.damageForm.isTargetUnderwater}
                                onValueChange={() =>
                                    this.props.updateFormValue({
                                        formName: 'damage',
                                        key: 'isTargetUnderwater',
                                        value: !this.props.damageForm.isTargetUnderwater,
                                    })
                                }
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
                                value={this.props.damageForm.rollWithPunch}
                                onValueChange={() =>
                                    this.props.updateFormValue({formName: 'damage', key: 'rollWithPunch', value: !this.props.damageForm.rollWithPunch})
                                }
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
                                value={this.props.damageForm.isUsingClinging}
                                onValueChange={() =>
                                    this.props.updateFormValue({formName: 'damage', key: 'isUsingClinging', value: !this.props.damageForm.isUsingClinging})
                                }
                                minimumTrackTintColor="#14354d"
                                maximumTrackTintColor="#14354d"
                                thumbColor="#14354d"
                                trackColor={{false: '#000', true: '#3d5478'}}
                                ios_backgroundColor="#3d5478"
                            />
                        </View>
                    </View>
                    <View style={{paddingBottom: 30}} />
                    <Button block style={styles.button} onPress={this.roll}>
                        <Text uppercase={false}>Roll</Text>
                    </Button>
                </View>
                <View style={{paddingBottom: 30}} />
            </View>
        );

        return RouteBuilder('Damage', tab, false);
    }

    ManeuversRoute() {
        const tab = (
            <View style={[styles.tabContent, {paddingBottom: scale(20), paddingHorizontal: scale(10)}]}>
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
            </View>
        );

        return RouteBuilder('Maneuvers', tab, false);
    }

    _renderScene() {
        switch (this.state.index) {
            case 0:
                return this.DamageRoute();
            case 1:
                return this.ManeuversRoute();
            default:
                return null;
        }
    }

    _setOpen(open) {
        this.setState((state) => ({
            ...state,
            open: open,
        }));
    }

    _setValue(callback) {
        this.setState((state) => {
            const newState = {...state};

            newState.value = callback(state.value);

            this.props.updateFormValue({formName: 'damage', key: 'partialDie', value: newState.value});

            return state;
        });
    }

    _setIndex(index) {
        this.setState((state) => ({
            ...state,
            index: index,
        }));
    }

    _roll() {
        this.props.navigation.navigate('Result', {from: 'Damage', result: dieRoller.rollDamage(this.props.damageForm)});
    }

    _updateFormValue(key, value) {
        if (key === 'killingToggled') {
            this.props.updateFormValue({formName: 'damage', key: 'killingToggled', value});
            this.props.updateFormValue({formName: 'damage', key: 'damageType', valye: value ? KILLING_DAMAGE : NORMAL_DAMAGE});
        } else {
            value = ['dice', 'stunMultiplier', 'fadeRate'].includes(key) ? parseInt(value, 10) : value;
        }

        this.props.updateFormValue({formName: 'damage', key, value});
    }

    _renderFadeRate() {
        if (this.props.damageForm.isExplosion) {
            return (
                <Slider
                    label="Fade Rate:"
                    value={this.props.damageForm.fadeRate}
                    step={1}
                    min={1}
                    max={10}
                    onValueChange={this.updateFormValue}
                    valueKey="fadeRate"
                />
            );
        }

        return null;
    }

    _renderStunMultiplier() {
        if (this.props.damageForm.killingToggled) {
            return (
                <Slider
                    label="+/- Stun Multiplier:"
                    value={this.props.damageForm.stunMultiplier}
                    step={1}
                    min={-10}
                    max={10}
                    onValueChange={this.updateFormValue}
                    valueKey="stunMultiplier"
                />
            );
        }

        return null;
    }

    render() {
        return (
            <>
                <Header navigation={this.props.navigation} hasTabs={true} />
                <TabView
                    navigationState={{index: this.state.index, routes: this.state.routes, setIndex: this.setIndex}}
                    renderScene={this.renderScene}
                    renderTabBar={Tab}
                    onIndexChange={this.setIndex}
                    initialLayout={{height: windowHeight, width: windowWidth}}
                />
            </>
        );
    }
}

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

const mapStateToProps = (state) => {
    return {
        damageForm: state.forms.damage,
    };
};

const mapDispatchToProps = {
    updateFormValue,
};

export default connect(mapStateToProps, mapDispatchToProps)(DamageScreen);
