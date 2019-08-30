import React, { Component, Fragment }  from 'react';
import PropTypes from 'prop-types';
import { View, TouchableHighlight, Alert } from 'react-native';
import { Text, Icon, Card, CardItem, Left, Right, Body } from 'native-base';
import Heading from '../Heading/Heading';
import CircleText from '../CircleText/CircleText';
import { dieRoller } from '../../lib/DieRoller';
import { TYPE_MOVEMENT, GENERIC_OBJECT } from '../../lib/HeroDesignerCharacter';
import { characterTraitDecorator } from '../../decorators/CharacterTraitDecorator';
import styles from '../../Styles';

export default class Traits extends Component {
    static propTypes = {
        navigation: PropTypes.object.isRequired,
        headingText: PropTypes.string.isRequired,
        character: PropTypes.object.isRequired,
        listKey: PropTypes.string.isRequired
    }

    constructor(props) {
        super(props);

        const displayOptions =  this._initItemShow(props.character[props.listKey]);

        this.state = {
            itemShow: displayOptions.itemShow,
            itemButtonShow: displayOptions.itemButtonShow
        }

        this.getCharacter = this._getCharacter.bind(this);
    }

    _initItemShow(items) {
        let itemShow = {};
        let itemButtonShow = {};

        items.map((item, index) => {
            if (item.hasOwnProperty(this.props.listKey)) {
                for (let s of item[this.props.listKey]) {
                    itemShow[s.id] = false;
                    itemButtonShow[s.id] = 'plus-circle';
                }
            } else {
                itemShow[item.id] = false;
                itemButtonShow[item.id] = 'plus-circle';
            }
        });

        return {
            itemShow: itemShow,
            itemButtonShow: itemButtonShow
        };
    }

    _getCharacter() {
        return this.props.character;
    }

    _toggleDefinitionShow(name) {
        let newState = {...this.state};
        newState.itemShow[name] = !newState.itemShow[name];
        newState.itemButtonShow[name] = newState.itemButtonShow[name] === 'plus-circle' ? 'minus-circle' : 'plus-circle';

        this.setState(newState);
    }

    _renderModifiers(label, modifiers) {
        if (modifiers.length > 0) {
            return (
                <View style={{flex: 1}}>
                    <Text style={styles.boldGrey}>{label}</Text>
                    {modifiers.map((modifier, index) => {
                        return (
                            <View style={{flex: 1, flexDirection: 'row'}}>
                                <View>
                                    <Text style={styles.grey}> &bull; </Text>
                                </View>
                                <View>
                                    <Text style={styles.grey}>{modifier.label}</Text>
                                </View>
                            </View>
                        );
                    })}
                </View>
            );
        }

        return null;
    }

    _renderAttributes(item) {
        if (item.attributes().length > 0) {
//            const sortedAttributes = item.attributes().sort((a, b) => a.value < b.value);

            return (
                <Fragment>
                    {item.attributes().map((attribute, index) => {
                        let labelStyle = attribute.value !== '' ? styles.boldGrey : styles.grey;
                        let separator = attribute.value !== '' ? ': ' : '';

                        return (
                            <View style={{flex: 1, flexDirection: 'row'}}>
                                <View>
                                    <Text style={labelStyle}>{attribute.label}{separator}</Text>
                                </View>
                                <View>
                                    <Text style={styles.grey}>{attribute.value}</Text>
                                </View>
                            </View>
                        );
                    })}
                    <View style={{paddingBottom: 20}} />
                </Fragment>
            );
        }

        return null;
    }

    _renderAdvantagesAndLimitations(item) {
        if (item.advantages().length > 0 || item.limitations().length > 0) {
            return (
                <CardItem style={styles.cardItem}>
                    <Body>
                        {this._renderModifiers('Advantages', item.advantages())}
                        {this._renderModifiers('Limitations', item.limitations())}
                    </Body>
                </CardItem>
            );
        }

        return null;
    }

