import React, { Component }  from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { BackHandler, Platform, StyleSheet, View, Image, Alert } from 'react-native';
import { Container, Content, Button, Text, List, ListItem, Left, Right, Body, Tabs, Tab, TabHeading, ScrollableTab, Spinner, Form, Item, Input } from 'native-base';
import RNShake from 'react-native-shake';
import { NavigationEvents } from 'react-navigation';
import { verticalScale } from 'react-native-size-matters';
import { randomCharacter } from '../../lib/RandomCharacter';
import Header from '../Header/Header';
import styles from '../../Styles';
import { setRandomHero, setRandomHeroName } from '../../reducers/randomHero';

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

class RandomCharacterScreen extends Component {
    static propTypes = {
        navigation: PropTypes.object.isRequired,
        character: PropTypes.object,
        groupPlay: PropTypes.number,
        setRandomHero: PropTypes.func.isRequired,
        setRandomHeroName: PropTypes.func.isRequired,
    }

    constructor(props) {
        super(props);

        this.reRoll = this._reRoll.bind(this);
    }

    onDidFocus() {
        this.backHandler = BackHandler.addEventListener('hardwareBackPress', () => {
            this.props.navigation.navigate('Home');

            return true;
        });

        if (this.props.character === null) {
            this.props.setRandomHero(randomCharacter.generate());
        }

        RNShake.addEventListener('ShakeEvent', () => {
            this._reRoll();
        });
    }

    onDidBlur() {
        RNShake.removeEventListener('ShakeEvent');
        this.backHandler.remove();
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
                </ListItem>
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

    _renderTabHeading(headingText) {
        return (
            <TabHeading style={styles.tabHeading} activeTextStyle={styles.activeTextStyle}>
                <Text style={styles.tabStyle}>
                    {headingText}
                </Text>
            </TabHeading>
        );
    }

    render() {
        if (this.props.character === null) {
            return (
                <Container style={styles.container}>
                    <NavigationEvents
                        onDidFocus={(payload) => this.onDidFocus()}
                        onDidBlur={(payload) => this.onDidBlur()}
                    />
                    <Header hasTabs={true} navigation={this.props.navigation} />
                    <Content style={styles.content}>
                        <Spinner color="#D0D1D3" />
                    </Content>
                </Container>
            );
        }

        return (
            <Container style={styles.container}>
                <NavigationEvents
                    onDidFocus={(payload) => this.onDidFocus()}
                    onDidBlur={(payload) => this.onDidBlur()}
                />
                <Header hasTabs={true} navigation={this.props.navigation} backScreen='Home' />
                <Content scrollEnable={false} style={{backgroundColor: '#1b1b1f'}}>
                    <Tabs locked={true} tabBarUnderlineStyle={styles.tabBarUnderline} renderTabBar={()=> <ScrollableTab style={styles.scrollableTab} />}>
                        <Tab tabStyle={styles.tabHeading} activeTabStyle={styles.activeTabStyle} activeTextStyle={styles.activeTextStyle} heading={this._renderTabHeading('General')}>
                            <View style={styles.tabContent}>
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
                                        <Button block style={styles.button}  onPress={this.reRoll}>
                                            <Text uppercase={false}>Roll Again</Text>
                                        </Button>
                                    </View>
                                </View>
                            </View>
                        </Tab>
                        <Tab tabStyle={styles.tabHeading} activeTabStyle={styles.activeTabStyle} activeTextStyle={styles.activeTextStyle} heading={this._renderTabHeading('Characteristics')}>
                            <View style={styles.tabContent}>
                                {this._renderCharacteristics()}
                            </View>
                        </Tab>
                        <Tab tabStyle={styles.tabHeading} activeTabStyle={styles.activeTabStyle} activeTextStyle={styles.activeTextStyle} heading={this._renderTabHeading('Powers')}>
                            <View style={styles.tabContent}>
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
                            </View>
                        </Tab>
                        <Tab tabStyle={styles.tabHeading} activeTabStyle={styles.activeTabStyle} activeTextStyle={styles.activeTextStyle} heading={this._renderTabHeading('Skills')}>
                            <View style={styles.tabContent}>
                                {this.props.character.skills.skills.map((skill, index) => {
                                    return (
                                        <ListItem key={'skill-' + index}>
                                            <Body>
                                                <Text style={styles.grey}>{skill}</Text>
                                            </Body>
                                        </ListItem>
                                    );
                                })}
                            </View>
                        </Tab>
                        <Tab tabStyle={styles.tabHeading} activeTabStyle={styles.activeTabStyle} activeTextStyle={styles.activeTextStyle} heading={this._renderTabHeading('Disadvantages')}>
                            <View style={styles.tabContent}>
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
                            </View>
                        </Tab>
                    </Tabs>
                </Content>
            </Container>
        );
    }
}

const localStyles = StyleSheet.create({
    pointCostsHeader: {
        alignSelf: 'center',
        textDecorationLine: 'underline',
    },
});

const mapStateToProps = state => {
    return {
        character: state.randomHero.hero,
    };
};

const mapDispatchToProps = {
    setRandomHero,
    setRandomHeroName,
};

export default connect(mapStateToProps, mapDispatchToProps)(RandomCharacterScreen);
