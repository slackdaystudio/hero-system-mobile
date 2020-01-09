import React, { Component }  from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { BackHandler, Platform, StyleSheet, View, Image, Switch, Alert } from 'react-native';
import { Container, Content, Button, Text, Tabs, Tab, Picker, Item, ScrollableTab } from 'native-base';
import RNShake from 'react-native-shake';
import { NavigationEvents } from 'react-navigation';
import Slider from '../Slider/Slider';
import Header from '../Header/Header';
import { dieRoller, KILLING_DAMAGE, NORMAL_DAMAGE, PARTIAL_DIE_PLUS_ONE, PARTIAL_DIE_HALF, PARTIAL_DIE_MINUS_ONE } from '../../lib/DieRoller';
import { common } from '../../lib/Common';
import styles from '../../Styles';
import moves from '../../../public/moves.json';
import { updateFormValue } from '../../reducers/forms';

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
    }

    constructor(props) {
        super(props);

        this.state = {
            tabsLocked: false,
        };

        this.updateFormValue = this._updateFormValue.bind(this);
        this.toggleTabsLocked = this._toggleTabsLocked.bind(this);
        this.roll = this._roll.bind(this);
    }

    onDidFocus() {
        this.backHandler = BackHandler.addEventListener('hardwareBackPress', () => {
            if (this.props.navigation.state.params === undefined) {
                this.props.navigation.navigate('Home');
            } else {
                this.props.navigation.navigate(this.props.navigation.state.params.from);
            }

            return true;
        });

        RNShake.addEventListener('ShakeEvent', () => {
            this.roll();
        });
    }

    onDidBlur() {
        RNShake.removeEventListener('ShakeEvent');
        this.backHandler.remove();
    }

    _roll() {
        this.props.navigation.navigate('Result', {from: 'Damage', result: dieRoller.rollDamage(this.props.damageForm)});
    }

    _updateFormValue(key, value) {
        if (key === 'killingToggled' && value) {
            this.props.updateFormValue('damage', 'killingToggled', value);
            this.props.updateFormValue('damage', 'damageType', value ? KILLING_DAMAGE : NORMAL_DAMAGE);
        } else {
            value = ['dice', 'stunMultiplier', 'fadeRate'].includes(key) ? parseInt(value) : value;

            this.props.updateFormValue('damage', key, value);
        }
    }

    _toggleTabsLocked(locked) {
        let newState = {...this.state};
        newState.tabsLocked = locked;

        this.setState(newState);
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
                    toggleTabsLocked={this.toggleTabsLocked} />
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
                    toggleTabsLocked={this.toggleTabsLocked} />
            );
        }

        return null;
    }

    render() {
        return (
            <Container style={styles.container}>
                <NavigationEvents
                    onDidFocus={(payload) => this.onDidFocus()}
                    onDidBlur={(payload) => this.onDidBlur()}
                />
                <Header navigation={this.props.navigation} hasTabs={true} />
                <Content scrollEnable={false}>
                    <Tabs locked={this.state.tabsLocked} tabBarUnderlineStyle={styles.tabBarUnderline} renderTabBar={()=> <ScrollableTab style={{backgroundColor: '#000000'}} />}>
                        <Tab tabStyle={styles.tabInactive} activeTabStyle={styles.tabActive} textStyle={styles.grey} activeTextStyle={{color: '#FFF'}} heading="Roll For Damage">
                            <View style={[styles.tabContent, {paddingHorizontal: 10}]}>
                                <View>
                                    <Slider
                                        label="Dice:"
                                        value={this.props.damageForm.dice}
                                        step={1}
                                        min={0}
                                        max={50}
                                        onValueChange={this.updateFormValue}
                                        valueKey="dice"
                                        toggleTabsLocked={this.toggleTabsLocked}
                                    />
                                    <Picker
                                        inlinelabel
                                        label='Partial Die'
                                        style={{width: undefined, color: '#FFFFFF'}}
                                        textStyle={{fontSize: 16, color: '#FFFFFF'}}
                                        iosHeader="Select one"
                                        mode="dropdown"
                                        selectedValue={this.props.damageForm.partialDie}
                                        onValueChange={(value) => this.updateFormValue('partialDie', value)}
                                    >
                                        <Item label="No partial die" value="0" />
                                        <Item label="+1 pip" value={PARTIAL_DIE_PLUS_ONE} />
                                        <Item label="+½ die" value={PARTIAL_DIE_HALF} />
                                        <Item label="-1 pip" value={PARTIAL_DIE_MINUS_ONE} />
                                    </Picker>
                                    <View style={{paddingBottom: 30}} />
                                    <View style={[localStyles.titleContainer, localStyles.checkContainer]}>
                                        <Text style={styles.grey}>Is this a killing attack?</Text>
                                        <View style={{paddingRight: 10}}>
                                            <Switch
                                                value={this.props.damageForm.killingToggled}
                                                onValueChange={() => this.updateFormValue('killingToggled', !this.props.damageForm.killingToggled)}
                                                color="#3da0ff"
                                                minimumTrackTintColor="#14354d"
                                                maximumTrackTintColor="#14354d"
                                                thumbTintColor="#14354d"
                                                onTintColor="#01121E"
                                            />
                                        </View>
                                    </View>
                                    {this._renderStunMultiplier()}
                                    <View style={[localStyles.titleContainer, localStyles.checkContainer]}>
                                        <Text style={styles.grey}>Is this an explosion?</Text>
                                        <View style={{paddingRight: 10}}>
                                            <Switch
                                                value={this.props.damageForm.isExplosion}
                                                onValueChange={() => this.updateFormValue('isExplosion', !this.props.damageForm.isExplosion)}
                                                minimumTrackTintColor="#14354d"
                                                maximumTrackTintColor="#14354d"
                                                thumbTintColor="#14354d"
                                                onTintColor="#01121E"
                                            />
                                        </View>
                                    </View>
                                    {this._renderFadeRate()}
                                    <View style={[localStyles.titleContainer, localStyles.checkContainer]}>
                                        <Text style={styles.grey}>Use hit locations?</Text>
                                        <View style={{paddingRight: 10}}>
                                            <Switch
                                                value={this.props.damageForm.useHitLocations}
                                                onValueChange={() => this.updateFormValue('useHitLocations', !this.props.damageForm.useHitLocations)}
                                                minimumTrackTintColor="#14354d"
                                                maximumTrackTintColor="#14354d"
                                                thumbTintColor="#14354d"
                                                onTintColor="#01121E"
                                            />
                                        </View>
                                    </View>
                                    <View style={[localStyles.titleContainer, localStyles.checkContainer]}>
                                        <Text style={styles.grey}>Attack is a martial maneuver?</Text>
                                        <View style={{paddingRight: 10}}>
                                            <Switch
                                                value={this.props.damageForm.isMartialManeuver}
                                                onValueChange={() => this.updateFormValue('isMartialManeuver', !this.props.damageForm.isMartialManeuver)}
                                                minimumTrackTintColor="#14354d"
                                                maximumTrackTintColor="#14354d"
                                                thumbTintColor="#14354d"
                                                onTintColor="#01121E"
                                            />
                                        </View>
                                    </View>
                                    <View style={[localStyles.titleContainer, localStyles.checkContainer]}>
                                        <Text style={styles.grey}>Target is in the air?</Text>
                                        <View style={{paddingRight: 10}}>
                                            <Switch
                                                value={this.props.damageForm.isTargetFlying}
                                                onValueChange={() => this.updateFormValue('isTargetFlying', !this.props.damageForm.isTargetFlying)}
                                                minimumTrackTintColor="#14354d"
                                                maximumTrackTintColor="#14354d"
                                                thumbTintColor="#14354d"
                                                onTintColor="#01121E"
                                            />
                                        </View>
                                    </View>
                                    <View style={[localStyles.titleContainer, localStyles.checkContainer]}>
                                        <Text style={styles.grey}>Target is in zero gravity?</Text>
                                        <View style={{paddingRight: 10}}>
                                            <Switch
                                                value={this.props.damageForm.isTargetInZeroG}
                                                onValueChange={() => this.updateFormValue('isTargetInZeroG', !this.props.damageForm.isTargetInZeroG)}
                                                minimumTrackTintColor="#14354d"
                                                maximumTrackTintColor="#14354d"
                                                thumbTintColor="#14354d"
                                                onTintColor="#01121E"
                                            />
                                        </View>
                                    </View>
                                    <View style={[localStyles.titleContainer, localStyles.checkContainer]}>
                                        <Text style={styles.grey}>Target is underwater?</Text>
                                        <View style={{paddingRight: 10}}>
                                            <Switch
                                                value={this.props.damageForm.isTargetUnderwater}
                                                onValueChange={() => this.updateFormValue('isTargetUnderwater', !this.props.damageForm.isTargetUnderwater)}
                                                minimumTrackTintColor="#14354d"
                                                maximumTrackTintColor="#14354d"
                                                thumbTintColor="#14354d"
                                                onTintColor="#01121E"
                                            />
                                        </View>
                                    </View>
                                    <View style={[localStyles.titleContainer, localStyles.checkContainer]}>
                                        <Text style={styles.grey}>Target rolled with a punch?</Text>
                                        <View style={{paddingRight: 10}}>
                                            <Switch
                                                value={this.props.damageForm.rollWithPunch}
                                                onValueChange={() => this.updateFormValue('rollWithPunch', !this.props.damageForm.rollWithPunch)}
                                                minimumTrackTintColor="#14354d"
                                                maximumTrackTintColor="#14354d"
                                                thumbTintColor="#14354d"
                                                onTintColor="#01121E"
                                            />
                                        </View>
                                    </View>
                                    <View style={[localStyles.titleContainer, localStyles.checkContainer]}>
                                        <Text style={styles.grey}>Target is using clinging?</Text>
                                        <View style={{paddingRight: 10}}>
                                            <Switch
                                                value={this.props.damageForm.isUsingClinging}
                                                onValueChange={() => this.updateFormValue('isUsingClinging', !this.props.damageForm.isUsingClinging)}
                                                minimumTrackTintColor="#14354d"
                                                maximumTrackTintColor="#14354d"
                                                thumbTintColor="#14354d"
                                                onTintColor="#01121E"
                                            />
                                        </View>
                                    </View>
                                    <View style={{paddingBottom: 30}} />
                                    <Button block style={styles.button}  onPress={this.roll}>
                                        <Text uppercase={false}>Roll</Text>
                                    </Button>
                                </View>
                                <View style={{paddingBottom: 30}} />
                            </View>
                        </Tab>
                        <Tab tabStyle={styles.tabInactive} activeTabStyle={styles.tabActive} textStyle={styles.grey} activeTextStyle={{color: '#FFF'}} heading="Combat Moves">
                            <View style={[styles.tabContent, {paddingBottom: 20, paddingHorizontal: 10}]}>
                                <View style={{flex: 1, flexDirection: 'row', alignSelf: 'stretch', paddingVertical: 5}}>
                                    <View style={{flex: 1, alignSelf: 'stretch'}}><Text style={[styles.boldGrey, {textDecorationLine: 'underline'}]}>Move</Text></View>
                                    <View style={{flex: 1, alignSelf: 'stretch'}}><Text style={[styles.boldGrey, {textDecorationLine: 'underline'}]}>Phase</Text></View>
                                    <View style={{flex: 1, alignSelf: 'stretch'}}><Text style={[styles.boldGrey, {textDecorationLine: 'underline'}]}>OCV</Text></View>
                                    <View style={{flex: 1, alignSelf: 'stretch'}}><Text style={[styles.boldGrey, {textDecorationLine: 'underline'}]}>DCV</Text></View>
                                </View>
                                {moves.map((move, index) => {
                                    return (
                                        <View key={'move-' + index}>
                                            <View style={{flex: 1, flexDirection: 'row', alignSelf: 'stretch', paddingTop: 5}}>
                                                <View style={{flex: 1, alignSelf: 'stretch'}}><Text style={styles.grey}>{move.name}</Text></View>
                                                <View style={{flex: 1, alignSelf: 'stretch'}}><Text style={styles.grey}>{move.phase}</Text></View>
                                                <View style={{flex: 1, alignSelf: 'stretch'}}><Text style={styles.grey}>{move.ocv}</Text></View>
                                                <View style={{flex: 1, alignSelf: 'stretch'}}><Text style={styles.grey}>{move.dcv}</Text></View>
                                            </View>
                                            <View style={{flex: 1, flexDirection: 'row', justifyContent: 'flex-start', alignSelf: 'flex-start', paddingBottom: 5}}>
                                                <View style={{flex: 1, alignSelf: 'stretch', borderBottomWidth: 1, borderColor: '#D0D1D3'}}><Text style={styles.grey} /></View>
                                                <View style={{flex: 3, justifyContent: 'flex-start', borderBottomWidth: 1, borderColor: '#D0D1D3'}}>
                                                    <Text style={[styles.grey, {fontStyle: 'italic'}]}>{move.effect}</Text>
                                                </View>
                                            </View>
                                        </View>
                                    );
                                })}
                            </View>
                        </Tab>
                    </Tabs>
                </Content>
            </Container>
        );
    }
}

const localStyles = StyleSheet.create({
    titleContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingTop: 10,
    },
    checkContainer: {
        paddingBottom: 20,
    },
    picker: {
        color: '#fff',
    },
    list: {
        paddingBottom: 10,
    },
    grey: {
        ...Platform.select({
            android: {
                color: '#D0D1D3',
            },
        }),
    },
});

const mapStateToProps = state => {
    return {
        damageForm: state.forms.damage,
    };
};

const mapDispatchToProps = {
    updateFormValue,
};

export default connect(mapStateToProps, mapDispatchToProps)(DamageScreen);
