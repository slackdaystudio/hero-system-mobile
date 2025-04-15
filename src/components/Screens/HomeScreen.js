import React from 'react';
import {useSelector} from 'react-redux';
import PropTypes from 'prop-types';
import {View} from 'react-native';
import {verticalScale} from 'react-native-size-matters';
import Header, {EXIT_APP} from '../Header/Header';
import {Heading} from '../Heading/Heading';
import {IconButton, TEXT_BOTTOM} from '../IconButton/IconButton';
import {common} from '../../lib/Common';
import {Colors} from '../../Styles';
import {Animated} from '../Animated';
import {useFlip} from '../Animated/Animated';
import {getRandomNumber} from '../../../App';

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

export const HomeScreen = ({navigation}) => {
    const flip = useFlip();

    const character = useSelector((state) => state.character.character);

    const onViewPress = () => {
        navigation.navigate('ViewHeroDesignerCharacter', {from: 'Home'});
    };

    return (
        <>
            <Header navigation={navigation} backScreen={EXIT_APP} />
            <Heading text="Library" animated />
            <View flex={0} flexGrow={1} flexDirection="column" justifyContent="flex-start">
                <View style={{flexDirection: 'row', alignItems: 'center', justifyContent: 'space-evenly', paddingBottom: verticalScale(15)}}>
                    <Animated animationProps={{duration: 3000, delay: getRandomNumber(800, 2200), state: flip}}>
                        <IconButton
                            label="View"
                            textPos={TEXT_BOTTOM}
                            icon="user"
                            iconColor={Colors.tertiary}
                            onPress={() => onViewPress()}
                            opacity={common.isEmptyObject(character) ? 0.3 : 1}
                        />
                    </Animated>
                    <Animated animationProps={{duration: 3000, delay: getRandomNumber(800, 2200), state: flip}}>
                        <IconButton
                            label="Characters"
                            textPos={TEXT_BOTTOM}
                            icon="users"
                            iconColor={Colors.tertiary}
                            onPress={() => navigation.navigate('Characters')}
                        />
                    </Animated>
                </View>
                <Heading text="Dice Rollers" animated />
                <View flexDirection="row" alignItems="center" justifyContent="space-evenly" style={{paddingBottom: verticalScale(15)}}>
                    <Animated animationProps={{duration: 3000, delay: getRandomNumber(800, 2200), state: flip}}>
                        <IconButton
                            label="3d6"
                            textPos={TEXT_BOTTOM}
                            icon="check-circle"
                            iconColor={Colors.tertiary}
                            onPress={() => navigation.navigate('Skill')}
                        />
                    </Animated>
                    <Animated animationProps={{duration: 3000, delay: getRandomNumber(800, 2200), state: flip}}>
                        <IconButton label="Hit" textPos={TEXT_BOTTOM} icon="bullseye" iconColor={Colors.tertiary} onPress={() => navigation.navigate('Hit')} />
                    </Animated>
                </View>
                <View flexDirection="row" alignItems="center" justifyContent="space-evenly" style={{paddingBottom: verticalScale(15)}}>
                    <Animated animationProps={{duration: 3000, delay: getRandomNumber(800, 2200), state: flip}}>
                        <IconButton
                            label="Damage"
                            textPos={TEXT_BOTTOM}
                            icon="kit-medical"
                            iconColor={Colors.tertiary}
                            onPress={() => navigation.navigate('Damage')}
                        />
                    </Animated>
                    <Animated animationProps={{duration: 3000, delay: getRandomNumber(800, 2200), state: flip}}>
                        <IconButton
                            label="Effect"
                            textPos={TEXT_BOTTOM}
                            icon="shield-virus"
                            iconColor={Colors.tertiary}
                            onPress={() => navigation.navigate('Effect')}
                        />
                    </Animated>
                </View>
                <Heading text="Game Aids" animated />
                <View style={{flexDirection: 'row', alignItems: 'center', justifyContent: 'space-evenly', paddingBottom: verticalScale(15)}}>
                    <Animated animationProps={{duration: 3000, delay: getRandomNumber(800, 2200), state: flip}}>
                        <IconButton
                            label="H.E.R.O."
                            textPos={TEXT_BOTTOM}
                            icon="mask"
                            iconColor={Colors.tertiary}
                            onPress={() => navigation.navigate('RandomCharacter')}
                        />
                    </Animated>
                    <Animated animationProps={{duration: 3000, delay: getRandomNumber(800, 2200), state: flip}}>
                        <IconButton
                            label="Cruncher"
                            textPos={TEXT_BOTTOM}
                            icon="square-root-variable"
                            iconColor={Colors.tertiary}
                            onPress={() => navigation.navigate('CostCruncher')}
                        />
                    </Animated>
                </View>
            </View>
        </>
    );
};

HomeScreen.propTypes = {
    navigation: PropTypes.object.isRequired,
};
