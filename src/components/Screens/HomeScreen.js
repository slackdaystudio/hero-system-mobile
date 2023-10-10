import React from 'react';
import {useSelector} from 'react-redux';
import PropTypes from 'prop-types';
import {View, ImageBackground} from 'react-native';
import {verticalScale} from 'react-native-size-matters';
import Header, {EXIT_APP} from '../Header/Header';
import Heading from '../Heading/Heading';
import {IconButton, TEXT_BOTTOM} from '../IconButton/IconButton';
import {common} from '../../lib/Common';

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
    const character = useSelector((state) => state.character.character);

    const onViewPress = () => {
        navigation.navigate('ViewHeroDesignerCharacter', {from: 'Home'});
    };

    const renderCharacterButtons = () => {
        if (common.isEmptyObject(character)) {
            return (
                <View style={{flexDirection: 'row', alignItems: 'center', justifyContent: 'space-evenly', paddingBottom: verticalScale(15)}}>
                    <IconButton
                        label="Characters"
                        textPos={TEXT_BOTTOM}
                        icon="users"
                        iconColor="#e8e8e8"
                        textStyle={{color: '#e8e8e8'}}
                        onPress={() => navigation.navigate('Characters')}
                    />
                </View>
            );
        }

        return (
            <View style={{flexDirection: 'row', alignItems: 'center', justifyContent: 'space-evenly', paddingBottom: verticalScale(15)}}>
                <View>
                    <IconButton
                        label="View"
                        textPos={TEXT_BOTTOM}
                        icon="user"
                        iconColor="#e8e8e8"
                        textStyle={{color: '#e8e8e8'}}
                        onPress={() => onViewPress()}
                    />
                </View>
                <View>
                    <IconButton
                        label="Characters"
                        textPos={TEXT_BOTTOM}
                        icon="users"
                        iconColor="#e8e8e8"
                        textStyle={{color: '#e8e8e8'}}
                        onPress={() => navigation.navigate('Characters')}
                    />
                </View>
            </View>
        );
    };

    return (
        <ImageBackground source={require('../../../public/background.png')} style={{flex: 1, flexDirection: 'column'}} imageStyle={{resizeMode: 'repeat'}}>
            <Header navigation={navigation} backScreen={EXIT_APP} />
            <Heading text="Library" />
            <View flex={0} flexGrow={1} flexDirection="column" justifyContent="flex-start">
                {renderCharacterButtons()}
                <Heading text="Dice Rollers" />
                <View flexDirection="row" alignItems="center" justifyContent="space-evenly" style={{paddingBottom: verticalScale(15)}}>
                    <View>
                        <IconButton
                            label="3d6"
                            textPos={TEXT_BOTTOM}
                            icon="check-circle"
                            iconColor="#e8e8e8"
                            textStyle={{color: '#e8e8e8'}}
                            onPress={() => navigation.navigate('Skill')}
                        />
                    </View>
                    <View>
                        <IconButton
                            label="Hit"
                            textPos={TEXT_BOTTOM}
                            icon="bullseye"
                            iconColor="#e8e8e8"
                            textStyle={{color: '#e8e8e8'}}
                            onPress={() => navigation.navigate('Hit')}
                        />
                    </View>
                </View>
                <View flexDirection="row" alignItems="center" justifyContent="space-evenly" style={{paddingBottom: verticalScale(15)}}>
                    <View>
                        <IconButton
                            label="Damage"
                            textPos={TEXT_BOTTOM}
                            icon="kit-medical"
                            iconColor="#e8e8e8"
                            textStyle={{color: '#e8e8e8'}}
                            onPress={() => navigation.navigate('Damage')}
                        />
                    </View>
                    <View>
                        <IconButton
                            label="Effect"
                            textPos={TEXT_BOTTOM}
                            icon="shield-virus"
                            iconColor="#e8e8e8"
                            textStyle={{color: '#e8e8e8'}}
                            onPress={() => navigation.navigate('Effect')}
                        />
                    </View>
                </View>
                <Heading text="Game Aids" />
                <View style={{flexDirection: 'row', alignItems: 'center', justifyContent: 'space-evenly', paddingBottom: verticalScale(15)}}>
                    <View>
                        <IconButton
                            label="H.E.R.O."
                            textPos={TEXT_BOTTOM}
                            icon="mask"
                            iconColor="#e8e8e8"
                            textStyle={{color: '#e8e8e8'}}
                            onPress={() => navigation.navigate('RandomCharacter')}
                        />
                    </View>
                    <View>
                        <IconButton
                            label="Cruncher"
                            textPos={TEXT_BOTTOM}
                            icon="square-root-variable"
                            iconColor="#e8e8e8"
                            textStyle={{color: '#e8e8e8'}}
                            onPress={() => navigation.navigate('CostCruncher')}
                        />
                    </View>
                </View>
            </View>
        </ImageBackground>
    );
};

HomeScreen.propTypes = {
    navigation: PropTypes.object.isRequired,
};
