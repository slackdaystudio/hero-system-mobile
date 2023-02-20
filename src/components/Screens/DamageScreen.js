import React, {Component} from 'react';
import PropTypes from 'prop-types';
import {connect} from 'react-redux';
import {Platform, View, Switch} from 'react-native';
import {Container, Content, Button, Text, Tabs, Tab, TabHeading, DefaultTabBar} from 'native-base';
import DropDownPicker from 'react-native-dropdown-picker';
import RNShake from 'react-native-shake';
import {ScaledSheet, scale, verticalScale} from 'react-native-size-matters';
import Slider from '../Slider/Slider';
import Header from '../Header/Header';
import {dieRoller, KILLING_DAMAGE, NORMAL_DAMAGE, PARTIAL_DIE_PLUS_ONE, PARTIAL_DIE_HALF, PARTIAL_DIE_MINUS_ONE} from '../../lib/DieRoller';
import styles from '../../Styles';
import moves from '../../../public/moves.json';
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

class DamageScreen extends Component {
    static propTypes = {
        navigation: PropTypes.object.isRequired,
        damageForm: PropTypes.object.isRequired,
        updateFormValue: PropTypes.func.isRequired,
    };

    constructor(props) {
        super(props);

        this.state = {
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

        this.setValue = this._setValue.bind(this);
    }

    componentDidMount() {
        this._unsubscribe = this.props.navigation.addListener('focus', () => {
            RNShake.addListener(() => {
                this.roll();
            });
        });
    }

    componentWillUnmount() {
        this._unsubscribe();
    }

    static getDerivedStateFromProps(props, state) {
        if (props.damageForm === undefined || state.damage === undefined) {
            return null;
        }

        if (props.damageForm.partialDie !== state.damageForm.partialDie) {
            return {
                value: props.damageForm.partialDie,
            };
        }

        return null;
    }

    _setValue(callback) {
        this.setState((state) => ({
            value: callback(state.value),
        }));
    }

    _roll() {
        this.props.navigation.navigate('Result', {from: 'Damage', result: dieRoller.rollDamage(this.props.damageForm)});
    }

    _updateFormValue(key, value) {
        if (key === 'killingToggled') {
            this.props.updateFormValue('damage', 'killingToggled', value);
            this.props.updateFormValue('damage', 'damageType', value ? KILLING_DAMAGE : NORMAL_DAMAGE);
        } else {
            value = ['dice', 'stunMultiplier', 'fadeRate'].includes(key) ? parseInt(value, 10) : value;

            this.props.updateFormValue('damage', key, value);
        }
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

    _renderTabHeading(headingText) {
        return (
            <TabHeading style={styles.tabHeading} activeTextStyle={styles.activeTextStyle}>
                <Text style={styles.tabStyle}>{headingText}</Text>
            </TabHeading>
        );
    }

    _renderTabBar(props) {
        props.tabStyle = Object.create(props.tabStyle);

        return <DefaultTabBar {...props} />;
    }

    render() {
        return (
            <Container style={styles.container}>
                <Header navigation={this.props.navigation} hasTabs={true} />
                <Tabs locked={true} tabBarUnderlineStyle={styles.tabBarUnderline} tabContainerStyle={styles.scrollableTab} renderTabBar={this._renderTabBar}>
                    <Tab
                        tabStyle={styles.tabHeading}
                        activeTabStyle={styles.activeTabStyle}
                        activeTextStyle={styles.activeTextStyle}
                        heading={this._renderTabHeading('Roll For Damage')}
                    >
                        <Content scrollEnable={false}>
                            <View style={[styles.tabContent, {paddingHorizontal: scale(10)}]}>
                                <View>
                                    <Slider
                                        label="Dice:"
                                        value={this.props.damageForm.dice}
                                        step={1}
                                        min={0}
                                        max={50}
                                        onValueChange={this.updateFormValue}
                                        valueKey="dice"
                                    />
                                    <DropDownPicker
                                        theme="DARK"
                                        listMode="MODAL"
                                        open={this.state.open}
                                        value={this.state.value}
                                        items={this.state.items}
                                        setOpen={(open) => this.setState({open})}
                                        setValue={this.setValue}
                                    />
                                    <View style={{paddingBottom: scale(30)}} />
                                    <View style={[localStyles.titleContainer, localStyles.checkContainer]}>
                                        <Text style={styles.grey}>Is this a killing attack?</Text>
                                        <View style={{paddingRight: scale(10)}}>
                                            <Switch
                                                value={this.props.damageForm.killingToggled}
                                                onValueChange={() => this.updateFormValue('killingToggled', !this.props.damageForm.killingToggled)}
                                                color="#3da0ff"
                                                minimumTrackTintColor="#14354d"
                                                maximumTrackTintColor="#14354d"
                                                thumbColor="#14354d"
                                                trackColor={{false: '#000', true: '#3d5478'}}
                                                ios_backgroundColor="#3d5478"
                                            />
                                        </View>
                                    </View>
                                    {this._renderStunMultiplier()}
                                    <View style={[localStyles.titleContainer, localStyles.checkContainer]}>
                                        <Text style={styles.grey}>Is this an explosion?</Text>
                                        <View style={{paddingRight: scale(10)}}>
                                            <Switch
                                                value={this.props.damageForm.isExplosion}
                                                onValueChange={() => this.updateFormValue('isExplosion', !this.props.damageForm.isExplosion)}
                                                minimumTrackTintColor="#14354d"
                                                maximumTrackTintColor="#14354d"
                                                thumbColor="#14354d"
                                                trackColor={{false: '#000', true: '#3d5478'}}
                                                ios_backgroundColor="#3d5478"
                                            />
                                        </View>
                                    </View>
                                    {this._renderFadeRate()}
                                    <View style={[localStyles.titleContainer, localStyles.checkContainer]}>
                                        <Text style={styles.grey}>Use hit locations?</Text>
                                        <View style={{paddingRight: scale(10)}}>
                                            <Switch
                                                value={this.props.damageForm.useHitLocations}
                                                onValueChange={() => this.updateFormValue('useHitLocations', !this.props.damageForm.useHitLocations)}
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
                                                onValueChange={() => this.updateFormValue('isMartialManeuver', !this.props.damageForm.isMartialManeuver)}
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
                                                onValueChange={() => this.updateFormValue('isTargetFlying', !this.props.damageForm.isTargetFlying)}
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
                                                onValueChange={() => this.updateFormValue('isTargetInZeroG', !this.props.damageForm.isTargetInZeroG)}
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
                                                onValueChange={() => this.updateFormValue('isTargetUnderwater', !this.props.damageForm.isTargetUnderwater)}
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
                                                onValueChange={() => this.updateFormValue('rollWithPunch', !this.props.damageForm.rollWithPunch)}
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
                                                onValueChange={() => this.updateFormValue('isUsingClinging', !this.props.damageForm.isUsingClinging)}
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
                        </Content>
                    </Tab>
                    <Tab
                        tabStyle={styles.tabHeading}
                        activeTabStyle={styles.activeTabStyle}
                        activeTextStyle={styles.activeTextStyle}
                        heading={this._renderTabHeading('Maneuvers')}
                    >
                        <Content>
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
                        </Content>
                    </Tab>
                </Tabs>
            </Container>
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
