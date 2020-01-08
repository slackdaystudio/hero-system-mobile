import React, { Component }  from 'react';
import PropTypes from 'prop-types';
import { StyleSheet, View, TouchableHighlight, Alert } from 'react-native';
import { Text, List, ListItem, Left, Right, Body, Item, Input, Button, Spinner } from 'native-base';
import { character } from '../../lib/Character';
import styles from '../../Styles';

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

export default class Combat extends Component {
    static propTypes = {
        navigation: PropTypes.object.isRequired,
        character: PropTypes.object.isRequired,
        combatDetails: PropTypes.object.isRequired,
        setSparseCombatDetails: PropTypes.func.isRequired,
        updateForm: PropTypes.func.isRequired,
    }

    constructor(props) {
        super(props);

        this.updateCombatState = this._updateCombatState.bind(this);
        this.resetCombatState = this._resetCombatState.bind(this);
        this.takeRecovery = this._takeRecovery.bind(this);
    }

    _updateCombatState(key, value) {
        if (/^(\-)?[0-9]*$/.test(value) === false) {
            return;
        }

        let combatDetails = {};

        combatDetails[key] = value;

        this.props.setSparseCombatDetails(combatDetails);
    }

    _resetCombatState(key) {
	    let combatDetails = {};

	    combatDetails[key] = character.getCharacteristic(this.props.character.characteristics.characteristic, key);

        this.props.setSparseCombatDetails(combatDetails);
    }

    _takeRecovery() {
        let recovery = parseInt(character.getCharacteristic(this.props.character.characteristics.characteristic, 'recovery'), 10);
        let stunMax = parseInt(character.getCharacteristic(this.props.character.characteristics.characteristic, 'stun'), 10);
        let endMax = parseInt(character.getCharacteristic(this.props.character.characteristics.characteristic, 'endurance'), 10);
        let stun = this.props.combatDetails.stun;
        let combatStun = parseInt(stun, 10);
        let endurance = this.props.combatDetails.endurance;
        let combatEnd = parseInt(endurance, 10);
        let combatDetails = {};

        if (stun < stunMax) {
            stun = combatStun + recovery > stunMax ? stunMax : combatStun + recovery;
        }

        if (endurance < endMax) {
            endurance = combatEnd + recovery > endMax ? endMax : combatEnd + recovery;
        }

        combatDetails.stun = stun;
        combatDetails.endurance = endurance;

        this.props.setSparseCombatDetails(combatDetails);
    }

    _rollDamage(strengthDamage) {
        this.props.updateForm('damage', character.getDamage(null, strengthDamage));

        this.props.navigation.navigate('Damage', {from: 'ViewCharacter'});
    }

    _rollPresenceDamage(presenceDamage) {
        this.props.updateForm('freeForm', character.getPresenceAttackDamage(presenceDamage));

        this.props.navigation.navigate('FreeForm', {from: 'ViewCharacter'});
    }

    _renderDefenses() {
        let stunThreshold = parseInt(character.getCharacteristic(this.props.character.characteristics.characteristic, 'constitution'), 10);
        let ego = parseInt(character.getCharacteristic(this.props.character.characteristics.characteristic, 'ego'), 10);
        let presence = parseInt(character.getCharacteristic(this.props.character.characteristics.characteristic, 'presence'), 10);
        let defenses = character.getDefenses(this.props.character);

        return (
            <List>
                {defenses.map((defense, index) => {
                    return (
                        <ListItem key={'defense-' + index}>
                            <Left>
                                <Text style={styles.boldGrey}>{defense.label}</Text>
                            </Left>
                            <Right>
                                <Text style={styles.grey}>{defense.value}</Text>
                            </Right>
                        </ListItem>
                    );
                })}
                <ListItem>
                    <Left>
                        <Text style={styles.boldGrey}>Constitution</Text>
                    </Left>
                    <Right>
                        <Text style={styles.grey}>{stunThreshold}</Text>
                    </Right>
                </ListItem>
                <ListItem>
                    <Left>
                        <Text style={styles.boldGrey}>Ego</Text>
                    </Left>
                    <Right>
                        <Text style={styles.grey}>{ego}</Text>
                    </Right>
                </ListItem>
                <ListItem>
                    <Left>
                        <Text style={styles.boldGrey}>Presence</Text>
                    </Left>
                    <Right>
                        <Text style={styles.grey}>{presence}</Text>
                    </Right>
                </ListItem>
            </List>
        );
    }

