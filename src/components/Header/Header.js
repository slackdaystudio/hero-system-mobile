import React, { Component }  from 'react';
import PropTypes from 'prop-types';
import { Platform, StyleSheet, View, Image, TouchableHighlight, StatusBar } from 'react-native';
import { Button, Text, Header, Left, Right, Icon } from 'native-base';
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
        hasTabs: PropTypes.bool.isRequired,
    }

    render() {
        return (
            <View>
                <Header hasTabs={this.props.hasTabs || false} style={localStyles.header}>
                    <Left>
                        <View style={localStyles.logo}>
                            <TouchableHighlight underlayColor="#000" onPress={() => this.props.navigation.navigate('Home')}>
                                <Image source={require('../../../public/hero_mobile_logo.png')} />
                            </TouchableHighlight>
                        </View>
                    </Left>
                    <Right>
                        <Button transparent underlayColor="#000" onPress={() => this.props.navigation.toggleDrawer()}>
                            <Icon name="menu" style={{color: 'white', paddingBottom: Platform.OS === 'ios' ? 50 : 0}} />
                        </Button>
                    </Right>
                </Header>
                <StatusBar backgroundColor="#000" barStyle="light-content" />
		    </View>
        );
    }
}

const localStyles = StyleSheet.create({
    header: {
        backgroundColor: '#000',
        height: Platform.OS === 'ios' ? 60 : 70,
    },
    logo: {
        paddingLeft: 5,
        alignSelf: 'flex-start',
        ...Platform.select({
		    ios: {
			    paddingBottom: 20,
		    },
        }),
    },
});
