import React from 'react';
import {Text, TouchableHighlight, View} from 'react-native';
import {scale, verticalScale} from 'react-native-size-matters';
import {Icon} from '../Icon/Icon';
import {Colors} from '../../Styles';

// Copyright (C) Slack Day Studio - All Rights Reserved
// Unauthorized copying of this file, via any medium is strictly prohibited
// Proprietary and confidential
// Written by Phil Guinchard <phil.guinchard@gmail.com>, January 2021

export const TEXT_LEFT = 0;

export const TEXT_RIGHT = 1;

export const TEXT_TOP = 3;

export const TEXT_BOTTOM = 4;

export const IconButton = ({label, textPos, icon, iconColor, onPress, onLongPress, textStyle, opacity = 1}) => {
    switch (textPos) {
        case TEXT_LEFT:
            return (
                <TouchableHighlight
                    onPress={onPress}
                    onLongPress={onLongPress}
                    underlayColor={Colors.secondaryForm}
                    style={{width: scale(90), height: verticalScale(60), borderRadius: 10}}
                >
                    <View flex={1} flexDirection="row" alignContent="center" alignItems="center" justifyContent="center" textAlign="center">
                        <Text style={[textStyle, {textAlign: 'center', fontVariant: 'small-caps'}]}>{label}</Text>
                        <Icon
                            solid
                            size={verticalScale(64)}
                            style={{fontSize: verticalScale(32), textAlign: 'center', color: iconColor, paddingBottom: verticalScale(5)}}
                            type="FontAwesome5"
                            name={icon}
                        />
                    </View>
                </TouchableHighlight>
            );
        case TEXT_RIGHT:
            return (
                <TouchableHighlight
                    onPress={onPress}
                    onLongPress={onLongPress}
                    underlayColor={Colors.secondaryForm}
                    style={{width: scale(90), height: verticalScale(60), borderRadius: 10}}
                >
                    <View flex={1} flexDirection="row" alignContent="center" alignItems="center" justifyContent="center" textAlign="center">
                        <Icon
                            solid
                            size={verticalScale(64)}
                            style={{fontSize: verticalScale(32), textAlign: 'center', color: iconColor, paddingBottom: verticalScale(5)}}
                            name={icon}
                        />
                        <Text style={[textStyle, {textAlign: 'center', fontVariant: 'small-caps'}]}>{label}</Text>
                    </View>
                </TouchableHighlight>
            );
        case TEXT_TOP:
            return (
                <TouchableHighlight
                    onPress={onPress}
                    onLongPress={onLongPress}
                    underlayColor={Colors.secondaryForm}
                    style={{width: scale(90), height: verticalScale(60), borderRadius: 10}}
                >
                    <View flex={1} flexDirection="column" alignContent="center" alignItems="center" justifyContent="center" textAlign="center">
                        <Text style={[textStyle, {textAlign: 'center', fontVariant: 'small-caps'}]}>{label}</Text>
                        <Icon
                            solid
                            size={verticalScale(64)}
                            style={{fontSize: verticalScale(32), textAlign: 'center', color: iconColor, paddingBottom: verticalScale(5)}}
                            type="FontAwesome5"
                            name={icon}
                        />
                    </View>
                </TouchableHighlight>
            );
        default:
            return (
                <View
                    alignItems="center"
                    borderRadius={10}
                    style={{backgroundColor: Colors.primary, borderWidth: 0.5, borderColor: Colors.characterFooter, opacity}}
                >
                    <TouchableHighlight
                        onPress={onPress}
                        onLongPress={onLongPress}
                        underlayColor={Colors.secondaryForm}
                        style={{width: scale(90), height: verticalScale(60), borderRadius: 10}}
                    >
                        <View flex={1} flexDirection="column" alignContent="center" alignItems="center" justifyContent="center" textAlign="center">
                            <Icon
                                solid
                                size={verticalScale(64)}
                                style={{fontSize: verticalScale(32), textAlign: 'center', color: iconColor, paddingBottom: verticalScale(5)}}
                                type="FontAwesome5"
                                name={icon}
                            />
                            <Text style={{color: Colors.tertiary, textAlign: 'center', fontFamily: 'Roboto', fontVariant: 'small-caps'}}>{label}</Text>
                        </View>
                    </TouchableHighlight>
                </View>
            );
    }
};
