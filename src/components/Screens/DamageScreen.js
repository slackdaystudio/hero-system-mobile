import React, { Component }  from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { BackHandler, Platform, View, Switch} from 'react-native';
import { Container, Content, Button, Text, Tabs, Tab, TabHeading, Picker, Item, ScrollableTab } from 'native-base';
import RNShake from 'react-native-shake';
import { NavigationEvents } from 'react-navigation';
import { ScaledSheet, scale, verticalScale } from 'react-native-size-matters';
import Slider from '../Slider/Slider';
import Header from '../Header/Header';
import { dieRoller, KILLING_DAMAGE, NORMAL_DAMAGE, PARTIAL_DIE_PLUS_ONE, PARTIAL_DIE_HALF, PARTIAL_DIE_MINUS_ONE } from '../../lib/DieRoller';
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

        this.updateFormValue = this._updateFormValue.bind(this);
        this.roll = this._roll.bind(this);
    }

    onDidFocus() {
        this.backHandler = BackHandler.addEventListener('hardwareBackPress', () => {
            this.props.navigation.navigate(this._getBackScreen());

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

    _getBackScreen() {
        let backScreen = 'Home';

        if (this.props.navigation.state.params !== undefined && this.props.navigation.state.params.hasOwnProperty('from')) {
            backScreen = this.props.navigation.state.params.from;
        }

        return backScreen;
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
                <Text style={styles.tabStyle}>
                    {headingText}
                </Text>
            </TabHeading>
        );
    }

    render() {
        return (
            <Container style={styles.container}>
                <NavigationEvents
                    onDidFocus={(payload) => this.onDidFocus()}
                    onDidBlur={(payload) => this.onDidBlur()}
                />
                <Header navigation={this.props.navigation} hasTabs={true} backScreen={this._getBackScreen()} />
                <Content scrollEnable={false}>
                    <Tabs locked={true} tabBarUnderlineStyle={styles.tabBarUnderline} renderTabBar={()=> <ScrollableTab style={styles.scrollableTab} />}>
                        <Tab tabStyle={styles.tabHeading} activeTabStyle={styles.activeTabStyle} activeTextStyle={styles.activeTextStyle} heading={this._renderTabHeading('Roll For Damage')}>
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
                                    <Picker
                                        inlinelabel
                                        label="Partial Die"
                                        style={{width: undefined, color: '#FFFFFF'}}
                                        textStyle={{fontSize: verticalScale(16), color: '#FFFFFF'}}
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
                                                trackColor={{false: '#000', true: '#01121E'}}
                                                ios_backgroundColor="#01121E"
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
                                                trackColor={{false: '#000', true: '#01121E'}}
                                                ios_backgroundColor="#01121E"
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
                                                trackColor={{false: '#000', true: '#01121E'}}
                                                ios_backgroundColor="#01121E"
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
                                                trackColor={{false: '#000', true: '#01121E'}}
                                                ios_backgroundColor="#01121E"
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
                                                trackColor={{false: '#000', true: '#01121E'}}
                                                ios_backgroundColor="#01121E"
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
                                                trackColor={{false: '#000', true: '#01121E'}}
                                                ios_backgroundColor="#01121E"
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
                                                trackColor={{false: '#000', true: '#01121E'}}
                                                ios_backgroundColor="#01121E"
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
                                                trackColor={{false: '#000', true: '#01121E'}}
                                                ios_backgroundColor="#01121E"
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
                                                trackColor={{false: '#000', true: '#01121E'}}
                                                ios_backgroundColor="#01121E"
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
                        <Tab tabStyle={styles.tabHeading} activeTabStyle={styles.activeTabStyle} activeTextStyle={styles.activeTextStyle} heading={this._renderTabHeading('Maneuvers')}>
                            <View style={[styles.tabContent, {paddingBottom: scale(20), paddingHorizontal: scale(10)}]}>
                                <View style={{flex: 1, flexDirection: 'row', alignSelf: 'stretch', paddingVertical: verticalScale(5)}}>
                                    <View style={{flex: 1, alignSelf: 'stretch'}}><Text style={[styles.boldGrey, {textDecorationLine: 'underline'}]}>Move</Text></View>
                                    <View style={{flex: 1, alignSelf: 'stretch'}}><Text style={[styles.boldGrey, {textDecorationLine: 'underline'}]}>Phase</Text></View>
                                    <View style={{flex: 1, alignSelf: 'stretch'}}><Text style={[styles.boldGrey, {textDecorationLine: 'underline'}]}>OCV</Text></View>
                                    <View style={{flex: 1, alignSelf: 'stretch'}}><Text style={[styles.boldGrey, {textDecorationLine: 'underline'}]}>DCV</Text></View>
                                </View>
                                {moves.map((move, index) => {
                                    return (
                                        <View key={'move-' + index}>
                                            <View style={{flex: 1, flexDirection: 'row', alignSelf: 'stretch', paddingTop: verticalScale(5)}}>
                                                <View style={{flex: 1, alignSelf: 'stretch'}}><Text style={styles.grey}>{move.name}</Text></View>
                                                <View style={{flex: 1, alignSelf: 'stretch'}}><Text style={styles.grey}>{move.phase}</Text></View>
                                                <View style={{flex: 1, alignSelf: 'stretch'}}><Text style={styles.grey}>{move.ocv}</Text></View>
                                                <View style={{flex: 1, alignSelf: 'stretch'}}><Text style={styles.grey}>{move.dcv}</Text></View>
                                            </View>
                                            <View style={{flex: 1, flexDirection: 'row', justifyContent: 'flex-start', alignSelf: 'flex-start', paddingBottom: verticalScale(5)}}>
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

const mapStateToProps = state => {
    return {
        damageForm: state.forms.damage,
    };
};

const mapDispatchToProps = {
    updateFormValue,
};

export default connect(mapStateToProps, mapDispatchToProps)(DamageScreen);
