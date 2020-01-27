import React, { Component }  from 'react';
import PropTypes from 'prop-types';
import { Platform, StyleSheet, View, Image, TouchableHighlight, StatusBar } from 'react-native';
import { Button, Text, Header, Left, Right, Body, Icon } from 'native-base';
import { ScaledSheet, scale, verticalScale } from 'react-native-size-matters';
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

export default class MyHeader extends Component {
    static propTypes = {
        navigation: PropTypes.object.isRequired,
        hasTabs: PropTypes.bool,
        backScreen: PropTypes.string,
    }

    _renderBackButton() {
        if (this.props.backScreen === null || this.props.backScreen === undefined) {
            return null;
        }

        return (
            <Button transparent underlayColor="#000" onPress={() => this.props.navigation.navigate(this.props.backScreen)}>
                <Icon type='FontAwesome' name="chevron-left" style={{fontSize: verticalScale(18), color: 'white', paddingBottom: Platform.OS === 'ios' ? verticalScale(50) : 0}} />
            </Button>
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
                        <View style={{flex: 4}}>
                            <View style={localStyles.logo}>
                                <TouchableHighlight underlayColor="#000" onPress={() => this.props.navigation.navigate('Home')}>
                                    <Image style={{height: verticalScale(65), width: scale(149)}} source={require('../../../public/hero_mobile_logo.png')} />
                                </TouchableHighlight>
                            </View>
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
        height: Platform.OS === 'ios' ? '60@vs' : '70@vs',
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