    _renderDefinition(item) {
        if (this.state.itemShow[item.trait.id]) {
            return (
                <Fragment>
                    <CardItem style={styles.cardItem}>
                        <Body>
                            {this._renderAttributes(item)}
                            <Text style={styles.grey}>{item.definition()}</Text>
                        </Body>
                    </CardItem>
                    {this._renderAdvantagesAndLimitations(item)}
                    <CardItem style={styles.cardItem} footer>
                        <View style={{flex: 1, flexDirection: 'row', justifyContent: 'center'}}>
                            <Text style={styles.grey}>
                                <Text style={styles.boldGrey}>Base:</Text> {item.cost()}
                            </Text>
                            <View style={{width: 30, alignItems: 'center'}}><Text style={styles.grey}>—</Text></View>
                            <Text style={styles.grey}>
                                <Text style={styles.boldGrey}>Active:</Text> {item.activeCost()}
                            </Text>
                            <View style={{width: 30, alignItems: 'center'}}><Text style={styles.grey}>—</Text></View>
                            <Text style={styles.grey}>
                                <Text style={styles.boldGrey}>Real:</Text> {item.realCost()}
                            </Text>
                        </View>
                    </CardItem>
                </Fragment>
            );
        }

        return null;
    }

    _renderRoll(item) {
        if (item.roll() !== null) {
            return (
                <TouchableHighlight
                    underlayColor='#121212'
                    onPress={() => this.props.navigation.navigate('Result', dieRoller.rollCheck(item.roll()))}
                >
                    <Text style={[styles.cardTitle, {paddingTop: 0}]}>{item.roll()}</Text>
                </TouchableHighlight>
            );
        }

        return null;
    }

    _renderTraits(items, indentCard=false) {
        return (
            <Fragment>
                {items.map((item, index) => {
                    let decoratedTrait = characterTraitDecorator.decorate(item, this.props.listKey, this.getCharacter);

                    if (decoratedTrait.trait.hasOwnProperty(this.props.listKey)) {
                        return (
                            <Fragment>
                                <Card style={styles.card} key={'item-' + item.position}>
                                    <CardItem style={[styles.cardItem, {flex: 1, flexDirection: 'row', alignItems: 'center'}]} header>
                                        <View style={{flex: 5, alignSelf: 'center'}}>
                                            <Text style={styles.grey}>{decoratedTrait.label()}</Text>
                                        </View>
                                    </CardItem>
                                </Card>
                                {this._renderTraits(decoratedTrait.trait[this.props.listKey], true)}
                            </Fragment>
                        );
                    }

                    return (
                        <Card style={[styles.card, {width: (indentCard ? '94%' : '99%'), alignSelf: 'flex-end'}]} key={'item-' + item.position}>
                            <CardItem style={[styles.cardItem, {flex: 1, flexDirection: 'row', alignItems: 'center'}]} header>
                                <View style={{flex: 5, alignSelf: 'center'}}>
                                    <Text style={styles.grey}>{decoratedTrait.label()}</Text>
                                </View>
                                <View style={{flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center'}}>
                                    {this._renderRoll(decoratedTrait)}
                                    <Icon
                                        type='FontAwesome'
                                        name={this.state.itemButtonShow[decoratedTrait.trait.id]}
                                        style={{paddingLeft: 10, fontSize: 25, color: '#14354d'}}
                                        onPress={() => this._toggleDefinitionShow(decoratedTrait.trait.id)}
                                    />
                                </View>
                            </CardItem>
                            {this._renderDefinition(decoratedTrait)}
                        </Card>
                    );
                })}
            </Fragment>
        );
    }

    render() {
        return (
            <View>
                <Heading text={this.props.headingText} />
                {this._renderTraits(this.props.character[this.props.listKey])}
                <View style={{paddingTop: 20}} />
            </View>
        );
    }
}