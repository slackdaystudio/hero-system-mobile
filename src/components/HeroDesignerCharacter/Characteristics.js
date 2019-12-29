import React, { Component, Fragment }  from 'react';
import { connect } from 'react-redux';
import PropTypes from 'prop-types';
import { View, TouchableHighlight, Alert, Switch } from 'react-native';
import { Text, Icon, Card, CardItem, Left, Right, Body } from 'native-base';
import Heading from '../Heading/Heading';
import CircleText from '../CircleText/CircleText';
import { dieRoller } from '../../lib/DieRoller';
import { common } from '../../lib/Common';
import { setShowSecondary } from '../../reducers/character';
import { heroDesignerCharacter, TYPE_MOVEMENT } from '../../lib/HeroDesignerCharacter';
import { SKILL_ROLL_BASE } from '../../decorators/skills/Roll';
import styles from '../../Styles';
import strengthTable from '../../../public/strengthTable.json';


class Characteristics extends Component {
    static propTypes = {
        navigation: PropTypes.object.isRequired,
        character: PropTypes.object.isRequired,
        showSecondary: PropTypes.bool.isRequired,
        setShowSecondary: PropTypes.func.isRequired
    }

    constructor(props) {
        super(props);

        const displayOptions =  this._initCharacteristicsShow(props.character.characteristics, props.character.movement);

        this.state = {
            characteristicsShow: displayOptions.characteristicsShow,
            characteristicsButtonsShow: displayOptions.characteristicsButtonsShow
        }

        this.powersMap = common.toMap(common.flatten(props.character.powers, 'powers'));
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

    _getSpeed() {
        for (let characteristic of this.props.character.characteristics) {
            if (characteristic.shortName.toLowerCase() === 'spd') {
                return heroDesignerCharacter.getCharacteristicTotal(characteristic, this.powersMap);
            }
        }

        return 0;
    }

    _getMovementTotal(characteristic) {
        let meters = characteristic.value;

        if (this.powersMap.has(characteristic.shortName.toUpperCase())) {
            let movementMode = this.powersMap.get(characteristic.shortName.toUpperCase());

            if (movementMode.affectsPrimary && movementMode.affectsTotal) {
                meters += movementMode.levels;
            } else if (!movementMode.affectsPrimary && movementMode.affectsTotal && this.props.showSecondary) {
                meters += movementMode.levels;
            }
        }

        return meters;
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
                            <Text style={styles.grey}>{definition}</Text>
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
            let speed = this._getSpeed();
            let meters = this._getMovementTotal(characteristic);
            let ncm = 2;
            let power = null;

            if (this.powersMap.has(characteristic.shortName.toUpperCase())) {
                movementMode = this.powersMap.get(characteristic.shortName.toUpperCase());

                if ((movementMode.affectsPrimary && movementMode.affectsTotal) ||
                    (!movementMode.affectsPrimary && movementMode.affectsTotal && this.props.showSecondary)) {
                    let adderMap = common.toMap(movementMode.adder);

                    if (adderMap.has('IMPROVEDNONCOMBAT')) {
                        ncm **= adderMap.get('IMPROVEDNONCOMBAT').levels + 1;
                    }
                }
            }

            let combatKph = meters * speed * 5 * 60 / 1000;
            let nonCombatKph = meters * ncm * speed * 5 * 60 / 1000;

            return (
                <View style={{flex: 1, paddingBottom: 10}}>
                    <Text style={styles.grey}>
                        <Text style={styles.boldGrey}>NCM:</Text> {meters * ncm}m (x{ncm})
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

    _renderStrength(characteristic) {
        if (characteristic.shortName === 'STR') {
            let step = null;
            let lift = '0.0 kg';
            let totalStrength = heroDesignerCharacter.getCharacteristicTotal(characteristic, this.powersMap);

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
                        lift += lift / 5 * (parseFloat(doublings % 1).toFixed(1) * 10 / 2);
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
                                lift += (entry.lift - lift) / divisor * (remainder + 1);
                            } else {
                                lift += (entry.lift - lift) / divisor * (parseFloat(remainder % 1).toFixed(1) * 10 / 2);
                            }

                            break;
                        }

                        previousKey = key;
                        previousEntry = entry;
                    }
                }
            }

            return (
                 <View style={{flex: 1, paddingBottom: 10}}>
                     <Text style={styles.grey}>
                         <Text style={styles.boldGrey}>Damage:</Text> {this._renderStrengthDamage(totalStrength)}
                     </Text>
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

    _renderStrengthDamage(strength) {
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

    _renderLift(lift) {
        if (lift >= 1000000000000) {
            return `${Math.round(lift / 1000000000000 * 10) / 10} Gigatonnes`;
        } else if (lift >= 1000000000) {
            return `${Math.round(lift / 1000000000 * 10) / 10} Megatonnes`;
        } else if (lift >= 1000000) {
            return `${Math.round(lift / 1000000 * 10) / 10} Kilotonnes`;
        } else if (lift >= 1000.0) {
            return `${Math.round(lift / 1000 * 10) / 10} Tonnes`;
        } else {
            return `${Math.round(lift * 10) / 10} kg`;
        }
    }

    _renderStat(characteristic) {
        if (characteristic.type === TYPE_MOVEMENT) {
            return <CircleText title={this._getMovementTotal(characteristic) + 'm'} fontSize={22} size={60} />
        }

        return <CircleText title={heroDesignerCharacter.getCharacteristicTotal(characteristic, this.powersMap)} fontSize={22} size={50} />
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
                                        onPress={() => this.props.navigation.navigate('Result', dieRoller.rollCheck(heroDesignerCharacter.getRollTotal(characteristic, this.powersMap)))}
                                    >
                                        <Text style={[styles.cardTitle, {paddingBottom: 2}]}>{heroDesignerCharacter.getRollTotal(characteristic, this.powersMap)}</Text>
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

    _toggleSecondaryCharacteristics() {
        this.props.setShowSecondary(!this.props.showSecondary);
    }

    _renderSecondaryCharacteristicToggle() {
        if (heroDesignerCharacter.hasSecondaryCharacteristics(common.flatten(this.props.character.powers, 'powers'))) {
            return (
                <View style={{flex: 1, flexDirection: 'row', justifyContent: 'space-around', paddingVertical: 20}}>
                    <View>
                        <Text style={styles.boldGrey}>Include Secondary Characteristics?</Text>
                    </View>
                    <View>
                        <Switch
                            value={this.props.showSecondary}
                            onValueChange={() => this._toggleSecondaryCharacteristics()}
                            minimumTrackTintColor='#14354d'
                            maximumTrackTintColor='#14354d'
                            thumbTintColor='#14354d'
                            onTintColor="#01121E"
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
                <Heading text='Characteristics' />
                {this._renderSecondaryCharacteristicToggle()}
                {this._renderCharacteristics(this.props.character.characteristics)}
                <View style={{paddingTop: 20}} />
                <Heading text='Movement' />
                {this._renderCharacteristics(this.props.character.movement)}
            </View>
        );
    }
}

const mapStateToProps = state => {
    return {
        showSecondary: state.character.showSecondary
    };
}

const mapDispatchToProps = {
    setShowSecondary
}

export default connect(mapStateToProps, mapDispatchToProps)(Characteristics);