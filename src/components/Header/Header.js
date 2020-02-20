import React, { Component, Fragment }  from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { BackHandler, Platform, StyleSheet, View, Image, TouchableHighlight, StatusBar } from 'react-native';
import { Button, Text, Header, Left, Right, Body, Icon } from 'native-base';
import { ScaledSheet, scale, verticalScale } from 'react-native-size-matters';
import Pulse from 'react-native-pulse';
import { common } from '../../lib/Common';

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

export const EXIT_APP = '0';

class MyHeader extends Component {
    static propTypes = {
        navigation: PropTypes.object.isRequired,
        hasTabs: PropTypes.bool,
        groupPlayMode: PropTypes.number,
        groupPlayUsername: PropTypes.string,
        groupPlayActivePlayer: PropTypes.string.isRequired,
        backScreen: PropTypes.string,
    }

    _onBackButtonPress() {
        if (this.props.backScreen === EXIT_APP) {
            BackHandler.exitApp();

            return true;
        }

        this.props.navigation.navigate(this.props.backScreen);
    }

    _renderBackButton() {
        if (this.props.backScreen === null || this.props.backScreen === undefined) {
            return null;
        }

        return (
            <Button transparent underlayColor="#000" onPress={() => this._onBackButtonPress()}>
                <Icon type='FontAwesome' name="chevron-left" style={{fontSize: verticalScale(18), color: 'white', paddingBottom: Platform.OS === 'ios' ? verticalScale(40) : 0}} />
            </Button>
        );
    }

    _renderActivePlayerIndicator(isActivePlayer) {
        if (isActivePlayer) {
            return (
                <View style={{flex: 0.75}}>
                    <Icon
                        name="check-circle"
                        type='FontAwesome'
                        style={{alignSelf: 'center', fontSize: verticalScale(16), color: 'white', paddingBottom: Platform.OS === 'ios' ? verticalScale(50) : 0}}
                        onPress={() => this.props.navigation.navigate('GroupPlay')}
                    />
                    <Pulse color='#2efc0f' numPulses={1} diameter={40} speed={30} duration={5000} />
                </View>
            );
        }

        return null;
    }

    _renderGroupPlayStatus() {
        if (this.props.groupPlayMode === null || this.props.groupPlayMode === undefined) {
            return <View style={{flex: 1}} />;
        }

        let isActivePlayer = this.props.groupPlayUsername === this.props.groupPlayActivePlayer;

        return (
            <Fragment>
                <View style={{flex: (isActivePlayer ? 1.25 : 0.75)}}>
                    <Icon
                        name="wifi"
                        style={{alignSelf: 'flex-end', fontSize: verticalScale(16), color: 'white', paddingBottom: Platform.OS === 'ios' ? verticalScale(50) : 0}}
                        onPress={() => this.props.navigation.navigate('GroupPlay')}
                    />
                </View>
                {this._renderActivePlayerIndicator(isActivePlayer)}
            </Fragment>
        );
    }

    render() {
        return (
            <View>
                <Header hasTabs={this.props.hasTabs || false} style={localStyles.header}>
                    <View style={{flex: 1, flexDirection: 'row', justifyContent: 'center', alignItems: 'center'}}>
                        <View style={{flex: 1}}>
                            {this._renderBackButton()}
                        </View>
                        <View style={{flex: 1}} />
                        <View style={{flex: 2.2}}>
                            <View style={localStyles.logo}>
                                <TouchableHighlight underlayColor="#000" onPress={() => this.props.navigation.navigate('Home')}>
                                    <Image style={{height: scale(60), width: scale(138)}} source={require('../../../public/hero_mobile_logo.png')} />
                                </TouchableHighlight>
                            </View>
                        </View>
                        <View style={{flex: 1, flexDirection: 'row', alignItems: 'center'}}>
                            {this._renderGroupPlayStatus()}
                        </View>
                        <View style={{flex: 1}}>
                            <Button transparent underlayColor="#000" onPress={() => this.props.navigation.toggleDrawer()}>
                                <Icon name="menu" style={{fontSize: verticalScale(24), color: 'white', paddingBottom: Platform.OS === 'ios' ? verticalScale(50) : 0}} />
                            </Button>
                        </View>
                    </View>
                </Header>
                <StatusBar backgroundColor="#000" barStyle="light-content" />
            </View>
        );
    }
}

const localStyles = ScaledSheet.create({
    header: {
        backgroundColor: '#000',
        height: Platform.OS === 'ios' ? common.isIPad() ? '75@vs' : '50@vs' : '60@vs',
    },
    logo: {
        alignSelf: 'center',
        ...Platform.select({
            ios: {
                paddingBottom: '20@vs',
            },
        }),
    },
});

const mapStateToProps = state => {
    return {
        groupPlayUsername: state.groupPlay.username,
        groupPlayMode: state.groupPlay.mode,
        groupPlayActivePlayer: state.groupPlay.activePlayer,
    };
};

const mapDispatchToProps = {};

export default connect(mapStateToProps, mapDispatchToProps)(MyHeader);
