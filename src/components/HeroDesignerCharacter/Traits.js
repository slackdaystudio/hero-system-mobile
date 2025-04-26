import React, {Fragment, useState} from 'react';
import {View, Text, TouchableHighlight} from 'react-native';
import {scale, verticalScale} from 'react-native-size-matters';
import {AccordionCard, BulletedLabel} from '../Card/AccordionCard';
import {Card} from '../Card/Card';
import {CircleButton} from '../CircleButton/CircleButton';
import {dieRoller} from '../../lib/DieRoller';
import {characterTraitDecorator} from '../../decorators/CharacterTraitDecorator';
import {SKILL_CHECK, NORMAL_DAMAGE, KILLING_DAMAGE, EFFECT} from '../../lib/DieRoller';
import {common} from '../../lib/Common';
import CompoundPower from '../../decorators/CompoundPower';
import {Accordion} from '../Animated';
import {GENERIC_OBJECT} from '../../lib/HeroDesignerCharacter';
import {useNavigation} from '@react-navigation/native';
import {useSelector} from 'react-redux';
import {useColorTheme} from '../../hooks/useColorTheme';

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

const initItemShow = (items, subListKey) => {
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

    return itemShow;
};

export const Traits = ({headingText, character, listKey, subListKey, updateForm}) => {
    const navigation = useNavigation();

    const [itemShow, setItemShow] = useState(initItemShow(character[listKey], subListKey));

    const scheme = useSelector((state) => state.settings.colorScheme);

    const {Colors, styles} = useColorTheme(scheme);

    const toggleDefinitionShow = (name) => {
        const newItemShow = {...itemShow};

        newItemShow[name] = !newItemShow[name];

        setItemShow(newItemShow);
    };

    const roll = (rollConfig, decorated) => {
        if (rollConfig.type === SKILL_CHECK) {
            navigation.navigate('Result', {from: 'ViewHeroDesignerCharacter', result: dieRoller.rollCheck(rollConfig.roll)});
        } else if (rollConfig.type === NORMAL_DAMAGE) {
            let dice = common.toDice(rollConfig.roll);

            updateForm({
                type: 'damage',
                json: {
                    dice: dice.full,
                    partialDie: dice.partial,
                    sfx: decorated.characterTrait.trait.sfx,
                },
            });

            navigation.navigate('Damage', {from: 'ViewHeroDesignerCharacter'});
        } else if (rollConfig.type === KILLING_DAMAGE) {
            let dice = common.toDice(rollConfig.roll);

            updateForm({
                type: 'damage',
                json: {
                    dice: dice.full,
                    partialDie: dice.partial,
                    killingToggled: true,
                    damageType: KILLING_DAMAGE,
                    sfx: decorated.characterTrait.trait.sfx,
                },
            });

            navigation.navigate('Damage', {from: 'ViewHeroDesignerCharacter'});
        } else if (rollConfig.type === EFFECT) {
            let dice = common.toDice(rollConfig.roll);
            let type = 'None';
            let sfx = decorated.characterTrait.trait.sfx;

            if (decorated.characterTrait.trait.hasOwnProperty('xmlid')) {
                type = decorated.characterTrait.trait.xmlid.toUpperCase();
            }

            navigation.navigate('Result', {from: 'ViewHeroDesignerCharacter', result: dieRoller.effectRoll(dice.full, dice.partial, type, sfx)});
        }
    };

    const renderModifiers = (label, modifiers) => {
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
    };

    const renderAttributes = (item) => {
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
    };

    const renderAdvantagesAndLimitations = (item) => {
        if (item.advantages().length > 0 || item.limitations().length > 0) {
            return (
                <View>
                    {renderModifiers('Advantages', item.advantages())}
                    <View style={{paddingBottom: verticalScale(10)}} />
                    {renderModifiers('Limitations', item.limitations())}
                </View>
            );
        }

        return null;
    };

    const renderNotes = (decorated) => {
        if (decorated.characterTrait.trait.notes === null) {
            return null;
        }

        return (
            <View style={styles.cardItem}>
                <Text style={styles.grey}>
                    <Text style={styles.boldGrey}>Notes:</Text> {decorated.characterTrait.trait.notes}
                </Text>
            </View>
        );
    };

    const renderDefinition = (item) => {
        if (item.definition() !== '' || item.attributes().length > 0) {
            return (
                <View>
                    {renderAttributes(item)}
                    <Text style={styles.grey}>{item.definition()}</Text>
                </View>
            );
        }

        return null;
    };

    const renderItemDetails = (item, showBottomBar = false) => {
        if (itemShow[item.trait.id]) {
            if (item.trait.xmlid === 'COMPOUNDPOWER') {
                return renderCompoundPowerDetails(item);
            }

            return (
                <>
                    <View borderTopColor={Colors.background} borderTopWidth={0.5}>
                        {renderDefinition(item)}
                        {renderAdvantagesAndLimitations(item)}
                        {renderNotes(item)}
                        <View
                            flex={1}
                            flexDirection="row"
                            paddingTop={verticalScale(5)}
                            marginTop={verticalScale(10)}
                            borderTopWidth={0.5}
                            borderTopColor={Colors.background}
                        >
                            <View
                                style={{
                                    flex: 1,
                                    flexDirection: 'row',
                                    justifyContent: 'center',
                                    borderBottomWidth: showBottomBar ? 0.5 : 0,
                                    borderBottomColor: Colors.background,
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
    };

    const renderCompoundPowerDetails = (item, showBottomBar = false) => {
        let powers = [];

        // The "powers" field is only available if the last decorator was the CompoundPowerDecorator
        // so we have to check here and decorate them manually if the last decorator is not the
        // CompoundPowerDecorator
        if (item instanceof CompoundPower) {
            powers = item.powers;
        } else {
            for (let power of item.characterTrait.powers) {
                powers.push(characterTraitDecorator.decorate(power.trait, subListKey, () => character));
            }
        }

        return (
            <Fragment>
                {renderDefinition(item)}
                {renderAdvantagesAndLimitations(item)}
                {renderNotes(item)}
                <View style={styles.cardItem}>
                    <View
                        style={{
                            flex: 1,
                            flexDirection: 'row',
                            justifyContent: 'center',
                            borderBottomWidth: showBottomBar ? 0.5 : 0,
                            borderBottomColor: Colors.background,
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
                {powers.map((power) => {
                    return (
                        <View key={`cp-${power.trait.id}`}>
                            <View style={{flex: 1, alignSelf: 'center'}}>
                                <Text style={styles.boldGrey}>{power.label()}</Text>
                            </View>
                            {renderCompoundPowerRoll(power)}
                            {renderDefinition(power)}
                            {renderAdvantagesAndLimitations(power)}
                            {renderNotes(power)}
                            <View style={styles.cardItem}>
                                <View
                                    style={{
                                        flex: 1,
                                        flexDirection: 'row',
                                        justifyContent: 'center',
                                        borderBottomWidth: showBottomBar ? 0.5 : 0,
                                        borderBottomColor: Colors.background,
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
                            </View>
                        </View>
                    );
                })}
            </Fragment>
        );
    };

    const renderCompoundPowerRoll = (power) => {
        if (power.roll() !== null && power.roll() !== undefined) {
            return (
                <View style={styles.cardItem}>
                    <TouchableHighlight underlayColor={Colors.secondaryForm} onPress={() => roll(power.roll(), power)}>
                        <Text style={[styles.cardTitle, {paddingTop: 0}]}>Effect: {power.roll().roll}</Text>
                    </TouchableHighlight>
                </View>
            );
        }

        return null;
    };

    const renderRoll = (item) => {
        if (item.roll() !== null && item.roll() !== undefined) {
            return (
                <TouchableHighlight underlayColor={Colors.secondaryForm} onPress={() => roll(item.roll(), item)}>
                    <Text style={[styles.grey, {paddingTop: 0}]}>{item.roll().roll}</Text>
                </TouchableHighlight>
            );
        }

        return null;
    };

    const renderTraitList = (decoratedTrait) => {
        return (
            <View key={`trait-list-${decoratedTrait.characterTrait.trait.id}`} paddingBottom={verticalScale(10)} paddingHorizontal={scale(10)}>
                <Card
                    heading={
                        <View flex={1} flexDirection="row">
                            <Text
                                style={[
                                    styles.grey,
                                    {
                                        paddingVertical: verticalScale(5),
                                        fontSize: verticalScale(16),
                                        fontFamily: 'Roboto',
                                        fontVariant: 'small-caps',
                                        paddingLeft: scale(10),
                                    },
                                ]}
                            >
                                {decoratedTrait.label()}
                            </Text>
                            <View style={{flex: 2, alignItems: 'flex-end'}}>{renderRoll(decoratedTrait)}</View>
                        </View>
                    }
                    body={
                        <>
                            {decoratedTrait.trait[subListKey].map((item) => {
                                const decoratedSubTrait = characterTraitDecorator.decorate(item, listKey, () => character);

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
                                            {renderTrait(decoratedSubTrait, true)}
                                        </View>
                                        <Accordion animationProps={{collapsed: !itemShow[decoratedSubTrait.trait.id], duration: 500}}>
                                            <View paddingLeft={scale(28)}>{renderItemDetails(decoratedSubTrait, true)}</View>
                                        </Accordion>
                                    </Fragment>
                                );
                            })}
                        </>
                    }
                    footer={
                        <View flex={1} justifyContent="center">
                            <Accordion animationProps={{collapsed: !itemShow[decoratedTrait.trait.id], duration: 500}}>
                                <View paddingLeft={scale(28)}>{renderItemDetails(decoratedTrait, true)}</View>
                            </Accordion>
                            <View flex={1} flexDirection="row" justifyContent="center">
                                <CircleButton name="eye" size={30} fontSize={15} onPress={() => toggleDefinitionShow(decoratedTrait.trait.id)} />
                            </View>
                        </View>
                    }
                />
            </View>
        );
    };

    const renderTrait = (decoratedTrait, isListItem = false) => {
        return (
            <View paddingVertical={isListItem ? verticalScale(5) : 0} style={{flex: 1, flexDirection: 'row', alignItems: 'center'}}>
                <View style={{flex: 2, alignItems: 'flex-start', paddingLeft: isListItem ? scale(10) : 0}}>
                    <BulletedLabel
                        label={decoratedTrait.label()}
                        onTitlePress={() => toggleDefinitionShow(decoratedTrait.trait.id)}
                        showContent={itemShow[decoratedTrait.trait.id]}
                        styles={styles}
                        Colors={Colors}
                    />
                </View>
                <View style={{flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center'}}>
                    <View style={{flex: 2, alignItems: 'flex-end', paddingRight: isListItem ? scale(10) : 0}}>{renderRoll(decoratedTrait)}</View>
                </View>
            </View>
        );
    };

    const renderTraits = (items) => {
        if (items.length === 0) {
            return null;
        }

        return (
            <View flexDirection="column" justifyContent="flex-start" paddingTop={verticalScale(20)}>
                {items.map((item) => {
                    let decoratedTrait = characterTraitDecorator.decorate(item, listKey, () => character);

                    if (
                        decoratedTrait.trait.xmlid.toUpperCase() === GENERIC_OBJECT &&
                        decoratedTrait.trait.hasOwnProperty(listKey) &&
                        decoratedTrait.trait[listKey].length === 0
                    ) {
                        return null;
                    }

                    if (
                        decoratedTrait.trait.xmlid.toUpperCase() !== 'COMPOUNDPOWER' &&
                        decoratedTrait.trait.hasOwnProperty(subListKey) &&
                        decoratedTrait.trait[subListKey].length > 0
                    ) {
                        return renderTraitList(decoratedTrait);
                    }

                    return (
                        <View key={`trait-${item.id}`} paddingBottom={verticalScale(10)} paddingHorizontal={scale(10)}>
                            <AccordionCard
                                title={<Text style={{fontFamily: 'Roboto', fontVariant: 'small-caps'}}>{decoratedTrait.label()}</Text>}
                                onTitlePress={() => toggleDefinitionShow(decoratedTrait.trait.id)}
                                secondaryTitle={
                                    <>
                                        <View style={{flex: 2, alignItems: 'flex-end'}}>{renderRoll(decoratedTrait)}</View>
                                    </>
                                }
                                content={renderItemDetails(decoratedTrait)}
                                showContent={itemShow[decoratedTrait.trait.id]}
                            />
                        </View>
                    );
                })}
            </View>
        );
    };

    return (
        <>
            {renderTraits(character[listKey])}
            <View flex={0} flexBasis={1} style={{paddingTop: verticalScale(20)}} />
        </>
    );
};
