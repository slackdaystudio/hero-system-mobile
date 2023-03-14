import React, {Component, Fragment} from 'react';
import PropTypes from 'prop-types';
import {View, TouchableHighlight, Switch} from 'react-native';
import {Text, Icon, Card, CardItem, Right, Body} from 'native-base';
import {scale, verticalScale} from 'react-native-size-matters';
import Heading from '../Heading/Heading';
import CircleText from '../CircleText/CircleText';
import {dieRoller} from '../../lib/DieRoller';
import {common} from '../../lib/Common';
import {heroDesignerCharacter, TYPE_MOVEMENT} from '../../lib/HeroDesignerCharacter';
import styles from '../../Styles';
import strengthTable from '../../../public/strengthTable.json';
import speedTable from '../../../public/speed.json';

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

function initCharacteristicsShow(characteristics, movement) {
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
        characteristicsButtonsShow: characteristicsButtonsShow,
    };
}

export default class Characteristics extends Component {
    static propTypes = {
        navigation: PropTypes.object.isRequired,
        character: PropTypes.object.isRequired,
        setShowSecondary: PropTypes.func.isRequired,
        updateForm: PropTypes.func.isRequired,
    };

    constructor(props) {
        super(props);

        const displayOptions = initCharacteristicsShow(props.character.characteristics, props.character.movement);

        this.state = {
            characteristicsShow: displayOptions.characteristicsShow,
            characteristicsButtonsShow: displayOptions.characteristicsButtonsShow,
            character: props.character,
            powersMap: common.toMap(common.flatten(props.character.powers, 'powers')),
        };
    }

    static getDerivedStateFromProps(nextProps, prevState) {
        if (prevState.character !== nextProps.character) {
            const displayOptions = initCharacteristicsShow(nextProps.character.characteristics, nextProps.character.movement);
            let newState = {...prevState};

            newState.characteristicsShow = displayOptions.characteristicsShow;
            newState.characteristicsButtonsShow = displayOptions.characteristicsButtonsShow;
            newState.character = nextProps.character;
            newState.powersMap = common.toMap(common.flatten(nextProps.character.powers, 'powers'));

            return newState;
        }

        return null;
    }

    _toggleDefinitionShow(name) {
        let newState = {...this.state};
        newState.characteristicsShow[name] = !newState.characteristicsShow[name];
        newState.characteristicsButtonsShow[name] = newState.characteristicsButtonsShow[name] === 'plus-circle' ? 'minus-circle' : 'plus-circle';

        this.setState(newState);
    }

    _getMovementTotal(characteristic, formatFraction = false) {
        let meters = characteristic.value;

        if (characteristic.shortName.toUpperCase() === 'LEAPING' && heroDesignerCharacter.isFifth(this.props.character)) {
            let total = heroDesignerCharacter.getAdditionalCharacteristicPoints('STR', this.props.character) / 5;
            let fractionalPart = parseFloat((total % 1).toFixed(1));

            if (fractionalPart >= 0.6) {
                total = Math.trunc(total) + 0.5;
            } else {
                total = Math.trunc(total);
            }

            meters = characteristic.base + total;
        }

        if (this.state.powersMap.has(characteristic.shortName.toUpperCase())) {
            meters = this._getTotalMeters(this.state.powersMap.get(characteristic.shortName.toUpperCase()), meters);
        }

        if (formatFraction) {
            let fractionalMeters = parseFloat((meters % 1).toFixed(1));

            if (fractionalMeters >= 0.5) {
                meters = `${Math.trunc(meters)}½`;
            } else {
                meters = Math.trunc(meters);
            }
        }

        return meters;
    }

    _getTotalMeters(movementMode, meters) {
        if (Array.isArray(movementMode)) {
            for (let move of movementMode) {
                meters += this._getTotalMeters(move, meters);
            }
        } else {
            if (movementMode.affectsPrimary && movementMode.affectsTotal) {
                meters += movementMode.levels;
            } else if (!movementMode.affectsPrimary && movementMode.affectsTotal && this.props.character.showSecondary) {
                meters += movementMode.levels;
            }
        }

        return meters;
    }

