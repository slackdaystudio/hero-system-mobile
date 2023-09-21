import React, {Component, Fragment} from 'react';
import PropTypes from 'prop-types';
import {ImageBackground, View, TouchableHighlight} from 'react-native';
import {Text, CardItem, Body} from 'native-base';
import {scale, verticalScale} from 'react-native-size-matters';
import {AccordionCard} from '../Card/AccordionCard';
import {Card} from '../Card/Card';
import CircleButton from '../CircleButton/CircleButton';
import {dieRoller} from '../../lib/DieRoller';
import {characterTraitDecorator} from '../../decorators/CharacterTraitDecorator';
import {SKILL_CHECK, NORMAL_DAMAGE, KILLING_DAMAGE, EFFECT} from '../../lib/DieRoller';
import {common} from '../../lib/Common';
import CompoundPower from '../../decorators/CompoundPower';
import styles from '../../Styles';
import {Accordion} from '../Animated';
import {GENERIC_OBJECT} from '../../lib/HeroDesignerCharacter';

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

function initItemShow(items, subListKey) {
    let itemShow = {};

    items.map((item) => {
        itemShow[item.id] = false;

        if (item.hasOwnProperty(subListKey)) {
            if (Array.isArray(item[subListKey])) {
                for (let s of item[subListKey]) {
                    itemShow[s.id] = false;
                }
            } else {
                itemShow[item[subListKey].id] = false;
            }
        }
    });

    return {
        itemShow: itemShow,
    };
}

export default class Traits extends Component {
    static propTypes = {
        navigation: PropTypes.object.isRequired,
        headingText: PropTypes.string.isRequired,
        character: PropTypes.object.isRequired,
        listKey: PropTypes.string.isRequired,
        subListKey: PropTypes.string.isRequired,
        updateForm: PropTypes.func.isRequired,
    };

    constructor(props) {
        super(props);

        const displayOptions = initItemShow(props.character[props.listKey], props.subListKey);

        this.state = {
            itemShow: displayOptions.itemShow,
            character: props.character,
            listKey: props.listKey,
        };
    }

    static getDerivedStateFromProps(nextProps, prevState) {
        if (prevState.character !== nextProps.character || prevState.listKey !== nextProps.listKey) {
            const displayOptions = initItemShow(nextProps.character[nextProps.listKey], nextProps.subListKey);
            let newState = {...prevState};

            newState.itemShow = displayOptions.itemShow;
            newState.character = nextProps.character;
            newState.listKey = nextProps.listKey;

            return newState;
        }

        return null;
    }

    _toggleDefinitionShow(name) {
        let newState = {...this.state};
        newState.itemShow[name] = !newState.itemShow[name];

        this.setState(newState);
    }

    _roll(roll, decorated) {
        if (roll.type === SKILL_CHECK) {
            this.props.navigation.navigate('Result', {from: 'ViewHeroDesignerCharacter', result: dieRoller.rollCheck(roll.roll)});
        } else if (roll.type === NORMAL_DAMAGE) {
            let dice = common.toDice(roll.roll);

            this.props.updateForm({
                type: 'damage',
                json: {
                    dice: dice.full,
                    partialDie: dice.partial,
                    sfx: decorated.characterTrait.trait.sfx,
                },
            });

            this.props.navigation.navigate('Damage', {from: 'ViewHeroDesignerCharacter'});
        } else if (roll.type === KILLING_DAMAGE) {
            let dice = common.toDice(roll.roll);

            this.props.updateForm({
                type: 'damage',
                json: {
                    dice: dice.full,
                    partialDie: dice.partial,
                    killingToggled: true,
                    damageType: KILLING_DAMAGE,
                    sfx: decorated.characterTrait.trait.sfx,
                },
            });

            this.props.navigation.navigate('Damage', {from: 'ViewHeroDesignerCharacter'});
        } else if (roll.type === EFFECT) {
            let dice = common.toDice(roll.roll);
            let type = 'None';
            let sfx = decorated.characterTrait.trait.sfx;

            if (decorated.characterTrait.trait.hasOwnProperty('xmlid')) {
                type = decorated.characterTrait.trait.xmlid.toUpperCase();
            }

            this.props.navigation.navigate('Result', {from: 'ViewHeroDesignerCharacter', result: dieRoller.effectRoll(dice.full, dice.partial, type, sfx)});
        }
    }

