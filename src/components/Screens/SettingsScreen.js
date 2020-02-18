import React, { Component }  from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { BackHandler, StyleSheet, View, Switch, Alert } from 'react-native';
import { Container, Content, Button, Text, Toast, List, ListItem, Left, Right, Body, Spinner } from 'native-base';
import { NavigationEvents } from 'react-navigation';
import { scale, verticalScale } from 'react-native-size-matters';
import Header from '../Header/Header';
import Heading from '../Heading/Heading';
import { NORMAL_DAMAGE } from '../../lib/DieRoller';
import { statistics } from '../../lib/Statistics';
import { common } from '../../lib/Common';
import { persistence } from '../../lib/Persistence';
import styles from '../../Styles';
import { resetForm } from '../../reducers/forms';
import { clearCharacterData } from '../../reducers/character';
import { clearRandomHero } from '../../reducers/randomHero';
import { clearApplicationSettings, toggleSetting } from '../../reducers/settings';
import { clearStatistics } from '../../reducers/statistics';

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

class SettingsScreen extends Component {
    static propTypes = {
        navigation: PropTypes.object.isRequired,
        settings: PropTypes.object.isRequired,
        version: PropTypes.string.isRequired,
        groupPlayMode: PropTypes.number,
        resetForm: PropTypes.func.isRequired,
        clearCharacterData: PropTypes.func.isRequired,
        clearRandomHero: PropTypes.func.isRequired,
        clearStatistics: PropTypes.func.isRequired,
        clearApplicationSettings: PropTypes.func.isRequired,
    }

    onDidFocus() {
        this.backHandler = BackHandler.addEventListener('hardwareBackPress', () => {
            this.props.navigation.navigate('Home');

            return true;
        });
    }

    onDidBlur() {
        this.backHandler.remove();
    }

    _clearFormData(showToast = true) {
        this.props.resetForm('skill');
        this.props.resetForm('hit');
        this.props.resetForm('damage');
        this.props.resetForm('effect');
        this.props.resetForm('costCruncher');

        if (showToast) {
            common.toast('Form data has been cleared');
        }
    }

    _clearCharacterData(showToast = true) {
        this.props.clearCharacterData();

        if (showToast) {
            common.toast('Loaded characters have been cleared');
        }
    }

    async _clearHeroData(showToast = true) {
        this.props.clearRandomHero();

        if (showToast) {
            common.toast('H.E.R.O. character has been cleared');
        }
    }

    async _clearStatisticsData(showToast = true) {
        this.props.clearStatistics();

        if (showToast) {
            common.toast('Statistical data has been cleared');
        }
    }

    async _clearAll() {
        await this.props.clearApplicationSettings()
        await this._clearFormData(false);
        await this._clearCharacterData(false);
        await this._clearHeroData(false);
        await this._clearStatisticsData(false);

        common.toast('Everything has been cleared');
    }

    render() {
        return (
            <Container style={styles.container}>
                <NavigationEvents
                    onDidFocus={(payload) => this.onDidFocus()}
                    onDidBlur={(payload) => this.onDidBlur()}
                />
                <Header navigation={this.props.navigation} groupPlayMode={this.props.groupPlayMode} backScreen='Home' />
                <Content style={styles.content}>
                    <Heading text="App Version" />
                    <View style={{paddingLeft: 20, paddingBottom: verticalScale(20), paddingTop: verticalScale(10)}}>
                        <Text style={styles.grey}>
                            <Text style={styles.boldGrey}>HERO System Mobile v</Text>{this.props.version}
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
                                    value={this.props.settings.useFifthEdition}
                                    onValueChange={() => this.props.toggleSetting('useFifthEdition', !this.props.settings.useFifthEdition)}
                                    minimumTrackTintColor='#14354d'
                                    maximumTrackTintColor='#14354d'
                                    thumbColor='#14354d'
                                    trackColor={{false: '#000', true: '#01121E'}}
                                    ios_backgroundColor='#01121E'
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
                                    value={this.props.settings.playSounds}
                                    onValueChange={() => this.props.toggleSetting('playSounds', !this.props.settings.playSounds)}
                                    minimumTrackTintColor='#14354d'
                                    maximumTrackTintColor='#14354d'
                                    thumbColor='#14354d'
                                    trackColor={{false: '#000', true: '#01121E'}}
                                    ios_backgroundColor='#01121E'
                                />
                            </Right>
                        </ListItem>
                        <ListItem noIndent style={{borderBottomWidth: 0}}>
                            <Left>
                                <Text style={styles.boldGrey}>Play dice sounds only?</Text>
                            </Left>
                            <Right>
                                <Switch
                                    value={this.props.settings.onlyDiceSounds}
                                    onValueChange={() => this.props.toggleSetting('onlyDiceSounds', !this.props.settings.onlyDiceSounds)}
                                    minimumTrackTintColor='#14354d'
                                    maximumTrackTintColor='#14354d'
                                    thumbColor='#14354d'
                                    trackColor={{false: '#000', true: '#01121E'}}
                                    ios_backgroundColor='#01121E'
                                    disabled={!this.props.settings.playSounds}
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
                                <Button style={styles.buttonSmall} onPress={() => this._clearFormData()}>
                                    <Text uppercase={false} style={styles.buttonText}>Clear</Text>
                                </Button>
                            </Right>
                        </ListItem>
                        <ListItem noIndent>
                            <Left>
                                <Text style={styles.boldGrey}>Loaded characters</Text>
                            </Left>
                            <Right>
                                <Button style={styles.buttonSmall} onPress={() => this._clearCharacterData()}>
                                    <Text uppercase={false} style={styles.buttonText}>Clear</Text>
                                </Button>
                            </Right>
                        </ListItem>
                        <ListItem noIndent>
                            <Left>
                                <Text style={styles.boldGrey}>H.E.R.O.</Text>
                            </Left>
                            <Right>
                                <Button style={styles.buttonSmall} onPress={() => this._clearHeroData()}>
                                    <Text uppercase={false} style={styles.buttonText}>Clear</Text>
                                </Button>
                            </Right>
                        </ListItem>
                        <ListItem noIndent>
                            <Left>
                                <Text style={styles.boldGrey}>Statistics</Text>
                            </Left>
                            <Right>
                                <Button style={styles.buttonSmall} onPress={() => this._clearStatisticsData()}>
                                    <Text uppercase={false} style={styles.buttonText}>Clear</Text>
                                </Button>
                            </Right>
                        </ListItem>
                    </List>
                    <View style={{paddingTop: verticalScale(20), paddingBottom: verticalScale(20)}}>
                        <Button block style={styles.button} onPress={() => this._clearAll()}>
                            <Text uppercase={false} style={styles.buttonText}>Clear All</Text>
                        </Button>
                    </View>
                </Content>
            </Container>
        );
    }
}

const mapStateToProps = state => {
    return {
        settings: state.settings,
        version: state.version.version,
        groupPlayMode: state.groupPlay.mode,
    };
};

const mapDispatchToProps = {
    clearApplicationSettings,
    toggleSetting,
    resetForm,
    clearCharacterData,
    clearRandomHero,
    clearStatistics,
};

export default connect(mapStateToProps, mapDispatchToProps)(SettingsScreen);
