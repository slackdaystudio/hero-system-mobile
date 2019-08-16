import React, { Component, Fragment }  from 'react';
import PropTypes from 'prop-types';
import { View, TouchableHighlight } from 'react-native';
import { Text, Icon, Card, CardItem, Left, Right, Body } from 'native-base';
import Heading from '../Heading/Heading';
import CircleText from '../CircleText/CircleText';
import { dieRoller } from '../../lib/DieRoller';
import styles from '../../Styles';

export default class Characteristics extends Component {
    static propTypes = {
        navigation: PropTypes.object.isRequired,
        characteristics: PropTypes.array.isRequired
    }

    constructor(props) {
        super(props);

        const displayOptions =  this._initCharacteristicsShow(props.characteristics);

        this.state = {
            characteristicsShow: displayOptions.characteristicsShow,
            characteristicsButtonsShow: displayOptions.characteristicsButtonsShow
        }
    }

    _initCharacteristicsShow(characteristics) {
        let characteristicsShow = {};
        let characteristicsButtonsShow = {};


        characteristics.map((characteristic, index) => {
            characteristicsShow[characteristic.shortName] = false;
            characteristicsButtonsShow[characteristic.shortName] = 'plus-circle';
        });

        return {
            characteristicsShow: characteristicsShow,
            characteristicsButtonsShow: characteristicsButtonsShow
        };
    }

    _toggleDefinitionShow(name) {
        let newState = {...this.state};
        newState.characteristicsShow[name] = !newState.characteristicsShow[name];
        newState.characteristicsButtonsShow[name] = newState.characteristicsButtonsShow[name] === 'plus-circle' ? 'minus-circle' : 'plus-circle';

        this.setState(newState);
    }

    _renderMovementHeader(name) {
        if (name === 'running') {
            return (
                <View style={{paddingTop: 20}}>
                    <Heading text='Characteristics' />
                </View>
            );
        }

        return null;
    }

    _renderDefinition(characteristic) {
        if (this.state.characteristicsShow[characteristic.shortName]) {
            return (
                <Fragment>
                    <CardItem style={styles.cardItem}>
                        <Body>
                            <Text style={styles.grey}>{characteristic.definition}</Text>
                        </Body>
                    </CardItem>
                    <CardItem style={styles.cardItem} footer>
                        <Body style={{flex: 1, flexDirection: 'row', justifyContent: 'center'}}>
                            <Text style={styles.grey}>
                                <Text style={styles.boldGrey}>Base:</Text> {characteristic.base}
                            </Text>
                            <Text style={styles.grey}>
                                <Text style={styles.boldGrey}>    Cost:</Text> {characteristic.cost}
                            </Text>
                        </Body>
                    </CardItem>
                </Fragment>
            );
        }

        return null;
    }

    render() {
        return (
            <View>
                <Heading text='Characteristics' />
                {this.props.characteristics.map((characteristic, index) => {
                    return (
                        <Card style={styles.card} key={'characteristic-' + index}>
                            <CardItem style={styles.cardItem}>
                                <Body>
                                    <View style={{flex: 1, flexDirection: 'row', alignItems: 'center'}}>
                                        <CircleText title={characteristic.value} fontSize={22} size={45} />
                                        <Text style={[styles.cardTitle, {paddingLeft: 10}]}>{characteristic.name}</Text>
                                    </View>
                                </Body>
                                <Right style={{flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end'}}>
                                    <TouchableHighlight
                                        underlayColor='#121212'
                                        onPress={() => this.props.navigation.navigate('Result', dieRoller.rollCheck(characteristic.roll))}
                                    >
                                        <Text style={[styles.cardTitle, {paddingBottom: 2}]}>{characteristic.roll}</Text>
                                    </TouchableHighlight>
                                    <Icon
                                        type='FontAwesome'
                                        name={this.state.characteristicsButtonsShow[characteristic.shortName]}
                                        style={{paddingLeft: 10, fontSize: 25, color: '#14354d'}}
                                        onPress={() => this._toggleDefinitionShow(characteristic.shortName)}
                                    />
                                </Right>
                            </CardItem>
                            {this._renderDefinition(characteristic)}
                        </Card>
                    );
                })}
            </View>
        );
    }
}