    _renderModifiers(label, modifiers) {
        if (modifiers.length > 0) {
            return (
                <View style={{flex: 1}}>
                    <Text style={styles.boldGrey}>{label}</Text>
                    {modifiers.map((modifier, index) => {
                        return (
                            <View key={`mod-${modifier.xmlid}-${index}`} style={{flex: 1, flexDirection: 'row'}}>
                                <View>
                                    <Text style={styles.grey}> &bull; </Text>
                                </View>
                                <View flex={1} flexDirection="row" flexWrap="wrap">
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
                            <Text key={`attr-${item.id}-${index}`}>
                                <Text style={labelStyle}>
                                    {attribute.label}
                                    {separator}
                                </Text>
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
                <View>
                    {this._renderModifiers('Advantages', item.advantages())}
                    <View style={{paddingBottom: verticalScale(10)}} />
                    {this._renderModifiers('Limitations', item.limitations())}
                </View>
            );
        }

        return null;
    }

    _renderNotes(decorated) {
        if (decorated.characterTrait.trait.notes === null) {
            return null;
        }

        return (
            <CardItem style={styles.cardItem}>
                <Body>
                    <Text style={styles.grey}>
                        <Text style={styles.boldGrey}>Notes:</Text> {decorated.characterTrait.trait.notes}
                    </Text>
                </Body>
            </CardItem>
        );
    }

    _renderDefinition(item) {
        if (item.definition() !== '' || item.attributes().length > 0) {
            return (
                <View>
                    {this._renderAttributes(item)}
                    <Text style={styles.grey}>{item.definition()}</Text>
                </View>
            );
        }

        return null;
    }

    _renderItemDetails(item, showBottomBar = false) {
        if (this.state.itemShow[item.trait.id]) {
            if (item.trait.xmlid === 'COMPOUNDPOWER') {
                return this._renderCompoundPowerDetails(item);
            }

            return (
                <>
                    <View borderTopColor="#e8e8e8" borderTopWidth={0.5}>
                        {this._renderDefinition(item)}
                        {this._renderAdvantagesAndLimitations(item)}
                        {this._renderNotes(item)}
                        <View
                            flex={1}
                            flexDirection="row"
                            paddingTop={verticalScale(5)}
                            marginTop={verticalScale(10)}
                            borderTopWidth={0.5}
                            borderTopColor="#e8e8e8"
                        >
                            <View
                                style={{
                                    flex: 1,
                                    flexDirection: 'row',
                                    justifyContent: 'center',
                                    borderBottomWidth: showBottomBar ? 0.5 : 0,
                                    borderBottomColor: '#e8e8e8',
                                    paddingBottom: verticalScale(8),
                                }}
                            >
                                <Text style={styles.grey}>
                                    <Text style={styles.boldGrey}>Base:</Text> {item.cost()}
                                </Text>
                                <View style={{width: scale(30), alignItems: 'center'}}>
                                    <Text style={styles.grey}>—</Text>
                                </View>
                                <Text style={styles.grey}>
                                    <Text style={styles.boldGrey}>Active:</Text> {item.activeCost()}
                                </Text>
                                <View style={{width: scale(30), alignItems: 'center'}}>
                                    <Text style={styles.grey}>—</Text>
                                </View>
                                <Text style={styles.grey}>
                                    <Text style={styles.boldGrey}>Real:</Text> {item.realCost()}
                                </Text>
                            </View>
                        </View>
                    </View>
                </>
            );
        }

        return null;
    }

    _renderCompoundPowerDetails(item, showBottomBar = false) {
        let powers = [];

        // The "powers" field is only available if the last decorator was the CompoundPowerDecorator
        // so we have to check here and decorate them manually if the last decorator is not the
        // CompoundPowerDecorator
        if (item instanceof CompoundPower) {
            powers = item.powers;
        } else {
            for (let power of item.characterTrait.powers) {
                powers.push(characterTraitDecorator.decorate(power.trait, this.props.subListKey, () => this.props.character));
            }
        }

        return (
            <Fragment>
                {this._renderDefinition(item)}
                {this._renderAdvantagesAndLimitations(item)}
                {this._renderNotes(item)}
                <CardItem style={styles.cardItem} footer>
                    <View
                        style={{
                            flex: 1,
                            flexDirection: 'row',
                            justifyContent: 'center',
                            borderBottomWidth: showBottomBar ? 0.5 : 0,
                            borderBottomColor: '#e8e8e8',
                            paddingBottom: verticalScale(8),
                        }}
                    >
                        <Text style={styles.grey}>
                            <Text style={styles.boldGrey}>Base:</Text> {item.cost()}
                        </Text>
                        <View style={{width: scale(30), alignItems: 'center'}}>
                            <Text style={styles.grey}>—</Text>
                        </View>
                        <Text style={styles.grey}>
                            <Text style={styles.boldGrey}>Active:</Text> {item.activeCost()}
                        </Text>
                        <View style={{width: scale(30), alignItems: 'center'}}>
                            <Text style={styles.grey}>—</Text>
                        </View>
                        <Text style={styles.grey}>
                            <Text style={styles.boldGrey}>Real:</Text> {item.realCost()}
                        </Text>
                    </View>
                </CardItem>
                {powers.map((power) => {
                    return (
                        <View key={`cp-${power.trait.id}`}>
                            <View style={{flex: 1, alignSelf: 'center'}}>
                                <Text style={styles.boldGrey}>{power.label()}</Text>
                            </View>
                            {this._renderCompoundPowerRoll(power)}
                            {this._renderDefinition(power)}
                            {this._renderAdvantagesAndLimitations(power)}
                            {this._renderNotes(power)}
                            <CardItem style={styles.cardItem} footer>
                                <View
                                    style={{
                                        flex: 1,
                                        flexDirection: 'row',
                                        justifyContent: 'center',
                                        borderBottomWidth: showBottomBar ? 0.5 : 0,
                                        borderBottomColor: '#e8e8e8',
                                        paddingBottom: verticalScale(8),
                                    }}
                                >
                                    <Text style={styles.grey}>
                                        <Text style={styles.boldGrey}>Base:</Text> {power.cost()}
                                    </Text>
                                    <View style={{width: scale(30), alignItems: 'center'}}>
                                        <Text style={styles.grey}>—</Text>
                                    </View>
                                    <Text style={styles.grey}>
                                        <Text style={styles.boldGrey}>Active:</Text> {power.activeCost()}
                                    </Text>
                                    <View style={{width: scale(30), alignItems: 'center'}}>
                                        <Text style={styles.grey}>—</Text>
                                    </View>
                                    <Text style={styles.grey}>
                                        <Text style={styles.boldGrey}>Real:</Text> {power.realCost()}
                                    </Text>
                                </View>
                            </CardItem>
                        </View>
                    );
                })}
            </Fragment>
        );
    }

    _renderCompoundPowerRoll(power) {
        if (power.roll() !== null && power.roll() !== undefined) {
            return (
                <CardItem style={styles.cardItem}>
                    <TouchableHighlight underlayColor="#121212" onPress={() => this._roll(power.roll(), power)}>
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
                <TouchableHighlight underlayColor="#121212" onPress={() => this._roll(item.roll(), item)}>
                    <Text style={[styles.cardTitle, {paddingTop: 0}]}>{item.roll().roll}</Text>
                </TouchableHighlight>
            );
        }

        return null;
    }

    _renderTraitList(decoratedTrait) {
        return (
            <View key={`trait-list-${decoratedTrait.characterTrait.trait.id}`} paddingBottom={verticalScale(10)}>
                <Card
                    heading={
                        <View flex={1} flexDirection="row">
                            <Text style={[styles.boldGrey, {paddingVertical: verticalScale(5), fontSize: verticalScale(16)}]}>{decoratedTrait.label()}</Text>
                            <View style={{flex: 2, alignItems: 'flex-end'}}>{this._renderRoll(decoratedTrait)}</View>
                        </View>
                    }
                    body={
                        <View paddingTop={verticalScale(5)}>
                            {decoratedTrait.trait[this.props.subListKey].map((item) => {
                                const decoratedSubTrait = characterTraitDecorator.decorate(item, this.props.listKey, () => this.props.character);

                                return (
                                    <Fragment key={`trait-${item.id}`}>
                                        <View
                                            style={[
                                                styles.cardItem,
                                                {
                                                    flex: 1,
                                                    flexDirection: 'row',
                                                    alignItems: 'center',
                                                },
                                            ]}
                                        >
                                            {this._renderTrait(decoratedSubTrait, true)}
                                        </View>
                                        <Accordion animationProps={{collapsed: !this.state.itemShow[decoratedSubTrait.trait.id], duration: 500}}>
                                            {this._renderItemDetails(decoratedSubTrait, true)}
                                        </Accordion>
                                    </Fragment>
                                );
                            })}
                        </View>
                    }
                    footer={
                        <>
                            <Accordion animationProps={{collapsed: !this.state.itemShow[decoratedTrait.trait.id], duration: 500}}>
                                {this._renderItemDetails(decoratedTrait)}
                            </Accordion>
                            <View flex={1} flexDirection="row" justifyContent="center">
                                <CircleButton
                                    name="eye"
                                    size={25}
                                    fontSize={12}
                                    color="#e8e8e8"
                                    onPress={() => this._toggleDefinitionShow(decoratedTrait.trait.id)}
                                />
                            </View>
                        </>
                    }
                />
            </View>
        );
    }

    _renderTrait(decoratedTrait, isListItem = false) {
        return (
            <Fragment>
                <View style={{flex: 2, alignItems: 'flex-start'}}>
                    <Text style={[styles.boldGrey, {fontSize: verticalScale(isListItem ? 16 : 18)}]}>{decoratedTrait.label()}</Text>
                </View>
                <View style={{flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center'}}>
                    <View style={{flex: 2, alignItems: 'flex-end'}}>{this._renderRoll(decoratedTrait)}</View>
                    <View style={{flex: 1.75, alignItems: 'flex-end'}}>
                        <CircleButton name="eye" size={25} fontSize={12} color="#e8e8e8" onPress={() => this._toggleDefinitionShow(decoratedTrait.trait.id)} />
                    </View>
                </View>
            </Fragment>
        );
    }

    _renderTraits(items) {
        if (items.length === 0) {
            return null;
        }

        return (
            <View flexDirection="column" justifyContent="flex-start" paddingTop={verticalScale(20)}>
                {items.map((item) => {
                    let decoratedTrait = characterTraitDecorator.decorate(item, this.props.listKey, () => this.props.character);

                    if (decoratedTrait.trait.xmlid.toUpperCase() === GENERIC_OBJECT && decoratedTrait.trait.powers.length === 0) {
                        return null;
                    }

                    if (
                        decoratedTrait.trait.xmlid.toUpperCase() !== 'COMPOUNDPOWER' &&
                        decoratedTrait.trait.hasOwnProperty(this.props.subListKey) &&
                        decoratedTrait.trait[this.props.subListKey].length > 0
                    ) {
                        return this._renderTraitList(decoratedTrait);
                    }

                    return (
                        <View key={`trait-${item.id}`} paddingBottom={verticalScale(10)}>
                            <AccordionCard
                                title={
                                    <Text style={[styles.boldGrey, {paddingVertical: verticalScale(5), fontSize: verticalScale(16)}]}>
                                        {''}
                                        {decoratedTrait.label()}
                                    </Text>
                                }
                                secondaryTitle={
                                    <>
                                        <View style={{flex: 2, alignItems: 'flex-end'}}>{this._renderRoll(decoratedTrait)}</View>
                                    </>
                                }
                                content={this._renderItemDetails(decoratedTrait)}
                                footerButtons={
                                    <View flex={1} flexDirection="row" justifyContent="space-around">
                                        <CircleButton
                                            name="eye"
                                            size={25}
                                            fontSize={12}
                                            color="#e8e8e8"
                                            onPress={() => this._toggleDefinitionShow(decoratedTrait.trait.id)}
                                        />
                                    </View>
                                }
                                showContent={this.state.itemShow[decoratedTrait.trait.id]}
                            />
                        </View>
                    );
                })}
            </View>
        );
    }

    render() {
        return (
            <ImageBackground source={require('../../../public/background.png')} style={{flex: 1, flexDirection: 'column'}} imageStyle={{resizeMode: 'repeat'}}>
                {this._renderTraits(this.props.character[this.props.listKey])}
                <View flex={0} flexBasis={1} style={{paddingTop: verticalScale(20)}} />
            </ImageBackground>
        );
    }
}