    _getStrengthDamage(strength) {
        let damage = strength / 5;
        let fractionalPart = parseFloat((damage % 1).toFixed(1));

        if (fractionalPart > 0.0) {
            if (fractionalPart >= 0.6) {
                damage = `${Math.trunc(damage)}½`;
            } else {
                damage = Math.trunc(damage);
            }
        }

        return `${damage}d6`;
    }

    _rollStrengthDamage(strengthDamage) {
        let dice = common.toDice(strengthDamage);

        this.props.updateForm('damage', {
            dice: dice.full,
            partialDie: dice.partial,
        });

        this.props.navigation.navigate('Damage', {from: 'ViewHeroDesignerCharacter'});
    }

    _renderNotes(characteristic) {
        let whitelistedCharacteristics = ['DEX', 'INT', 'EGO', 'SPD'];

        if (whitelistedCharacteristics.includes(characteristic.shortName.toUpperCase())) {
            let note = {
                label: '',
                text: '',
            };

            if (characteristic.shortName.toUpperCase() === 'INT') {
                // TODO: total all sources or PER modifiers
                note.label = 'PER';
                note.text = heroDesignerCharacter.getRollTotal(characteristic, this.props.character);
            } else if (characteristic.shortName.toUpperCase() === 'SPD') {
                note.label = 'Phases';
                note.text = speedTable[heroDesignerCharacter.getCharacteristicTotal('SPD', this.props.character).toString()].phases.join(', ');
            }

            if (heroDesignerCharacter.isFifth(this.props.character)) {
                if (characteristic.shortName.toUpperCase() === 'DEX') {
                    let cv = common.roundInPlayersFavor(heroDesignerCharacter.getCharacteristicTotal('DEX', this.props.character) / 3);

                    note.label = 'OCV/DCV';
                    note.text = `${cv}/${cv}`;
                } else if (characteristic.shortName.toUpperCase() === 'EGO') {
                    note.label = 'ECV';
                    note.text = common.roundInPlayersFavor(heroDesignerCharacter.getCharacteristicTotal('EGO', this.props.character) / 3);
                }
            }

            if (note.label === '') {
                return null;
            }

            return (
                <View style={{flex: 1, paddingBottom: verticalScale(10)}}>
                    <Text style={styles.grey}>
                        <Text style={styles.boldGrey}>{note.label}:</Text> {note.text}
                    </Text>
                </View>
            );
        }

        return null;
    }