    _renderBaseDamage() {
        let strengthDamage = character.getStrengthDamage(this.props.character);
        let presenceDamage = character.getPresenceDamage(this.props.character);

        return (
            <List>
                <ListItem onLongPress={() => this._rollDamage(strengthDamage)}>
                    <Left>
                        <Text style={styles.boldGrey}>Strength</Text>
                    </Left>
                    <Right>
                        <Text style={styles.grey}>{strengthDamage}</Text>
                    </Right>
                </ListItem>
                <ListItem onLongPress={() => this._rollPresenceDamage(presenceDamage)}>
                    <Left>
                        <Text style={styles.boldGrey}>Presence</Text>
                    </Left>
                    <Right>
                        <Text style={styles.grey}>{presenceDamage}</Text>
                    </Right>
                </ListItem>
            </List>
        );
    }

    render() {
        return (
            <View>
                <View style={{paddingBottom: 20}} />
                <Text style={styles.subHeading}>Health</Text>
                <View style={{flex: 1, flexDirection: 'row', justifyContent: 'space-around', alignItems: 'center'}}>
                    <View style={{alignSelf: 'center', width: 50}}>
                        <Text style={styles.boldGrey}>Stun:</Text>
                    </View>
                    <View style={{width: 40}}>
                        <Item>
                            <Input
                                style={styles.grey}
                                keyboardType="numeric"
                                maxLength={3}
                                value={this.props.combatDetails.stun.toString()}
                                onChangeText={(text) => this.updateCombatState('stun', text)} />
                        </Item>
                    </View>
                    <View>
                        <Button style={styles.button} onPress={() => this.resetCombatState('stun')}>
                            <Text uppercase={false} style={styles.buttonText}>Reset</Text>
                        </Button>
                    </View>
                </View>
                <View style={{flex: 1, flexDirection: 'row', justifyContent: 'space-around', alignItems: 'center'}}>
                    <View style={{alignSelf: 'center', width: 50}}>
                        <Text style={styles.boldGrey}>Body:</Text>
                    </View>
                    <View style={{width: 40}}>
                        <Item>
                            <Input
                                style={styles.grey}
                                keyboardType="numeric"
                                maxLength={3}
                                value={this.props.combatDetails.body.toString()}
                                onChangeText={(text) => this.updateCombatState('body', text)} />
                        </Item>
                    </View>
                    <View>
                        <Button style={styles.button} onPress={() => this.resetCombatState('body')}>
                            <Text uppercase={false} style={styles.buttonText}>Reset</Text>
                        </Button>
                    </View>
                </View>
                <View style={{flex: 1, flexDirection: 'row', justifyContent: 'space-around', alignItems: 'center'}}>
                    <View style={{alignSelf: 'center', width: 50}}>
                        <Text style={styles.boldGrey}>End:</Text>
                    </View>
                    <View style={{width: 40}}>
                        <Item>
                            <Input
                                style={styles.grey}
                                keyboardType="numeric"
                                maxLength={3}
                                value={this.props.combatDetails.endurance.toString()}
                                onChangeText={(text) => this.updateCombatState('endurance', text)} />
                        </Item>
                    </View>
                    <View>
                        <Button style={styles.button} onPress={() => this.resetCombatState('endurance')}>
                            <Text uppercase={false} style={styles.buttonText}>Reset</Text>
                        </Button>
                    </View>
                </View>
                <View style={[styles.buttonContainer, {alignSelf: 'center', paddingTop: 10}]}>
                    <Button style={[styles.button, {minWidth: 160}]} onPress={() => this.takeRecovery()}>
                        <Text uppercase={false} style={styles.buttonText}>Recovery</Text>
                    </Button>
                </View>
                <View style={{paddingBottom: 20}} />
                <Text style={styles.subHeading}>Defenses</Text>
                {this._renderDefenses()}
                <View style={{paddingBottom: 20}} />
                <Text style={styles.subHeading}>Base Damage</Text>
                {this._renderBaseDamage()}
            </View>
        );
    }
}
