import React, {Component} from 'react';
import PropTypes from 'prop-types';
import {BackHandler, Platform, View, Image, TouchableHighlight, StatusBar} from 'react-native';
import {Button, Header, Icon} from 'native-base';
import {ScaledSheet, scale, verticalScale} from 'react-native-size-matters';

export const EXIT_APP = '0';

export default class MyHeader extends Component {
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

        this.props.navigation.navigate(this.props.backScreen);
    }

    _renderBackButton() {
        if (this.props.backScreen === null || this.props.backScreen === undefined) {
            return null;
        }

        return (
            <Button transparent underlayColor="#000" onPress={() => this._onBackButtonPress()}>
                <Icon type="FontAwesome" name="chevron-left" style={{fontSize: verticalScale(18), color: 'white'}} />
            </Button>
        );
    }

    render() {
        return (
            <View>
                <Header hasTabs={this.props.hasTabs || false} style={localStyles.header}>
                    <View style={{flex: 1, flexDirection: 'row', justifyContent: 'center', alignItems: 'center'}}>
                        <View style={{flex: 1}}>{this._renderBackButton()}</View>
                        <View style={{flex: 4}}>
                            <View style={localStyles.logo}>
                                <TouchableHighlight underlayColor="#000" onPress={() => this.props.navigation.navigate('Home')}>
                                    <Image style={{height: scale(60), width: scale(138)}} source={require('../../../public/hero_mobile_logo.png')} />
                                </TouchableHighlight>
                            </View>
                        </View>
                        <View style={{flex: 1}}>
                            <Button transparent underlayColor="#000" onPress={() => this.props.navigation.toggleDrawer()}>
                                <Icon
                                    type="FontAwesome"
                                    name="bars"
                                    style={{fontSize: verticalScale(24), color: 'white', paddingBottom: Platform.OS === 'ios' ? verticalScale(30) : 0}}
                                />
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
        height: Platform.OS === 'ios' ? '75@vs' : '60@vs',
    },
    logo: {
        alignSelf: 'center',
    },
});
