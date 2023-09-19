import React, {useCallback, useState} from 'react';
import PropTypes from 'prop-types';
import {useSelector, useDispatch} from 'react-redux';
import {useFocusEffect} from '@react-navigation/native';
import {Dimensions, StyleSheet, View} from 'react-native';
import {Container, Content, Button, Text, List, ListItem, Left, Right, Body, Spinner, Form, Item, Input} from 'native-base';
import {verticalScale} from 'react-native-size-matters';
import {TabView} from 'react-native-tab-view';
import {randomCharacter} from '../../lib/RandomCharacter';
import {common as libCommon} from '../../lib/Common';
import Header from '../Header/Header';
import styles from '../../Styles';
import {setRandomHero, setRandomHeroName} from '../../reducers/randomHero';
import {RouteBuilder, Tab} from '../Tab/Tab';

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

const windowWidth = Dimensions.get('window').width;

const windowHeight = Dimensions.get('window').height;

const GeneralRoute = ({character, dispatch, reRoll}) => {
    const tab = (
        <>
            <List>
                <ListItem>
                    <Left>
                        <Text style={styles.boldGrey}>Name:</Text>
                    </Left>
                    <Body>
                        <Form>
                            <Item>
                                <Input
                                    style={{borderColor: '#D0D1D3', color: '#D0D1D3'}}
                                    onEndEditing={(event) => dispatch(setRandomHeroName({name: event.nativeEvent.text}))}
                                    defaultValue={character.name}
                                />
                            </Item>
                        </Form>
                    </Body>
                </ListItem>
                <ListItem>
                    <Left>
                        <Text style={styles.boldGrey}>Archetype:</Text>
                    </Left>
                    <Body>
                        <Text style={styles.grey}>{character.archtype.name}</Text>
                    </Body>
                </ListItem>
                <ListItem>
                    <Left>
                        <Text style={styles.boldGrey}>Gender:</Text>
                    </Left>
                    <Body>
                        <Text style={styles.grey}>{character.gender}</Text>
                    </Body>
                </ListItem>
                <ListItem>
                    <Left>
                        <Text style={styles.boldGrey}>Special FX:</Text>
                    </Left>
                    <Body>
                        <Text style={styles.grey}>{character.specialFx}</Text>
                    </Body>
                </ListItem>
                <ListItem>
                    <Left>
                        <Text style={styles.boldGrey}>Profession:</Text>
                    </Left>
                    <Body>
                        <Text style={styles.grey}>{character.skills.profession}</Text>
                    </Body>
                </ListItem>
            </List>
            <View style={{paddingBottom: verticalScale(20)}} />
            <Text style={[styles.boldGrey, localStyles.pointCostsHeader]}>Point Costs</Text>
            <List>
                <ListItem>
                    <Left>
                        <Text style={styles.boldGrey}>Characteristics:</Text>
                    </Left>
                    <Body>
                        <Text style={styles.grey}>{character.archtype.characteristicsCost}</Text>
                    </Body>
                </ListItem>
                <ListItem>
                    <Left>
                        <Text style={styles.boldGrey}>Powers:</Text>
                    </Left>
                    <Body>
                        <Text style={styles.grey}>{character.powers.powersCost}</Text>
                    </Body>
                </ListItem>
                <ListItem>
                    <Left>
                        <Text style={styles.boldGrey}>Skills:</Text>
                    </Left>
                    <Body>
                        <Text style={styles.grey}>{character.skills.cost}</Text>
                    </Body>
                </ListItem>
                <ListItem>
                    <Left>
                        <Text style={styles.boldGrey}>Disadvantages:</Text>
                    </Left>
                    <Body>
                        <Text style={styles.grey}>{character.disadvantages.disadvantagesCost}</Text>
                    </Body>
                </ListItem>
            </List>
            <View style={{paddingBottom: verticalScale(20)}} />
            <View style={{flex: 1, flexDirection: 'row', justifyContent: 'space-around', paddingBottom: 20}}>
                <View style={styles.buttonContainer}>
                    <Button block style={styles.button} onPress={reRoll}>
                        <Text uppercase={false}>Roll Again</Text>
                    </Button>
                </View>
            </View>
        </>
    );

    return RouteBuilder('General', tab, libCommon.isEmptyObject(character));
};

const CharacteristicsRoute = ({character, renderCharacteristics}) => {
    return RouteBuilder('Characteristics', renderCharacteristics(), libCommon.isEmptyObject(character));
};

const PowersRoute = ({character}) => {
    const tab = (
        <>
            {character.powers.powers.map((power, index) => {
                return (
                    <ListItem key={'power-' + index}>
                        <Left>
                            <Text style={styles.grey}>{power.power}</Text>
                        </Left>
                        <Right>
                            <Text style={styles.grey}>{power.cost}</Text>
                        </Right>
                    </ListItem>
                );
            })}
        </>
    );

    return RouteBuilder('Powers', tab, libCommon.isEmptyObject(character));
};

const SkillsRoute = ({character}) => {
    const tab = (
        <>
            {character.skills.skills.map((skill, index) => {
                return (
                    <ListItem key={'skill-' + index}>
                        <Body>
                            <Text style={styles.grey}>{skill}</Text>
                        </Body>
                    </ListItem>
                );
            })}
        </>
    );

    return RouteBuilder('Skills', tab, libCommon.isEmptyObject(character));
};

const DisadvantagesRoute = ({character}) => {
    const tab = (
        <>
            {character.disadvantages.disadvantages.map((disad, index) => {
                return (
                    <ListItem key={'disad-' + index}>
                        <Left>
                            <Text style={styles.grey}>{disad.description}</Text>
                        </Left>
                        <Right>
                            <Text style={styles.grey}>{disad.cost}</Text>
                        </Right>
                    </ListItem>
                );
            })}
        </>
    );

    return RouteBuilder('Disadvantages', tab, libCommon.isEmptyObject(character));
};

export const RandomCharacterScreen = ({navigation}) => {
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
                return <GeneralRoute character={character} dispatch={dispatch} reRoll={reRoll} />;
            case 1:
                return <CharacteristicsRoute character={character} renderCharacteristics={renderCharacteristics} />;
            case 2:
                return <PowersRoute character={character} />;
            case 3:
                return <SkillsRoute character={character} />;
            case 4:
                return <DisadvantagesRoute character={character} />;
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
                <ListItem key={prop}>
                    <Left>
                        <Text style={styles.boldGrey}>{character.archtype.characteristics[prop]}</Text>
                    </Left>
                    <Body>
                        <Text style={styles.grey}>{prop.toUpperCase()}</Text>
                    </Body>
                </ListItem>,
            );
        }

        return (
            <View>
                {elements.map((element, _index) => {
                    return element;
                })}
            </View>
        );
    };

    if (character === null) {
        return (
            <Container style={styles.container}>
                <Header hasTabs={true} navigation={navigation} />
                <Content style={styles.content}>
                    <Spinner color="#D0D1D3" />
                </Content>
            </Container>
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
            />
        </>
    );
};

RandomCharacterScreen.propTypes = {
    navigation: PropTypes.object.isRequired,
};

const localStyles = StyleSheet.create({
    pointCostsHeader: {
        alignSelf: 'center',
        textDecorationLine: 'underline',
    },
});
