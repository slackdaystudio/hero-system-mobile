import React from 'react';
import {useSelector} from 'react-redux';
import PropTypes from 'prop-types';
import {View, ImageBackground} from 'react-native';
import {Container, Content} from 'native-base';
import {verticalScale} from 'react-native-size-matters';
import Header, {EXIT_APP} from '../Header/Header';
import Heading from '../Heading/Heading';
import {IconButton, TEXT_BOTTOM} from '../IconButton/IconButton';
import {common} from '../../lib/Common';
import styles from '../../Styles';

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
                <View style={{flex: 1, flexDirection: 'row', justifyContent: 'space-evenly', paddingVertical: verticalScale(20)}}>
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
            <View style={{flex: 1, flexDirection: 'row', justifyContent: 'space-evenly', paddingVertical: verticalScale(20)}}>
                <View flex={1}>
                    <IconButton
                        label="View"
                        textPos={TEXT_BOTTOM}
                        icon="user"
                        iconColor="#e8e8e8"
                        textStyle={{color: '#e8e8e8'}}
                        onPress={() => onViewPress()}
                    />
                </View>
                <View flex={1}>
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
        <Container style={styles.container}>
            <Header navigation={navigation} backScreen={EXIT_APP} />
            <Content style={styles.content}>
                <ImageBackground source={require('../../../public/background.png')} style={{flex: 1}} imageStyle={{resizeMode: 'cover'}}>
                    <Heading text="Library" />
                    <View style={{flex: 1, flexDirection: 'column', justifyContent: 'space-between'}}>
                        {renderCharacterButtons()}
                        <Heading text="Dice Rollers" />
                        <View style={{flex: 1, flexDirection: 'row', justifyContent: 'space-evenly', paddingVertical: verticalScale(30)}}>
                            <View flex={1}>
                                <IconButton
                                    label="3d6"
                                    textPos={TEXT_BOTTOM}
                                    icon="check-circle"
                                    iconColor="#e8e8e8"
                                    textStyle={{color: '#e8e8e8'}}
                                    onPress={() => navigation.navigate('Skill')}
                                />
                            </View>
                            <View flex={1}>
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
                        <View style={{flex: 1, flexDirection: 'row', justifyContent: 'space-evenly', paddingBottom: verticalScale(50)}}>
                            <View flex={1}>
                                <IconButton
                                    label="Damage"
                                    textPos={TEXT_BOTTOM}
                                    icon="medkit"
                                    iconColor="#e8e8e8"
                                    textStyle={{color: '#e8e8e8'}}
                                    onPress={() => navigation.navigate('Damage')}
                                />
                            </View>
                            <View flex={1}>
                                <IconButton
                                    label="Effect"
                                    textPos={TEXT_BOTTOM}
                                    icon="virus"
                                    iconColor="#e8e8e8"
                                    textStyle={{color: '#e8e8e8'}}
                                    onPress={() => navigation.navigate('Effect')}
                                />
                            </View>
                        </View>
                        <Heading text="Game Aids" />
                        <View style={{flex: 1, flexDirection: 'row', justifyContent: 'space-evenly', paddingVertical: verticalScale(20)}}>
                            <View flex={1}>
                                <IconButton
                                    label="H.E.R.O."
                                    textPos={TEXT_BOTTOM}
                                    icon="mask"
                                    iconColor="#e8e8e8"
                                    textStyle={{color: '#e8e8e8'}}
                                    onPress={() => navigation.navigate('RandomCharacter')}
                                />
                            </View>
                            <View flex={1}>
                                <IconButton
                                    label="Cruncher"
                                    textPos={TEXT_BOTTOM}
                                    icon="square-root-alt"
                                    iconColor="#e8e8e8"
                                    textStyle={{color: '#e8e8e8'}}
                                    onPress={() => navigation.navigate('CostCruncher')}
                                />
                            </View>
                        </View>
                    </View>
                    <View style={{paddingBottom: verticalScale(20)}} />
                </ImageBackground>
            </Content>
        </Container>
    );
};

HomeScreen.propTypes = {
    navigation: PropTypes.object.isRequired,
};