    _renderDefinition(characteristic) {
        if (this.state.characteristicsShow[characteristic.shortName]) {
            let definition = characteristic.definition;

            if (characteristic.type === TYPE_MOVEMENT) {
                definition = `${definition.split('.').shift()}.`;
            }

            return (
                <Fragment>
                    <CardItem style={styles.cardItem}>
                        <Body>
                            {this._renderNonCombatMovement(characteristic)}
                            {this._renderStrength(characteristic)}
                            {this._renderNotes(characteristic)}
                            <Text style={styles.grey}>{definition}</Text>
                        </Body>
                    </CardItem>
                    <CardItem style={styles.cardItem} footer>
                        <Body style={{flex: 1, flexDirection: 'row', justifyContent: 'center'}}>
                            <Text style={styles.grey}>
                                <Text style={styles.boldGrey}>Base:</Text> {characteristic.base}
                            </Text>
                            <View style={{width: scale(20), alignItems: 'center'}}>
                                <Text style={styles.grey}>&bull;</Text>
                            </View>
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
            let speed = heroDesignerCharacter.getCharacteristicTotal('SPD', this.props.character);
            let movement = this._getMovementTotal(characteristic);
            let meters = movement;
            let unit = 'm';
            let ncm = 2;

            if (heroDesignerCharacter.isFifth(this.props.character)) {
                unit = '"';
                meters *= 2;
            }

            if (this.state.powersMap.has(characteristic.shortName.toUpperCase())) {
                ncm = this._getTotalNcm(this.state.powersMap.get(characteristic.shortName.toUpperCase()), ncm);
            }

            let combatKph = (meters * speed * 5 * 60) / 1000;
            let nonCombatKph = (meters * ncm * speed * 5 * 60) / 1000;

            return (
                <View style={{flex: 1, paddingBottom: verticalScale(10)}}>
                    <Text style={styles.grey}>
                        <Text style={styles.boldGrey}>NCM:</Text> {movement * ncm}
                        {unit} (x{ncm})
                    </Text>
                    <Text style={styles.grey}>
                        <Text style={styles.boldGrey}>Max Combat:</Text> {combatKph.toFixed(1)} km/h
                    </Text>
                    <Text style={styles.grey}>
                        <Text style={styles.boldGrey}>Max Non-Combat:</Text> {nonCombatKph.toFixed(1)} km/h
                    </Text>
                </View>
            );
        }

        return null;
    }

    _getTotalNcm(movementMode, ncm) {
        if (Array.isArray(movementMode)) {
            for (let move of movementMode) {
                ncm += this._getTotalNcm(move, ncm);
            }
        } else {
            if (
                (movementMode.affectsPrimary && movementMode.affectsTotal) ||
                (!movementMode.affectsPrimary && movementMode.affectsTotal && this.props.character.showSecondary)
            ) {
                let adderMap = common.toMap(movementMode.adder);

                if (adderMap.has('IMPROVEDNONCOMBAT')) {
                    ncm **= adderMap.get('IMPROVEDNONCOMBAT').levels + 1;
                }
            }
        }

        return ncm;
    }

    _renderStrength(characteristic) {
        if (characteristic.shortName === 'STR') {
            let step = null;
            let lift = '0.0 kg';
            let totalStrength = heroDesignerCharacter.getCharacteristicTotal('STR', this.props.character);

            for (let key of Object.keys(strengthTable)) {
                if (totalStrength === parseInt(key, 10)) {
                    step = strengthTable[totalStrength.toString()];
                    lift = step.lift;
                    break;
                }
            }

            if (step === null) {
                if (totalStrength < 0) {
                    step = strengthTable['0'];
                } else if (totalStrength > 100) {
                    step = strengthTable['100'];
                    lift = step.lift;

                    let doublings = (totalStrength - 100) / 5;

                    for (let i = 0; i < Math.trunc(doublings); i++) {
                        lift *= 2;
                    }

                    if (common.isFloat(doublings) && (doublings % 1).toFixed(1) !== '0.0') {
                        lift += (lift / 5) * ((parseFloat(doublings % 1).toFixed(1) * 10) / 2);
                    }
                } else {
                    let previousKey = null;
                    let previousEntry = null;

                    for (let [key, entry] of Object.entries(strengthTable)) {
                        if (totalStrength < parseInt(key, 10)) {
                            step = previousEntry;
                            lift = previousEntry.lift;

                            let divisor = key - previousKey;
                            let remainder = parseFloat(((totalStrength / divisor) % 1).toFixed(1));

                            if (remainder === 0.0) {
                                lift += ((entry.lift - lift) / divisor) * (remainder + 1);
                            } else {
                                lift += ((entry.lift - lift) / divisor) * (totalStrength - previousKey);
                            }

                            break;
                        }

                        previousKey = key;
                        previousEntry = entry;
                    }
                }
            }

            let strengthDamage = this._getStrengthDamage(totalStrength);

            return (
                <View style={{flex: 1, paddingBottom: verticalScale(10)}}>
                    <TouchableHighlight underlayColor="#121212" onPress={() => this._rollStrengthDamage(strengthDamage)}>
                        <Text style={styles.grey}>
                            <Text style={styles.boldGrey}>Damage:</Text> {strengthDamage}
                        </Text>
                    </TouchableHighlight>

                    <Text style={styles.grey}>
                        <Text style={styles.boldGrey}>Lift:</Text> {this._renderLift(lift)}
                    </Text>
                    <Text style={styles.grey}>
                        <Text style={styles.boldGrey}>Example:</Text> {step.example}
                    </Text>
                </View>
            );
        }

        return null;
    }

    _renderLift(lift) {
        if (lift >= 1000000000000) {
            return `${Math.round((lift / 1000000000000) * 10) / 10} Gigatonnes`;
        } else if (lift >= 1000000000) {
            return `${Math.round((lift / 1000000000) * 10) / 10} Megatonnes`;
        } else if (lift >= 1000000) {
            return `${Math.round((lift / 1000000) * 10) / 10} Kilotonnes`;
        } else if (lift >= 1000.0) {
            return `${Math.round((lift / 1000) * 10) / 10} Tonnes`;
        } else {
            return `${Math.round(lift * 10) / 10} kg`;
        }
    }

    _renderStat(characteristic) {
        if (characteristic.type === TYPE_MOVEMENT) {
            let unit = 'm';

            if (heroDesignerCharacter.isFifth(this.props.character)) {
                unit = '"';
            }

            return <CircleText title={this._getMovementTotal(characteristic, true) + unit} fontSize={18} size={55} color="#303030" />;
        }

        return (
            <CircleText
                title={heroDesignerCharacter.getCharacteristicTotal(characteristic.shortName, this.props.character).toString()}
                fontSize={18}
                size={45}
                color="#303030"
            />
        );
    }

    _renderCharacteristics(characteristics) {
        return (
            <Fragment>
                {characteristics.map((characteristic, index) => {
                    let name = characteristic.name.toLowerCase().startsWith('custom') ? characteristic.shortName : characteristic.name;

                    return (
                        <Card style={styles.card} key={'characteristic-' + index}>
                            <CardItem style={styles.cardItem}>
                                <Body>
                                    <View style={{flex: 1, flexDirection: 'row', alignItems: 'center'}}>
                                        {this._renderStat(characteristic)}
                                        <Text style={[styles.cardTitle, {paddingLeft: scale(10)}]}>{name}</Text>
                                    </View>
                                </Body>
                                <Right style={{flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end'}}>
                                    <TouchableHighlight
                                        underlayColor="#121212"
                                        onPress={() =>
                                            this.props.navigation.navigate('Result', {
                                                from: 'ViewHeroDesignerCharacter',
                                                result: dieRoller.rollCheck(heroDesignerCharacter.getRollTotal(characteristic, this.props.character)),
                                            })
                                        }
                                    >
                                        <Text style={[styles.cardTitle, {paddingBottom: 2}]}>
                                            {heroDesignerCharacter.getRollTotal(characteristic, this.props.character)}
                                        </Text>
                                    </TouchableHighlight>
                                    <Icon
                                        type="FontAwesome"
                                        name={this.state.characteristicsButtonsShow[characteristic.shortName]}
                                        style={{paddingLeft: scale(10), fontSize: verticalScale(25), color: '#14354d'}}
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

    _toggleSecondaryCharacteristics() {
        this.props.setShowSecondary({showSecondary: !this.props.character.showSecondary});
    }

    _renderSecondaryCharacteristicToggle() {
        if (heroDesignerCharacter.hasSecondaryCharacteristics(common.flatten(this.props.character.powers, 'powers'))) {
            return (
                <View style={{flex: 1, flexDirection: 'row', justifyContent: 'space-around', paddingVertical: verticalScale(20)}}>
                    <View>
                        <Text style={styles.boldGrey}>Include Secondary Characteristics?</Text>
                    </View>
                    <View>
                        <Switch
                            value={this.props.character.showSecondary}
                            onValueChange={() => this._toggleSecondaryCharacteristics()}
                            minimumTrackTintColor="#14354d"
                            maximumTrackTintColor="#14354d"
                            thumbColor="#14354d"
                            trackColor={{false: '#000', true: '#3d5478'}}
                            ios_backgroundColor="#3d5478"
                        />
                    </View>
                </View>
            );
        }

        return null;
    }

    render() {
        return (
            <View>
                {this._renderSecondaryCharacteristicToggle()}
                {this._renderCharacteristics(this.props.character.characteristics)}
                <View style={{paddingTop: verticalScale(20)}} />
                <Heading text="Movement" />
                {this._renderCharacteristics(this.props.character.movement)}
            </View>
        );
    }
}
