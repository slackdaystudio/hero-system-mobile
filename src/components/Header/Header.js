import React from 'react';
import {BackHandler, Platform, View, Image, StatusBar, TouchableOpacity} from 'react-native';
import {ScaledSheet, scale, verticalScale} from 'react-native-size-matters';
import {Icon} from '../Icon/Icon';
import {useNavigation} from '@react-navigation/native';
import {useSelector} from 'react-redux';
import {DARK, LIGHT, useColorTheme} from '../../hooks/useColorTheme';

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

export const Header = ({backScreen}) => {
    const navigation = useNavigation();

    const scheme = useSelector((state) => state.settings.colorScheme);

    const {Colors} = useColorTheme(scheme);

    const localStyles = createLocalStyles(Colors);

    const _onBackButtonPress = () => {
        if (backScreen === EXIT_APP) {
            BackHandler.exitApp();

            return true;
        }

        if (backScreen === null || backScreen === undefined) {
            navigation.goBack();

            return true;
        }

        navigation.navigate(backScreen);
    };

    return (
        <View style={localStyles.header}>
            <StatusBar barStyle={`${scheme === LIGHT ? DARK : LIGHT}-content`} />
            <View
                style={{
                    flex: 1,
                    paddingTop: Platform.OS === 'ios' ? 0 : 50,
                    flexDirection: 'row',
                    justifyContent: 'center',
                    alignItems: 'center',
                    backgroundColor: Colors.primary,
                }}
            >
                <View style={{flex: 1}}>
                    <Icon name="chevron-left" style={{fontSize: verticalScale(18), color: Colors.tertiary}} onPress={_onBackButtonPress} />
                </View>
                <View style={{flex: 4}}>
                    <View style={localStyles.logo}>
                        <TouchableOpacity onPress={() => navigation.navigate('Home')}>
                            <Image
                                style={{tintColor: Colors.text, height: scale(60), width: scale(138)}}
                                source={require('../../../public/hero_mobile_logo.png')}
                            />
                        </TouchableOpacity>
                    </View>
                </View>
                <View style={{flex: 1}}>
                    <Icon
                        name="bars"
                        style={{fontSize: verticalScale(24), color: Colors.tertiary, paddingBottom: Platform.OS === 'ios' ? verticalScale(0) : 0}}
                        onPress={() => navigation.toggleDrawer()}
                    />
                </View>
            </View>
        </View>
    );
};

const createLocalStyles = (Colors) => {
    return ScaledSheet.create({
        header: {
            backgroundColor: Colors.primary,
            borderBottomWidth: 0.5,
            borderColor: Colors.characterFooter,
            height: Platform.OS === 'ios' ? '90@vs' : '100@vs',
        },
        logo: {
            alignSelf: 'center',
        },
    });
};
