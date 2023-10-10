import React from 'react';
import PropTypes from 'prop-types';
import {Text, View} from 'react-native';
import {TouchableHighlight} from 'react-native-gesture-handler';
import {scale, verticalScale} from 'react-native-size-matters';
import {Icon} from '../Icon/Icon';
import {PRIMARY_COLOR} from '../../Styles';

// Copyright (C) Slack Day Studio - All Rights Reserved
// Unauthorized copying of this file, via any medium is strictly prohibited
// Proprietary and confidential
// Written by Phil Guinchard <phil.guinchard@gmail.com>, January 2021

export const TEXT_LEFT = 0;

export const TEXT_RIGHT = 1;

export const TEXT_TOP = 3;

export const TEXT_BOTTOM = 4;

export const IconButton = ({label, textPos, icon, iconColor, onPress, onLongPress, textStyle}) => {
    switch (textPos) {
        case TEXT_LEFT:
            return (
                <TouchableHighlight
                    onPress={onPress}
                    onLongPress={onLongPress}
                    underlayColor={PRIMARY_COLOR}
                    style={{width: scale(90), height: verticalScale(60), borderRadius: 10}}
                >
                    <View flex={1} flexDirection="row" alignContent="center" alignItems="center" justifyContent="center" textAlign="center">
                        <Text style={[textStyle, {textAlign: 'center'}]}>{label}</Text>
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
                    underlayColor={PRIMARY_COLOR}
                    style={{width: scale(90), height: verticalScale(60), borderRadius: 10}}
                >
                    <View flex={1} flexDirection="row" alignContent="center" alignItems="center" justifyContent="center" textAlign="center">
                        <Icon
                            solid
                            size={verticalScale(64)}
                            style={{fontSize: verticalScale(32), textAlign: 'center', color: iconColor, paddingBottom: verticalScale(5)}}
                            name={icon}
                        />
                        <Text style={[textStyle, {textAlign: 'center'}]}>{label}</Text>
                    </View>
                </TouchableHighlight>
            );
        case TEXT_TOP:
            return (
                <TouchableHighlight
                    onPress={onPress}
                    onLongPress={onLongPress}
                    underlayColor={PRIMARY_COLOR}
                    style={{width: scale(90), height: verticalScale(60), borderRadius: 10}}
                >
                    <View flex={1} flexDirection="column" alignContent="center" alignItems="center" justifyContent="center" textAlign="center">
                        <Text style={[textStyle, {textAlign: 'center'}]}>{label}</Text>
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
                <View alignItems="center">
                    <TouchableHighlight
                        onPress={onPress}
                        onLongPress={onLongPress}
                        underlayColor={PRIMARY_COLOR}
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
                            <Text style={[textStyle, {textAlign: 'center'}]}>{label}</Text>
                        </View>
                    </TouchableHighlight>
                </View>
            );
    }
};

IconButton.propTypes = {
    label: PropTypes.string.isRequired,
    textPos: PropTypes.number.isRequired,
    icon: PropTypes.string.isRequired,
    iconColor: PropTypes.string.isRequired,
    onPress: PropTypes.func.isRequired,
    onLongPress: PropTypes.func,
    textStyle: PropTypes.object,
};
