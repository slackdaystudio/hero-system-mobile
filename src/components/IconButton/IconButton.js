import React from 'react';
import {Text, TouchableHighlight, View} from 'react-native';
import {scale, verticalScale} from 'react-native-size-matters';
import {Icon} from '../Icon/Icon';
import {Animated} from '../Animated';
import {ReduceMotion} from 'react-native-reanimated';
import {getRandomNumber} from '../../../App';
import {useSelector} from 'react-redux';
import {useColorTheme} from '../../hooks/useColorTheme';

// Copyright (C) Slack Day Studio - All Rights Reserved
// Unauthorized copying of this file, via any medium is strictly prohibited
// Proprietary and confidential
// Written by Phil Guinchard <phil.guinchard@gmail.com>, January 2021

export const IconButton = ({label, icon, iconColor, onPress, onLongPress, opacity = 1}) => {
    const scheme = useSelector((state) => state.settings.colorScheme);

    const {Colors} = useColorTheme(scheme);

    const rotations = getRandomNumber(10, 20);

    return (
        <Animated
            animationProps={{
                from: {
                    rotateX: `${90 * rotations}deg`,
                },
                animate: {
                    rotateX: '0deg',
                },
                transition: {
                    rotateX: {
                        type: 'timing',
                        duration: rotations * getRandomNumber(125, 175),
                        dampingRatio: 0.5,
                        stiffness: 100,
                        overshootClamping: false,
                        restDisplacementThreshold: 0.01,
                        restSpeedThreshold: 2,
                        reduceMotion: ReduceMotion.System,
                    },
                },
            }}
        >
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
        </Animated>
    );
};
