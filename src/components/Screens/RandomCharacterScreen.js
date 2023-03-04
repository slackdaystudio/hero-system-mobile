import React, {Component} from 'react';
import PropTypes from 'prop-types';
import {connect} from 'react-redux';
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

class RandomCharacterScreen extends Component {
    static propTypes = {
        navigation: PropTypes.object.isRequired,
        character: PropTypes.object,
        setRandomHero: PropTypes.func.isRequired,
        setRandomHeroName: PropTypes.func.isRequired,
    };

    constructor(props) {
        super(props);

        this.state = {
            index: 0,
            routes: [
                {key: 'general', title: 'General'},
                {key: 'characteristics', title: 'Characteristics'},
                {key: 'powers', title: 'Powers'},
                {key: 'skills', title: 'Skills'},
                {key: 'disadvantages', title: 'Disadvantages'},
            ],
        };

        this.reRoll = this._reRoll.bind(this);
        this.setIndex = this._setIndex.bind(this);
        this.renderScene = this._renderScene.bind(this);
    }

    componentDidMount() {
        this._unsubscribe = this.props.navigation.addListener('focus', () => {
            if (this.props.character === null) {
                this.props.setRandomHero(randomCharacter.generate());
            }
        });
    }

    componentWillUnmount() {
        this._unsubscribe();
    }

    _renderScene() {
        switch (this.state.index) {
            case 0:
                return this.GeneralRoute();
            case 1:
                return this.CharacteristicsRoute();
            case 2:
                return this.PowersRoute();
            case 3:
                return this.SkillsRoute();
            case 4:
                return this.DisadvantagesRoute();
            default:
                return null;
        }
    }

    _setIndex(index) {
        this.setState((state) => ({
            ...state,
            index: index,
        }));
    }

    _reRoll() {
        this.props.setRandomHero(randomCharacter.generate());
    }

    _renderCharacteristics() {
        let elements = [];

        for (let prop in this.props.character.archtype.characteristics) {
            elements.push(
                <ListItem key={prop}>
                    <Left>
                        <Text style={styles.boldGrey}>{this.props.character.archtype.characteristics[prop]}</Text>
                    </Left>
                    <Body>
                        <Text style={styles.grey}>{prop.toUpperCase()}</Text>
                    </Body>
                </ListItem>,
            );
        }

        return (
            <View>
                {elements.map((element, index) => {
                    return element;
                })}
            </View>
        );
    }

    GeneralRoute() {
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
                                        onChangeText={(text) => this.props.setRandomHeroName(text)}
                                        value={this.props.character.name}
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
                            <Text style={styles.grey}>{this.props.character.archtype.name}</Text>
                        </Body>
                    </ListItem>
                    <ListItem>
                        <Left>
                            <Text style={styles.boldGrey}>Gender:</Text>
                        </Left>
                        <Body>
                            <Text style={styles.grey}>{this.props.character.gender}</Text>
                        </Body>
                    </ListItem>
                    <ListItem>
                        <Left>
                            <Text style={styles.boldGrey}>Special FX:</Text>
                        </Left>
                        <Body>
                            <Text style={styles.grey}>{this.props.character.specialFx}</Text>
                        </Body>
                    </ListItem>
                    <ListItem>
                        <Left>
                            <Text style={styles.boldGrey}>Profession:</Text>
                        </Left>
                        <Body>
                            <Text style={styles.grey}>{this.props.character.skills.profession}</Text>
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
                            <Text style={styles.grey}>{this.props.character.archtype.characteristicsCost}</Text>
                        </Body>
                    </ListItem>
                    <ListItem>
                        <Left>
                            <Text style={styles.boldGrey}>Powers:</Text>
                        </Left>
                        <Body>
                            <Text style={styles.grey}>{this.props.character.powers.powersCost}</Text>
                        </Body>
                    </ListItem>
                    <ListItem>
                        <Left>
                            <Text style={styles.boldGrey}>Skills:</Text>
                        </Left>
                        <Body>
                            <Text style={styles.grey}>{this.props.character.skills.cost}</Text>
                        </Body>
                    </ListItem>
                    <ListItem>
                        <Left>
                            <Text style={styles.boldGrey}>Disadvantages:</Text>
                        </Left>
                        <Body>
                            <Text style={styles.grey}>{this.props.character.disadvantages.disadvantagesCost}</Text>
                        </Body>
                    </ListItem>
                </List>
                <View style={{paddingBottom: verticalScale(20)}} />
                <View style={{flex: 1, flexDirection: 'row', justifyContent: 'space-around', paddingBottom: 20}}>
                    <View style={styles.buttonContainer}>
                        <Button block style={styles.button} onPress={this.reRoll}>
                            <Text uppercase={false}>Roll Again</Text>
                        </Button>
                    </View>
                </View>
            </>
        );

        return RouteBuilder('General', tab, libCommon.isEmptyObject(this.props.character));
    }

    CharacteristicsRoute() {
        return RouteBuilder('Characteristics', this._renderCharacteristics(), libCommon.isEmptyObject(this.props.character));
    }

    PowersRoute() {
        const tab = (
            <>
                {this.props.character.powers.powers.map((power, index) => {
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

        return RouteBuilder('Powers', tab, libCommon.isEmptyObject(this.props.character));
    }

    SkillsRoute() {
        const tab = (
            <>
                {this.props.character.skills.skills.map((skill, index) => {
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

        return RouteBuilder('Skills', tab, libCommon.isEmptyObject(this.props.character));
    }

    DisadvantagesRoute() {
        const tab = (
            <>
                {this.props.character.disadvantages.disadvantages.map((disad, index) => {
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

        return RouteBuilder('Disadvantages', tab, libCommon.isEmptyObject(this.props.character));
    }

    render() {
        if (this.props.character === null) {
            return (
                <Container style={styles.container}>
                    <Header hasTabs={true} navigation={this.props.navigation} />
                    <Content style={styles.content}>
                        <Spinner color="#D0D1D3" />
                    </Content>
                </Container>
            );
        }

        return (
            <>
                <Header navigation={this.props.navigation} hasTabs={true} />
                <TabView
                    navigationState={{index: this.state.index, routes: this.state.routes, setIndex: this.setIndex}}
                    renderScene={this.renderScene}
                    renderTabBar={Tab}
                    onIndexChange={this.setIndex}
                    initialLayout={{height: windowHeight, width: windowWidth}}
                />
            </>
        );
    }
}

const localStyles = StyleSheet.create({
    pointCostsHeader: {
        alignSelf: 'center',
        textDecorationLine: 'underline',
    },
});

const mapStateToProps = (state) => {
    return {
        character: state.randomHero.hero,
    };
};

const mapDispatchToProps = {
    setRandomHero,
    setRandomHeroName,
};

export default connect(mapStateToProps, mapDispatchToProps)(RandomCharacterScreen);
