import React, {useCallback, useState} from 'react';
import {useSelector, useDispatch} from 'react-redux';
import {useFocusEffect} from '@react-navigation/native';
import {ActivityIndicator, Dimensions, StyleSheet, Text, TextInput, View} from 'react-native';
import {scale, verticalScale} from 'react-native-size-matters';
import {TabView} from 'react-native-tab-view';
import {randomCharacter} from '../../lib/RandomCharacter';
import {common as libCommon} from '../../lib/Common';
import {Header} from '../Header/Header';
import {Button} from '../Button/Button';
import {setRandomHero, setRandomHeroName} from '../../reducers/randomHero';
import {RouteBuilder, Tab} from '../Tab/Tab';
import {useColorTheme} from '../../hooks/useColorTheme';

// CopyView 2018-Present Philip J. Guinchard
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

const windowWidth = Dimensions.get('window').width;

const windowHeight = Dimensions.get('window').height;

const GeneralRoute = ({character, dispatch, reRoll, styles}) => {
    const tab = (
        <View flex={0} flexGrow={1}>
            <View paddingHorizontal={scale(10)}>
                <View flexDirection="row" justifyContent="space-between">
                    <View justifyContent="center">
                        <Text style={styles.boldGrey}>Name:</Text>
                    </View>
                    <TextInput
                        style={[styles.textInput, {width: scale(200)}]}
                        onEndEditing={(event) => dispatch(setRandomHeroName({name: event.nativeEvent.text}))}
                        defaultValue={character.name}
                    />
                </View>
                <View flexDirection="row" justifyContent="space-between">
                    <View>
                        <Text style={styles.boldGrey}>Archetype:</Text>
                    </View>
                    <View>
                        <Text style={styles.grey}>{character.archtype.name}</Text>
                    </View>
                </View>
                <View flexDirection="row" justifyContent="space-between">
                    <View>
                        <Text style={styles.boldGrey}>Gender:</Text>
                    </View>
                    <View>
                        <Text style={styles.grey}>{character.gender}</Text>
                    </View>
                </View>
                <View flexDirection="row" justifyContent="space-between">
                    <View>
                        <Text style={styles.boldGrey}>Special FX:</Text>
                    </View>
                    <View>
                        <Text style={styles.grey}>{character.specialFx}</Text>
                    </View>
                </View>
                <View flexDirection="row" justifyContent="space-between">
                    <View>
                        <Text style={styles.boldGrey}>Profession:</Text>
                    </View>
                    <View>
                        <Text style={styles.grey}>{character.skills.profession}</Text>
                    </View>
                </View>
            </View>
            <View style={{paddingBottom: verticalScale(20)}} />
            <Text style={[styles.boldGrey, localStyles.pointCostsHeader]}>Point Costs</Text>
            <View paddingHorizontal={scale(10)}>
                <View flexDirection="row" justifyContent="space-between">
                    <View>
                        <Text style={styles.boldGrey}>Characteristics:</Text>
                    </View>
                    <View>
                        <Text style={styles.grey}>{character.archtype.characteristicsCost}</Text>
                    </View>
                </View>
                <View flexDirection="row" justifyContent="space-between">
                    <View>
                        <Text style={styles.boldGrey}>Powers:</Text>
                    </View>
                    <View>
                        <Text style={styles.grey}>{character.powers.powersCost}</Text>
                    </View>
                </View>
                <View flexDirection="row" justifyContent="space-between">
                    <View>
                        <Text style={styles.boldGrey}>Skills:</Text>
                    </View>
                    <View>
                        <Text style={styles.grey}>{character.skills.cost}</Text>
                    </View>
                </View>
                <View flexDirection="row" justifyContent="space-between">
                    <View>
                        <Text style={styles.boldGrey}>Disadvantages:</Text>
                    </View>
                    <View>
                        <Text style={styles.grey}>{character.disadvantages.disadvantagesCost}</Text>
                    </View>
                </View>
            </View>
            <View style={{paddingBottom: verticalScale(20)}} />
            <View style={{flex: 1, flexDirection: 'row', justifyContent: 'space-around', paddingBottom: 20}}>
                <View style={styles.buttonContainer}>
                    <Button label="Roll Again" style={styles.button} onPress={reRoll} />
                </View>
            </View>
        </View>
    );

    return RouteBuilder('General', tab, libCommon.isEmptyObject(character));
};

const CharacteristicsRoute = ({character, renderCharacteristics}) => {
    return RouteBuilder('Characteristics', renderCharacteristics(), libCommon.isEmptyObject(character));
};

