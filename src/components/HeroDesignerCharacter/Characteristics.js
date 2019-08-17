import React, { Component, Fragment }  from 'react';
import PropTypes from 'prop-types';
import { View, TouchableHighlight, Alert } from 'react-native';
import { Text, Icon, Card, CardItem, Left, Right, Body } from 'native-base';
import Heading from '../Heading/Heading';
import CircleText from '../CircleText/CircleText';
import { dieRoller } from '../../lib/DieRoller';
import { TYPE_MOVEMENT } from '../../lib/HeroDesignerCharacter';
import styles from '../../Styles';

export default class Characteristics extends Component {
    static propTypes = {
        navigation: PropTypes.object.isRequired,
        characteristics: PropTypes.array.isRequired,
        movement: PropTypes.array.isRequired
    }

    constructor(props) {
        super(props);

        const displayOptions =  this._initCharacteristicsShow(props.characteristics, props.movement);

        this.state = {
            characteristicsShow: displayOptions.characteristicsShow,
            characteristicsButtonsShow: displayOptions.characteristicsButtonsShow
        }
    }

    _initCharacteristicsShow(characteristics, movement) {
        let characteristicsShow = {};
        let characteristicsButtonsShow = {};


        characteristics.map((characteristic, index) => {
            characteristicsShow[characteristic.shortName] = false;
            characteristicsButtonsShow[characteristic.shortName] = 'plus-circle';
        });

        movement.map((move, index) => {
            characteristicsShow[move.shortName] = false;
            characteristicsButtonsShow[move.shortName] = 'plus-circle';
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

    _renderDefinition(characteristic) {
        if (this.state.characteristicsShow[characteristic.shortName]) {
            return (
                <Fragment>
                    <CardItem style={styles.cardItem}>
                        <Body>
                            {this._renderNonCombatMovement(characteristic)}
                            <Text style={styles.grey}>{characteristic.definition}</Text>
                        </Body>
                    </CardItem>
                    <CardItem style={styles.cardItem} footer>
                        <Body style={{flex: 1, flexDirection: 'row', justifyContent: 'center'}}>
                            <Text style={styles.grey}>
                                <Text style={styles.boldGrey}>Base:</Text> {characteristic.base}
                            </Text>
                            <View style={{width: 20, alignItems: 'center'}}><Text style={styles.grey}>&bull;</Text></View>
                            <Text style={styles.grey}>
                                <Text style={styles.boldGrey}>Cost:</Text> {characteristic.cost}
                            </Text>
                        </Body>
                    </CardItem>
                </Fragment>
            );
        }

        return null;
    }

    _renderNonCombatMovement(characteristic) {
        if (characteristic.type === TYPE_MOVEMENT) {
            return (
                <Text style={[styles.grey, {paddingBottom: 10}]}>
                    <Text style={styles.boldGrey}>NCM:</Text> {characteristic.value * characteristic.ncm}m (x{characteristic.ncm})
                </Text>
            );
        }

        return null;
    }

    _renderStat(characteristic) {
        if (characteristic.type === TYPE_MOVEMENT) {
            return <CircleText title={characteristic.value + 'm'} fontSize={22} size={60} />
        }

        return <CircleText title={characteristic.value} fontSize={22} size={50} />
    }

    _renderCharacteristics(characteristics) {
        return (
            <Fragment>
                {characteristics.map((characteristic, index) => {
                    return (
                        <Card style={styles.card} key={'characteristic-' + index}>
                            <CardItem style={styles.cardItem}>
                                <Body>
                                    <View style={{flex: 1, flexDirection: 'row', alignItems: 'center'}}>
                                        {this._renderStat(characteristic)}
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
            </Fragment>
        );
    }

    render() {
        return (
            <View>
                <Heading text='Characteristics' />
                {this._renderCharacteristics(this.props.characteristics)}
                <View style={{paddingTop: 20}} />
                <Heading text='Movement' />
                {this._renderCharacteristics(this.props.movement)}
            </View>
        );
    }
}
