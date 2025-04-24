import React from 'react';
import {useSelector} from 'react-redux';
import {View} from 'react-native';
import {verticalScale} from 'react-native-size-matters';
import {Header, EXIT_APP} from '../Header/Header';
import {Heading} from '../Heading/Heading';
import {IconButton, TEXT_BOTTOM} from '../IconButton/IconButton';
import {common} from '../../lib/Common';
import {Animated} from '../Animated';
import {ReduceMotion} from 'react-native-reanimated';
import {useNavigation} from '@react-navigation/native';
import {useColorTheme} from '../../hooks/useColorTheme';

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

export const HomeScreen = () => {
    const navigation = useNavigation();

    const character = useSelector((state) => state.character.character);

    const scheme = useSelector((state) => state.settings.colorScheme);

    const {Colors} = useColorTheme(scheme);

    const onViewPress = () => {
        if (common.isEmptyObject(character)) {
            return;
        }

        navigation.navigate('ViewHeroDesignerCharacter', {from: 'Home'});
    };

    return (
        <>
            <Header navigation={navigation} backScreen={EXIT_APP} />
            <Animated
                animationProps={{
                    from: {
                        scale: 0.1,
                    },
                    animate: {
                        scale: 1,
                    },
                    transition: {
                        scale: {
                            type: 'spring',
                            duration: 1200,
                            dampingRatio: 0.3,
                            stiffness: 1,
                            overshootClamping: false,
                            restDisplacementThreshold: 0.2,
                            restSpeedThreshold: 0.01,
                            reduceMotion: ReduceMotion.System,
                        },
                    },
                }}
                style={{flex: 1, maxHeight: verticalScale(48), paddingBottom: verticalScale(48)}}
            >
                <Heading text="Library" />
                <View flex={0} flexGrow={1} flexDirection="column" justifyContent="flex-start">
                    <View style={{flexDirection: 'row', alignItems: 'center', justifyContent: 'space-evenly', paddingBottom: verticalScale(15)}}>
                        <IconButton
                            label="View"
                            icon="user"
                            iconColor={Colors.tertiary}
                            onPress={() => onViewPress()}
                            opacity={common.isEmptyObject(character) ? 0.3 : 1}
                        />
                        <IconButton label="Characters" icon="users" iconColor={Colors.tertiary} onPress={() => navigation.navigate('Characters')} />
                    </View>

                    <Heading text="Dice Rollers" />
                    <View flexDirection="row" alignItems="center" justifyContent="space-evenly" style={{paddingBottom: verticalScale(15)}}>
                        <IconButton label="3d6" icon="check-circle" iconColor={Colors.tertiary} onPress={() => navigation.navigate('Skill')} />
                        <IconButton label="Hit" textPos={TEXT_BOTTOM} icon="bullseye" iconColor={Colors.tertiary} onPress={() => navigation.navigate('Hit')} />
                    </View>
                    <View flexDirection="row" alignItems="center" justifyContent="space-evenly" style={{paddingBottom: verticalScale(15)}}>
                        <IconButton label="Damage" icon="kit-medical" iconColor={Colors.tertiary} onPress={() => navigation.navigate('Damage')} />
                        <IconButton label="Effect" icon="shield-virus" iconColor={Colors.tertiary} onPress={() => navigation.navigate('Effect')} />
                    </View>
                    <Heading text="Game Tools" />
                    <View style={{flexDirection: 'row', alignItems: 'center', justifyContent: 'space-evenly', paddingBottom: verticalScale(15)}}>
                        <IconButton label="H.E.R.O." icon="mask" iconColor={Colors.tertiary} onPress={() => navigation.navigate('RandomCharacter')} />
                        <IconButton
                            label="Cruncher"
                            icon="square-root-variable"
                            iconColor={Colors.tertiary}
                            onPress={() => navigation.navigate('CostCruncher')}
                        />
                    </View>
                </View>
            </Animated>
        </>
    );
};
