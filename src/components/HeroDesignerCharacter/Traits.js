import React, { Component, Fragment }  from 'react';
import PropTypes from 'prop-types';
import { View, TouchableHighlight, Alert } from 'react-native';
import { Text, Icon, Card, CardItem, Left, Right, Body } from 'native-base';
import Heading from '../Heading/Heading';
import CircleText from '../CircleText/CircleText';
import { dieRoller } from '../../lib/DieRoller';
import { TYPE_MOVEMENT, GENERIC_OBJECT } from '../../lib/HeroDesignerCharacter';
import { characterTraitDecorator } from '../../decorators/CharacterTraitDecorator';
import {
    SKILL_CHECK,
    NORMAL_DAMAGE,
    KILLING_DAMAGE,
    FREE_FORM,
    PARTIAL_DIE_PLUS_ONE,
    PARTIAL_DIE_HALF,
    PARTIAL_DIE_MINUS_ONE
} from '../../lib/DieRoller';
import { common } from '../../lib/Common';
import styles from '../../Styles';

export default class Traits extends Component {
    static propTypes = {
        navigation: PropTypes.object.isRequired,
        headingText: PropTypes.string.isRequired,
        character: PropTypes.object.isRequired,
        listKey: PropTypes.string.isRequired,
        subListKey: PropTypes.string.isRequired,
        updateForm: PropTypes.func.isRequired
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
            itemShow[item.id] = false;
            itemButtonShow[item.id] = 'plus-circle';

            if (item.hasOwnProperty(this.props.subListKey)) {
                if (Array.isArray(item[this.props.subListKey])) {
                    for (let s of item[this.props.subListKey]) {
                        itemShow[s.id] = false;
                        itemButtonShow[s.id] = 'plus-circle';
                    }
                } else {
                    itemShow[item[this.props.subListKey].id] = false;
                    itemButtonShow[item[this.props.subListKey].id] = 'plus-circle';
                }
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

    _roll(roll) {
        if (roll.type === SKILL_CHECK) {
            this.props.navigation.navigate('Result', {from: 'ViewHeroDesignerCharacter', result: dieRoller.rollCheck(roll.roll)});
        } else if (roll.type === NORMAL_DAMAGE) {
            let dice = common.toDice(roll.roll);

            this.props.updateForm('damage', {
                dice: dice.full,
                partialDie: dice.partial
            });

            this.props.navigation.navigate('Damage', {from: 'ViewHeroDesignerCharacter'});
        } else if (roll.type === KILLING_DAMAGE) {
            let dice = common.toDice(roll.roll);

            this.props.updateForm('damage', {
                dice: dice.full,
                partialDie: dice.partial,
                killingToggled: true,
                damageType: KILLING_DAMAGE
            });

            this.props.navigation.navigate('Damage', {from: 'ViewHeroDesignerCharacter'});
        } else if (roll.type === FREE_FORM) {
            let dice = common.toDice(roll.roll);
            let halfDice = 0;
            let pips = 0;

            switch (dice.partial) {
                case PARTIAL_DIE_HALF:
                    halfDice = 1;
                    break;
                case PARTIAL_DIE_PLUS_ONE:
                    pips = 1;
                    break;
                case PARTIAL_DIE_MINUS_ONE:
                    pips -1;
                    break;
                default:
                    // do nothing
            }

            this.props.navigation.navigate('Result', {from: 'ViewHeroDesignerCharacter', result: dieRoller.freeFormRoll(dice.full, halfDice, pips)});
        }
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
            return (
                <Fragment>
                    {item.attributes().map((attribute, index) => {
                        let labelStyle = attribute.value !== '' ? styles.boldGrey : styles.grey;
                        let separator = attribute.value !== '' ? ': ' : '';

                        return (
                            <Text>
                                <Text style={labelStyle}>{attribute.label}{separator}</Text>
                                <Text style={styles.grey}>{attribute.value}</Text>
                            </Text>
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
        if (item.definition() !== '' || item.attributes().length > 0) {
            return (
                <CardItem style={styles.cardItem}>
                    <Body>
                        {this._renderAttributes(item)}
                        <Text style={styles.grey}>{item.definition()}</Text>
                    </Body>
                </CardItem>
            );
        }

        return null;
    }

    _renderItemDetails(item) {
        if (this.state.itemShow[item.trait.id]) {
            if (item.trait.xmlid === 'COMPOUNDPOWER') {
                return this._renderCompoundPowerDetails(item);
            }

            return (
                <Fragment>
                    {this._renderDefinition(item)}
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

    _renderCompoundPowerDetails(item) {
        let powers = [];

        // The "powers" field is only available if the last decorator was the CompoundPowerDecorator
        // so we have to check here and decorate them manually if the last decorator is not the
        // CompoundPowerDecorator
        if (item.constructor.name === 'CompoundPower') {
            powers = item.powers;
        } else {
            for (let power of item.characterTrait.powers) {
                powers.push(characterTraitDecorator.decorate(power.trait, this.props.subListKey, item.characterTrait.getCharacter));
            }
        }

        return (
            <Fragment>
                {this._renderDefinition(item)}
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
                {powers.map((power, index) => {
                    return (
                        <Fragment>
                            <View style={{flex: 1, alignSelf: 'center'}}>
                                <Text style={styles.boldGrey}>{power.label()}</Text>
                            </View>
                            {this._renderCompoundPowerRoll(power)}
                            {this._renderDefinition(power)}
                            {this._renderAdvantagesAndLimitations(power)}
                            <CardItem style={styles.cardItem} footer>
                                <View style={{flex: 1, flexDirection: 'row', justifyContent: 'center'}}>
                                    <Text style={styles.grey}>
                                        <Text style={styles.boldGrey}>Base:</Text> {power.cost()}
                                    </Text>
                                    <View style={{width: 30, alignItems: 'center'}}><Text style={styles.grey}>—</Text></View>
                                    <Text style={styles.grey}>
                                        <Text style={styles.boldGrey}>Active:</Text> {power.activeCost()}
                                    </Text>
                                    <View style={{width: 30, alignItems: 'center'}}><Text style={styles.grey}>—</Text></View>
                                    <Text style={styles.grey}>
                                        <Text style={styles.boldGrey}>Real:</Text> {power.realCost()}
                                    </Text>
                                </View>
                            </CardItem>
                        </Fragment>
                    );
                })}
            </Fragment>
        );
    }

    _renderCompoundPowerRoll(power) {
        if (power.roll() !== null && power.roll() !== undefined) {
            return (
                <CardItem style={styles.cardItem}>
                <TouchableHighlight
                    underlayColor='#121212'
                    onPress={() => this._roll(power.roll())}
                >
                    <Text style={[styles.cardTitle, {paddingTop: 0}]}>Effect: {power.roll().roll}</Text>
                </TouchableHighlight>
                </CardItem>
            );
        }

        return null;
    }

    _renderRoll(item) {
        if (item.roll() !== null && item.roll() !== undefined) {
            return (
                <TouchableHighlight
                    underlayColor='#121212'
                    onPress={() => this._roll(item.roll())}
                >
                    <Text style={[styles.cardTitle, {paddingTop: 0}]}>{item.roll().roll}</Text>
                </TouchableHighlight>
            );
        }

        return null;
    }

    _renderTraitList(decoratedTrait) {
        return (
            <Card style={[styles.card, {paddingBottom: 0}]} key={'item-' + decoratedTrait.trait.position}>
                <CardItem style={[styles.cardItem, {flex: 1, flexDirection: 'row', alignItems: 'center', borderBottomWidth: 1, borderBottomColor: 'rgba(243, 237, 233, 0.6)'}]} header>
                    <View style={{flex: 5, alignSelf: 'center'}}>
                        <Text style={[styles.boldGrey, {fontSize: 18}]}>{decoratedTrait.label()}</Text>
                    </View>
                    <View style={{flex: 2, flexDirection: 'row', alignItems: 'center', justifyContent: 'center'}}>
                        <View style={{flex: 4, alignItems: 'flex-end'}}>
                            {this._renderRoll(decoratedTrait)}
                        </View>
                        <View style={{flex: 1}}>
                            <Icon
                                type='FontAwesome'
                                name={this.state.itemButtonShow[decoratedTrait.trait.id]}
                                style={{paddingLeft: 10, fontSize: 25, color: '#14354d'}}
                                onPress={() => this._toggleDefinitionShow(decoratedTrait.trait.id)}
                            />
                        </View>
                    </View>
                </CardItem>
                {this._renderItemDetails(decoratedTrait)}
                <View style={{backgroundColor: '#0e0e0f', paddingTop: 20}} />
                {decoratedTrait.trait[this.props.subListKey].map((item, index) => {
                    let decoratedSubTrait = characterTraitDecorator.decorate(item, this.props.listKey, this.getCharacter);

                    return (
                        <Fragment>
                            <CardItem style={[styles.cardItem, {flex: 1, flexDirection: 'row', alignItems: 'center', paddingTop: 5, paddingBottom: 5}]} header>
                                {this._renderTrait(decoratedSubTrait, true)}
                            </CardItem>
                            {this._renderItemDetails(decoratedSubTrait)}
                        </Fragment>
                    );
                })}
                <View style={{backgroundColor: '#0e0e0f', paddingBottom: 20}} />
            </Card>
        );
    }

    _renderTrait(decoratedTrait, isListItem=false) {
        return (
            <Fragment>
                <View style={{flex: 5, alignSelf: 'center'}}>
                    <Text style={[styles.boldGrey, {fontSize: (isListItem ? 16 : 18)}]}>{isListItem ? ' ‣ ' : ''}{decoratedTrait.label()}</Text>
                </View>
                <View style={{flex: 2, flexDirection: 'row', alignItems: 'center', justifyContent: 'center'}}>
                    <View style={{flex: 4, alignItems: 'flex-end'}}>
                        {this._renderRoll(decoratedTrait)}
                    </View>
                    <View style={{flex: 1}}>
                        <Icon
                            type='FontAwesome'
                            name={this.state.itemButtonShow[decoratedTrait.trait.id]}
                            style={{paddingLeft: 10, fontSize: (isListItem ? 20 : 25), color: '#14354d'}}
                            onPress={() => this._toggleDefinitionShow(decoratedTrait.trait.id)}
                        />
                    </View>
                </View>
            </Fragment>
        );
    }

    _renderTraits(items, indentItem=false) {
        return (
            <Fragment>
                {items.map((item, index) => {
                    let decoratedTrait = characterTraitDecorator.decorate(item, this.props.listKey, this.getCharacter);

                    if (decoratedTrait.trait.xmlid.toUpperCase() !== 'COMPOUNDPOWER' &&
                        decoratedTrait.trait.hasOwnProperty(this.props.subListKey) &&
                        decoratedTrait.trait[this.props.subListKey].length > 0) {
                        return this._renderTraitList(decoratedTrait);
                    }

                    return (
                        <Card style={styles.card} key={'item-' + decoratedTrait.trait.position}>
                            <CardItem style={[styles.cardItem, {flex: 1, flexDirection: 'row', alignItems: 'center', borderBottomWidth: 1, borderBottomColor: 'rgba(243, 237, 233, 0.6)'}]} header>
                                {this._renderTrait(decoratedTrait)}
                            </CardItem>
                            {this._renderItemDetails(decoratedTrait)}
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