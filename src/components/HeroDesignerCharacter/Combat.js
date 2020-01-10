import React, { Component }  from 'react';
import PropTypes from 'prop-types';
import { StyleSheet, View, TouchableHighlight, Alert } from 'react-native';
import { Text, List, ListItem, Left, Right, Body, Item, Input, Button, Spinner } from 'native-base';
import { heroDesignerCharacter } from '../../lib/HeroDesignerCharacter';
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

        combatDetails[key] = heroDesignerCharacter.getCharacteristicTotalByShortName(key, this.props.character);

        this.props.setSparseCombatDetails(combatDetails);
    }

    _takeRecovery() {
        let recovery = heroDesignerCharacter.getCharacteristicTotalByShortName('rec', this.props.character);
        let stunMax = heroDesignerCharacter.getCharacteristicTotalByShortName('stun', this.props.character);
        let endMax = heroDesignerCharacter.getCharacteristicTotalByShortName('end', this.props.character);
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
            </View>
        );
    }
}
