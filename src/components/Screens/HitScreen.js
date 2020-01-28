import React, { Component }  from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { BackHandler, Platform, StyleSheet, View, Switch, Alert, TouchableHighlight } from 'react-native';
import { Container, Content, Button, Text, Tabs, Tab, TabHeading, ScrollableTab, Icon } from 'native-base';
import RNShake from 'react-native-shake';
import { NavigationEvents } from 'react-navigation';
import { ScaledSheet, scale, verticalScale } from 'react-native-size-matters';
import Slider from '../Slider/Slider';
import Header from '../Header/Header';
import { dieRoller } from '../../lib/DieRoller';
import { common } from '../../lib/Common';
import styles from '../../Styles';
import hitLocations from '../../../public/hitLocations.json';
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

class HitScreen extends Component {
    static propTypes = {
        navigation: PropTypes.object.isRequired,
        hitForm: PropTypes.object.isRequired,
        updateFormValue: PropTypes.func.isRequired,
    }

    constructor(props) {
        super(props);

        this.updateFormValue = this._updateFormValue.bind(this);
        this.roll = this._roll.bind(this);
        this.setLocation = this._setLocation.bind(this);
    }

    onDidFocus() {
        this.backHandler = BackHandler.addEventListener('hardwareBackPress', () => {
            this.props.navigation.navigate('Home');

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
        this.props.navigation.navigate('Result', {from: 'Hit', result: dieRoller.rollToHit(this.props.hitForm.ocv, this.props.hitForm.numberOfRolls, this.props.hitForm.isAutofire, this.props.hitForm.targetDcv)});
    }

    _updateFormValue(key, value) {
        if (key === 'numberOfRolls') {
            value = parseInt(value, 10);
        }

        this.props.updateFormValue('hit', key, value);
    }

    _setLocation(location) {
        if (this.props.hitForm.selectedLocation === location) {
            location = -1;
        }

        this.setState({selectedLocation: location});
    }

    _renderDcvSlider() {
        if (this.props.hitForm.isAutofire) {
            return (
                <Slider
                    label="Target DCV/DMCV:"
                    value={this.props.hitForm.targetDcv}
                    step={1}
                    min={-30}
                    max={30}
                    onValueChange={this.updateFormValue}
                    valueKey="targetDcv"
                />
            );
        }

        return null;
    }

    _renderLocationDetails() {
        if (this.props.hitForm.selectedLocation === -1) {
            return null;
        }

        return (
            <View>
                <Text style={[styles.grey, styles.subHeading]}>Damage Multipliers</Text>
                <View style={{flex: 1, alignItems: 'center', justifyContent: 'center'}}>
                    <View style={{flex: 1, flexDirection: 'row', alignSelf: 'center', paddingBottom: verticalScale(10)}}>
                        <View style={{flex: 1, alignSelf: 'stretch'}}><Text style={styles.boldGrey}>STUNx</Text></View>
                        <View style={{flex: 1, alignSelf: 'stretch'}}><Text style={styles.boldGrey}>NSTUN</Text></View>
                        <View style={{flex: 1, alignSelf: 'stretch'}}><Text style={styles.boldGrey}>BODYx</Text></View>
                    </View>
                    <View style={{flex: 1, flexDirection: 'row', alignSelf: 'center', paddingBottom: verticalScale(10)}}>
                        <View style={{flex: 1, alignSelf: 'stretch'}}><Text style={styles.boldGrey}>x{hitLocations[this.props.hitForm.selectedLocation].stunX}</Text></View>
                        <View style={{flex: 1, alignSelf: 'stretch'}}><Text style={styles.boldGrey}>x{hitLocations[this.props.hitForm.selectedLocation].nStun}</Text></View>
                        <View style={{flex: 1, alignSelf: 'stretch'}}><Text style={styles.boldGrey}>x{hitLocations[this.props.hitForm.selectedLocation].bodyX}</Text></View>
                    </View>
                </View>
            </View>
        );
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
                <Header navigation={this.props.navigation} backScreen='Home' />
                <Content scrollEnable={false}>
                    <Tabs locked={true} tabBarUnderlineStyle={styles.tabBarUnderline} renderTabBar={()=> <ScrollableTab style={styles.scrollableTab} />}>
                        <Tab tabStyle={styles.tabHeading} activeTabStyle={styles.activeTabStyle} activeTextStyle={styles.activeTextStyle} heading={this._renderTabHeading('Roll To Hit')}>
                            <View style={[styles.tabContent, {paddingHorizontal: scale(10)}]}>
                                <Slider
                                    label="Total OCV/OMCV:"
                                    value={this.props.hitForm.ocv}
                                    step={1}
                                    min={-30}
                                    max={30}
                                    onValueChange={this.updateFormValue}
                                    valueKey="ocv"
                                />
                                <Slider
                                    label="Rolls:"
                                    value={this.props.hitForm.numberOfRolls}
                                    step={1}
                                    min={1}
                                    max={20}
                                    onValueChange={this.updateFormValue}
                                    valueKey="numberOfRolls"
                                />
                                <View style={[localStyles.titleContainer, localStyles.checkContainer]}>
                                    <Text style={styles.grey}>Is this an autofire attack?</Text>
                                    <View style={{paddingRight: scale(10)}}>
                                        <Switch
                                            value={this.props.hitForm.isAutofire}
                                            onValueChange={() => this.updateFormValue('isAutofire', !this.props.hitForm.isAutofire)}
                                            color="#3da0ff"
                                            minimumTrackTintColor="#14354d"
                                            maximumTrackTintColor="#14354d"
                                            thumbTintColor="#14354d"
                                            onTintColor="#01121E"
                                        />
                                    </View>
                                </View>
                                {this._renderDcvSlider()}
                                <Button block style={styles.button}  onPress={this.roll}>
                                    <Text uppercase={false}>Roll</Text>
                                </Button>
                            </View>
                        </Tab>
                        <Tab tabStyle={styles.tabHeading} activeTabStyle={styles.activeTabStyle} activeTextStyle={styles.activeTextStyle} heading={this._renderTabHeading('Range Mods')}>
                            <View style={[styles.tabContent, {paddingHorizontal: scale(10)}]}>
                                <View>
                                    <View style={{flex: 1, flexDirection: 'row', alignSelf: 'stretch', paddingVertical: 5}}>
                                        <View style={{flex: 1, alignSelf: 'stretch'}}><Text style={[styles.boldGrey, {textDecorationLine: 'underline'}]}>Range (M)</Text></View>
                                        <View style={{flex: 1, alignSelf: 'stretch'}}><Text style={[styles.boldGrey, {textDecorationLine: 'underline'}]}>RMOD</Text></View>
                                    </View>
                                    <View style={{flex: 1, flexDirection: 'row', alignSelf: 'stretch', paddingVertical: verticalScale(5)}}>
                                        <View style={{flex: 1, alignSelf: 'stretch'}}>
                                            <Text style={styles.grey}>0-8</Text>
                                        </View>
                                        <View style={{flex: 1, alignSelf: 'stretch'}}>
                                            <Text style={styles.grey}>0</Text>
                                        </View>
                                    </View>
                                    <View style={{flex: 1, flexDirection: 'row', alignSelf: 'stretch', paddingVertical: verticalScale(5)}}>
                                        <View style={{flex: 1, alignSelf: 'stretch'}}>
                                            <Text style={styles.grey}>9-16</Text>
                                        </View>
                                        <View style={{flex: 1, alignSelf: 'stretch'}}>
                                            <Text style={styles.grey}>-2</Text>
                                        </View>
                                    </View>
                                    <View style={{flex: 1, flexDirection: 'row', alignSelf: 'stretch', paddingVertical: verticalScale(5)}}>
                                        <View style={{flex: 1, alignSelf: 'stretch'}}>
                                            <Text style={styles.grey}>17-32</Text>
                                        </View>
                                        <View style={{flex: 1, alignSelf: 'stretch'}}>
                                            <Text style={styles.grey}>-4</Text>
                                        </View>
                                    </View>
                                    <View style={{flex: 1, flexDirection: 'row', alignSelf: 'stretch', paddingVertical: verticalScale(5)}}>
                                        <View style={{flex: 1, alignSelf: 'stretch'}}>
                                            <Text style={styles.grey}>33-64</Text>
                                        </View>
                                        <View style={{flex: 1, alignSelf: 'stretch'}}>
                                            <Text style={styles.grey}>-6</Text>
                                        </View>
                                    </View>
                                    <View style={{flex: 1, flexDirection: 'row', alignSelf: 'stretch', paddingVertical: verticalScale(5)}}>
                                        <View style={{flex: 1, alignSelf: 'stretch'}}>
                                            <Text style={styles.grey}>65-128</Text>
                                        </View>
                                        <View style={{flex: 1, alignSelf: 'stretch'}}>
                                            <Text style={styles.grey}>-8</Text>
                                        </View>
                                    </View>
                                    <View style={{flex: 1, flexDirection: 'row', alignSelf: 'stretch', paddingVertical: verticalScale(5)}}>
                                        <View style={{flex: 1, alignSelf: 'stretch'}}>
                                            <Text style={styles.grey}>129-250</Text>
                                        </View>
                                        <View style={{flex: 1, alignSelf: 'stretch'}}>
                                            <Text style={styles.grey}>-10</Text>
                                        </View>
                                    </View>
                                </View>
                            </View>
                        </Tab>
                        <Tab tabStyle={styles.tabHeading} activeTabStyle={styles.activeTabStyle} activeTextStyle={styles.activeTextStyle} heading={this._renderTabHeading('Hit Locations')}>
                            <View style={[styles.tabContent, {paddingHorizontal: scale(10)}]}>
                                <View style={{flex: 1, alignItems: 'center', justifyContent: 'center'}}>
                                    <View style={{flex: 1, flexDirection: 'row', alignSelf: 'stretch', paddingVertical: verticalScale(5)}}>
                                        <View style={{flex: 1, alignSelf: 'stretch'}}><Text style={[styles.boldGrey, {textDecorationLine: 'underline'}]}>Location</Text></View>
                                        <View style={{flex: 1, alignSelf: 'stretch'}}><Text style={[styles.boldGrey, {textDecorationLine: 'underline'}]}>Roll</Text></View>
                                        <View style={{flex: 1, alignSelf: 'stretch'}}><Text style={[styles.boldGrey, {textDecorationLine: 'underline'}]}>Hit</Text></View>
                                        <View style={{flex: 1, alignSelf: 'stretch'}}><Text style={[styles.boldGrey, {textDecorationLine: 'underline'}]}>Damage</Text></View>
                                    </View>
                                    {hitLocations.map((hitLocation, index) => {
                                        let stars = [];

                                        for (let i = 0; i < hitLocation.stunX; i++) {
                                            stars.push(<Icon key={'star-' + index + '-' + i} name="md-star" style={[styles.grey, {fontSize: verticalScale(14)}]} />);
                                        }

                                        return (
                                            <TouchableHighlight key={'hit-location-' + index} style={{flex: 1, flexDirection: 'row', alignSelf: 'stretch'}} underlayColor="#3da0ff" onPress={() => this.setLocation(index)}>
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
                                                        {stars.map((star, index) => {
                                                            return star;
                                                        })}
                                                    </View>
                                                </View>
                                            </TouchableHighlight>
                                        );
                                    })}
                                </View>
                                {this._renderLocationDetails()}
                            </View>
                        </Tab>
                        <Tab tabStyle={styles.tabHeading} activeTabStyle={styles.activeTabStyle} activeTextStyle={styles.activeTextStyle} heading={this._renderTabHeading('Targeted Shots')}>
                            <View style={[styles.tabContent, {paddingHorizontal: scale(10)}]}>
                                <View>
                                    <View style={{flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: verticalScale(5)}}>
                                        <View style={{flex: 1, flexDirection: 'row', alignSelf: 'stretch'}}>
                                            <View style={{flex: 1, alignSelf: 'stretch'}}><Text style={[styles.boldGrey, {textDecorationLine: 'underline'}]}>Targeted Shot</Text></View>
                                            <View style={{flex: 1, alignSelf: 'stretch'}}><Text style={[styles.boldGrey, {textDecorationLine: 'underline'}]}>Hit</Text></View>
                                            <View style={{flex: 1, alignSelf: 'stretch'}}><Text style={[styles.boldGrey, {textDecorationLine: 'underline'}]}>Location</Text></View>
                                        </View>
                                        <View style={{flex: 1, flexDirection: 'row', alignSelf: 'stretch', paddingVertical: verticalScale(5)}}>
                                            <View style={{flex: 1, alignSelf: 'stretch'}}>
                                                <Text style={styles.grey}>Head Shot</Text>
                                            </View>
                                            <View style={{flex: 1, alignSelf: 'stretch'}}>
                                                <Text style={styles.grey}>-4</Text>
                                            </View>
                                            <View style={{flex: 1, alignSelf: 'stretch'}}>
                                                <Text style={styles.grey}>1d6+3</Text>
                                            </View>
                                        </View>
                                        <View style={{flex: 1, flexDirection: 'row', alignSelf: 'stretch', paddingVertical: verticalScale(5)}}>
                                            <View style={{flex: 1, alignSelf: 'stretch'}}>
                                                <Text style={styles.grey}>High Shot</Text>
                                            </View>
                                            <View style={{flex: 1, alignSelf: 'stretch'}}>
                                                <Text style={styles.grey}>-2</Text>
                                            </View>
                                            <View style={{flex: 1, alignSelf: 'stretch'}}>
                                                <Text style={styles.grey}>2d6+1</Text>
                                            </View>
                                        </View>
                                        <View style={{flex: 1, flexDirection: 'row', alignSelf: 'stretch', paddingVertical: verticalScale(5)}}>
                                            <View style={{flex: 1, alignSelf: 'stretch'}}>
                                                <Text style={styles.grey}>Low Shot</Text>
                                            </View>
                                            <View style={{flex: 1, alignSelf: 'stretch'}}>
                                                <Text style={styles.grey}>-2</Text>
                                            </View>
                                            <View style={{flex: 1, alignSelf: 'stretch'}}>
                                                <Text style={styles.grey}>2d6+7 (19=foot)</Text>
                                            </View>
                                        </View>
                                        <View style={{flex: 1, flexDirection: 'row', alignSelf: 'stretch', paddingVertical: verticalScale(5)}}>
                                            <View style={{flex: 1, alignSelf: 'stretch'}}>
                                                <Text style={styles.grey}>Leg Shot</Text>
                                            </View>
                                            <View style={{flex: 1, alignSelf: 'stretch'}}>
                                                <Text style={styles.grey}>-4</Text>
                                            </View>
                                            <View style={{flex: 1, alignSelf: 'stretch'}}>
                                                <Text style={styles.grey}>1d6+12</Text>
                                            </View>
                                        </View>
                                    </View>
                                </View>
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
        paddingTop: '10@vs',
    },
    checkContainer: {
        paddingBottom: '20@vs',
    },
});

const mapStateToProps = state => {
    return {
        hitForm: state.forms.hit,
    };
};

const mapDispatchToProps = {
    updateFormValue,
};

export default connect(mapStateToProps, mapDispatchToProps)(HitScreen);
