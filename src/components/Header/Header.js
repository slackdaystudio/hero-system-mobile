import React, {Component} from 'react';
import PropTypes from 'prop-types';
import {BackHandler, Platform, View, Image, TouchableHighlight, StatusBar} from 'react-native';
import {ScaledSheet, scale, verticalScale} from 'react-native-size-matters';
import {Icon} from '../Icon/Icon';

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

export default class Header extends Component {
    static propTypes = {
        navigation: PropTypes.object.isRequired,
        hasTabs: PropTypes.bool,
        backScreen: PropTypes.string,
    };

    _onBackButtonPress() {
        if (this.props.backScreen === EXIT_APP) {
            BackHandler.exitApp();

            return true;
        }

        if (this.props.backScreen === null || this.props.backScreen === undefined) {
            this.props.navigation.goBack();

            return true;
        }

        this.props.navigation.navigate(this.props.backScreen);
    }

    render() {
        return (
            <View flex={1} style={{maxHeight: verticalScale(Platform.OS === 'ios' ? 85 : 55)}}>
                <StatusBar backgroundColor="#1b1d1f" barStyle="light-content" />
                <View style={{flex: 1, flexDirection: 'row', justifyContent: 'center', alignItems: 'center'}}>
                    <View style={{flex: 1}}>
                        <Icon name="chevron-left" style={{fontSize: verticalScale(18), color: 'white'}} onPress={() => this._onBackButtonPress()} />
                    </View>
                    <View style={{flex: 4}}>
                        <View style={localStyles.logo}>
                            <TouchableHighlight underlayColor="#000" onPress={() => this.props.navigation.navigate('Home')}>
                                <Image style={{height: scale(60), width: scale(138)}} source={require('../../../public/hero_mobile_logo.png')} />
                            </TouchableHighlight>
                        </View>
                    </View>
                    <View style={{flex: 1}}>
                        <Icon
                            name="bars"
                            style={{fontSize: verticalScale(24), color: 'white', paddingBottom: Platform.OS === 'ios' ? verticalScale(30) : 0}}
                            onPress={() => this.props.navigation.toggleDrawer()}
                        />
                    </View>
                </View>
            </View>
        );
    }
}

const localStyles = ScaledSheet.create({
    header: {
        backgroundColor: '#000',
        height: Platform.OS === 'ios' ? '75@vs' : '60@vs',
    },
    logo: {
        alignSelf: 'center',
    },
});