const PowersRoute = ({character, styles}) => {
    const tab = (
        <View flex={0} flexGrow={1} paddingHorizontal={scale(10)}>
            {character.powers.powers.map((power, index) => {
                return (
                    <View flexDirection="row" justifyContent="space-between" key={'power-' + index}>
                        <View flexDirection="row" flexWrap="wrap">
                            <Text style={styles.grey}>{power.power}</Text>
                        </View>
                        <View>
                            <Text style={styles.grey}>{power.cost}</Text>
                        </View>
                    </View>
                );
            })}
        </View>
    );

    return RouteBuilder('Powers', tab, libCommon.isEmptyObject(character));
};

const SkillsRoute = ({character, styles}) => {
    const tab = (
        <View flex={0} flexGrow={1} paddingHorizontal={scale(10)}>
            {character.skills.skills.map((skill, index) => {
                return (
                    <View flexDirection="row" justifyContent="space-between" key={'skill-' + index}>
                        <View>
                            <Text style={styles.grey}>{skill}</Text>
                        </View>
                    </View>
                );
            })}
        </View>
    );

    return RouteBuilder('Skills', tab, libCommon.isEmptyObject(character));
};

const DisadvantagesRoute = ({character, styles}) => {
    const tab = (
        <View flex={0} flexGrow={1} paddingHorizontal={scale(10)}>
            {character.disadvantages.disadvantages.map((disad, index) => {
                return (
                    <View flexDirection="row" justifyContent="space-between" key={'disad-' + index}>
                        <View flexDirection="row" flexWrap="wrap">
                            <Text style={styles.grey}>{disad.description}</Text>
                        </View>
                        <View>
                            <Text style={styles.grey}>{disad.cost}</Text>
                        </View>
                    </View>
                );
            })}
        </View>
    );

    return RouteBuilder('Disadvantages', tab, libCommon.isEmptyObject(character));
};

export const RandomCharacterScreen = ({navigation}) => {
    const scheme = useSelector((state) => state.settings.colorScheme);

    const {styles} = useColorTheme(scheme);

    const dispatch = useDispatch();

    const character = useSelector((state) => state.randomHero.hero);

    const [index, setIndex] = useState(0);

    const routes = [
        {key: 'general', title: 'General'},
        {key: 'characteristics', title: 'Characteristics'},
        {key: 'powers', title: 'Powers'},
        {key: 'skills', title: 'Skills'},
        {key: 'disadvantages', title: 'Disadvantages'},
    ];

    useFocusEffect(
        useCallback(() => {
            if (libCommon.isEmptyObject(character)) {
                dispatch(setRandomHero({randomHero: randomCharacter.generate()}));
            }
        }, [character, dispatch]),
    );

    const renderScene = () => {
        switch (index) {
            case 0:
                return <GeneralRoute character={character} dispatch={dispatch} reRoll={reRoll} styles={styles} />;
            case 1:
                return <CharacteristicsRoute character={character} renderCharacteristics={renderCharacteristics} />;
            case 2:
                return <PowersRoute character={character} styles={styles} />;
            case 3:
                return <SkillsRoute character={character} styles={styles} />;
            case 4:
                return <DisadvantagesRoute character={character} styles={styles} />;
            default:
                return null;
        }
    };

    const reRoll = () => {
        dispatch(setRandomHero({randomHero: randomCharacter.generate()}));
    };

    const renderCharacteristics = () => {
        let elements = [];

        for (let prop in character.archtype.characteristics) {
            elements.push(
                <View flexDirection="row" alignSelf="center" alignItems="flex-end" justifyContent="flex-start" key={prop} paddingLeft={scale(10)}>
                    <View flex={1} paddingRight={scale(20)} alignSelf="flex-end">
                        <Text style={styles.boldGrey}>{character.archtype.characteristics[prop]}</Text>
                    </View>
                    <View flex={5}>
                        <Text style={styles.grey}>{prop.toUpperCase()}</Text>
                    </View>
                </View>,
            );
        }

        return (
            <View flex={0} flexGrow={1}>
                {elements.map((element, _index) => {
                    return element;
                })}
            </View>
        );
    };

    if (character === null) {
        return (
            <View style={styles.container}>
                <Header hasTabs={true} navigation={navigation} />
                <ActivityIndicator color="#D0D1D3" />
            </View>
        );
    }

    return (
        <>
            <Header navigation={navigation} hasTabs={true} />
            <TabView
                navigationState={{index, setIndex, routes}}
                renderScene={renderScene}
                renderTabBar={Tab}
                onIndexChange={setIndex}
                initialLayout={{height: windowHeight, width: windowWidth}}
                swipeEnabled={false}
            />
        </>
    );
};

const localStyles = StyleSheet.create({
    pointCostsHeader: {
        alignSelf: 'center',
        textDecorationLine: 'underline',
    },
});
