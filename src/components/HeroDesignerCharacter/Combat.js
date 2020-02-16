import React, { Component, Fragment }  from 'react';
import PropTypes from 'prop-types';
import { StyleSheet, View, TouchableHighlight, Alert } from 'react-native';
import { Text, List, ListItem, Left, Right, Body, Item, Input, Button, Icon } from 'native-base';
import Heading from '../Heading/Heading';
import CircleText from '../CircleText/CircleText';
import NumberPicker from '../NumberPicker/NumberPicker';
import CalculatorInput from '../CalculatorInput/CalculatorInput';
import StatusDialog from '../StatusDialog/StatusDialog';
import { scale, verticalScale } from 'react-native-size-matters';
import { common } from '../../lib/Common';
import { heroDesignerCharacter } from '../../lib/HeroDesignerCharacter';
import { dieRoller } from '../../lib/DieRoller';
import { characterTraitDecorator } from '../../decorators/CharacterTraitDecorator';
import styles from '../../Styles';
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

export default class Combat extends Component {
    static propTypes = {
        navigation: PropTypes.object.isRequired,
        character: PropTypes.object.isRequired,
        setSparseCombatDetails: PropTypes.func.isRequired,
        usePhase: PropTypes.func.isRequired,
        forms: PropTypes.object.isRequired,
        updateForm: PropTypes.func.isRequired,
        updateFormValue: PropTypes.func.isRequired,
        resetForm: PropTypes.func.isRequired,
    }

    constructor(props) {
        super(props);

        this.state = {
            combatDetails: this._getCombatDetails(props.character),
            statusDialogVisible: false,
        }

        this.updateCombatState = this._updateCombatState.bind(this);
        this.resetCombatState = this._resetCombatState.bind(this);
        this.takeRecovery = this._takeRecovery.bind(this);
        this.incrementCv = this._incrementCv.bind(this);
        this.decrementCv = this._decrementCv.bind(this);
        this.rollToHit = this._rollToHit.bind(this);
        this.usePhase = this._usePhase.bind(this);
        this.abortPhase = this._abortPhase.bind(this);
        this.addStatus = this._addStatus.bind(this);
        this.applyStatus = this._applyStatus.bind(this);
        this.closeStatusDialog = this._closeStatusDialog.bind(this);
    }

    static getDerivedStateFromProps(nextProps, prevState) {
        if (prevState.character !== nextProps.character) {
            let newState = {...prevState};

            if (nextProps.character.showSecondary) {
                newState.combatDetails = nextProps.character.combatDetails.secondary;
            } else {
                newState.combatDetails = nextProps.character.combatDetails.primary;
            }

            return newState;
        }

        return null;
    }

    _getCombatDetails(character) {
        if (character === null) {
            return null;
        }

        return character.showSecondary ? character.combatDetails.secondary : character.combatDetails.primary;
    }

    _updateCombatState(key, value) {
        if (/^(\-)?[0-9]*$/.test(value) === false) {
            return;
        }

        let combatDetails = {};

        combatDetails[key] = value;

        this.props.setSparseCombatDetails(combatDetails, this.props.character.showSecondary);
    }

    _resetCombatState(key) {
        let combatDetails = {};

        combatDetails[key] = heroDesignerCharacter.getCharacteristicTotal(key === 'endurance' ? 'end' : key, this.props.character);

        this.props.setSparseCombatDetails(combatDetails, this.props.character.showSecondary);
    }

    _takeRecovery() {
        let recovery = heroDesignerCharacter.getCharacteristicTotal('rec', this.props.character);
        let stunMax = heroDesignerCharacter.getCharacteristicTotal('stun', this.props.character);
        let endMax = heroDesignerCharacter.getCharacteristicTotal('end', this.props.character);
        let stun = this.state.combatDetails.stun;
        let combatStun = parseInt(stun, 10);
        let endurance = this.state.combatDetails.endurance;
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

        this.props.setSparseCombatDetails(combatDetails, this.props.character.showSecondary);
    }

    _incrementCv(key, step) {
        let combatDetails = {};
        combatDetails[key] = this.state.combatDetails[key] + step;

        this.props.setSparseCombatDetails(combatDetails, this.props.character.showSecondary);
    }

    _decrementCv(key, step) {
        let combatDetails = {};
        combatDetails[key] = this.state.combatDetails[key] - step;

        this.props.setSparseCombatDetails(combatDetails, this.props.character.showSecondary);
    }

    _rollToHit(stateKey) {
        let hitForm = {...this.props.forms.hit};
        hitForm.ocv = this.state.combatDetails[stateKey];

        this.props.updateForm('hit', hitForm);

        this.props.navigation.navigate('Result', {from: 'ViewHeroDesignerCharacter', result: dieRoller.rollToHit(hitForm.ocv, 1, false, 0)});
    }

    _usePhase(phase) {
        this.props.usePhase(phase, this.props.character.showSecondary);
    }

    _abortPhase(phase) {
        this.props.usePhase(phase, this.props.character.showSecondary, true);
    }

    _openStatusDialog() {
        this.setState({statusDialogVisible: true});
    }

    _addStatus() {
        this.props.navigation.navigate('Status');
    }

    _applyStatus() {
        this.props.resetForm('status');

        this._closeStatusDialog();
    }

    _closeStatusDialog() {
        this.setState({statusDialogVisible: false});
    }

    _renderHealthItem(stateKey, label=null) {
        return (
            <View style={{flex: 1, flexDirection: 'row', justifyContent: 'space-around', alignItems: 'center'}}>
                <View style={{flex: 1, alignSelf: 'center'}}>
                    <Text style={styles.boldGrey}>{label === null ? stateKey.toUpperCase() : label}:</Text>
                </View>
                <View style={{flex: 1, alignSelf: 'center'}}>
                    <View style={{alignSelf: 'center', width: scale(75)}}>
                        <CalculatorInput
                            itemKey={stateKey}
                            value={this.state.combatDetails[stateKey] || heroDesignerCharacter.getCharacteristicTotal(stateKey, this.props.character)}
                            onAccept={this.updateCombatState}
                            alignment='flex-end'
                        />
                    </View>
                </View>
                <View style={{flex: 1, alignSelf: 'center'}}>
                    <Button style={styles.buttonSmall} onPress={() => this.resetCombatState(stateKey)}>
                        <Text uppercase={false} style={styles.buttonText}>Reset</Text>
                    </Button>
                </View>
            </View>
        );
    }

    _renderDefenses() {
        let rows = [
            {
                label: 'PD',
                value: heroDesignerCharacter.getTotalDefense(this.props.character, 'PD'),
            }, {
                label: 'ED',
                value: heroDesignerCharacter.getTotalDefense(this.props.character, 'ED'),
            }, {
                label: 'MD',
                value: heroDesignerCharacter.getTotalUnusualDefense(this.props.character, 'MENTALDEFENSE'),
            }, {
                label: 'PwD',
                value: heroDesignerCharacter.getTotalUnusualDefense(this.props.character, 'POWERDEFENSE'),
            },
        ];

        return (
            <Fragment>
                <View style={{flex: 1, flexDirection: 'row'}}>
                    {this._renderDefense(rows[0])}
                    {this._renderDefense(rows[1])}
                </View>
                <View style={{flex: 1, flexDirection: 'row'}}>
                    {this._renderDefense(rows[2])}
                    {this._renderDefense(rows[3])}
                </View>
            </Fragment>
        );
    }

    _renderDefense(row) {
        return (
            <Fragment>
                <View style={{flex: 1, flexDirection: 'row', alignSelf: 'center', justifyContent: 'flex-end'}}>
                    <Text style={styles.boldGrey}>{row.label}: </Text>
                </View>
                <View style={{flex: 1, flexDirection: 'row', alignSelf: 'center'}}>
                    <View style={{flex: 1}}>
                        <Text style={styles.grey}>{row.value}</Text>
                    </View>
                </View>
            </Fragment>
        );
    }

    _renderPhases() {
        let phases = Object.keys(this.state.combatDetails.phases);

        if (phases.length > 6) {
            let firstRow = phases.slice(0, 6);
            let secondRow = phases.slice(6);

            return (
                <View style={{flex: 1, alignItems: 'center'}}>
                    <View style={{flex: 1, flexDirection: 'row', paddingBottom: verticalScale(10)}}>
                        {firstRow.map((phase, index) => {
                            return this._renderPhase(phase.toString());
                        })}
                    </View>
                    <View style={{flex: 1, flexDirection: 'row', paddingBottom: verticalScale(10)}}>
                        {secondRow.map((phase, index) => {
                            return this._renderPhase(phase.toString());
                        })}
                    </View>
                    {this._renderPhaseInfo()}
                </View>
            );
        }

        return (
            <View style={{flex: 1, alignItems: 'center'}}>
                <View style={{flex: 1, flexDirection: 'row', paddingBottom: verticalScale(10)}}>
                    {phases.map((phase, index) => {
                        return this._renderPhase(phase.toString());
                    })}
                </View>
                {this._renderPhaseInfo()}
            </View>
        );
    }

    _renderPhase(phase) {
        let color = '#303030';

        if (this.state.combatDetails.phases[phase].used) {
            color = '#FFC300';
        } else if (this.state.combatDetails.phases[phase].aborted) {
            color = '#D11F1F';
        }

        return (
            <View key={`phase-${phase}`} style={{paddingHorizontal: scale(5)}}>
                <TouchableHighlight underlayColor='#1b1d1f' onPress={() => this.usePhase(phase, this.props.character.showSecondary)} onLongPress={() => this.abortPhase(phase)}>
                    <CircleText title={phase} fontSize={18} size={40} color={color} />
                </TouchableHighlight>
            </View>
        );
    }

    _renderPhaseInfo() {
        return (
            <View style={{flex: 1, flexDirection: 'row', justifyContent: 'center'}}>
                <Text style={styles.grey}>
                    <Text style={styles.boldGrey}>Dexterity:</Text> {heroDesignerCharacter.getCharacteristicTotal('DEX', this.props.character)}
                </Text>
                <View style={{width: scale(40)}} />
                <Text style={styles.grey}>
                    <Text style={styles.boldGrey}>Speed:</Text> {heroDesignerCharacter.getCharacteristicTotal('SPD', this.props.character)}
                </Text>
            </View>
        );
    }

    _renderCvRollButton(stateKey, renderRollButton) {
        if (renderRollButton) {
            return (
                <View style={{flex: 1, alignSelf: 'center'}}>
                    <Button style={styles.buttonSmall} onPress={() => this.rollToHit(stateKey)}>
                        <Text uppercase={false} style={styles.buttonText}>Roll</Text>
                    </Button>
                </View>
            );
        }

        return <View style={{flex: 1}}/>;
    }

    _renderCv(stateKey, renderRollButton=false) {
        if (!this.state.combatDetails.hasOwnProperty(stateKey)) {
            return null;
        }

        return (
            <View style={{flex: 1, flexDirection: 'row', alignSelf: 'stretch', justifyContent: 'center'}}>
                <View style={{flex: 1, alignSelf: 'center'}}>
                    <Text style={styles.boldGrey}>{stateKey.toUpperCase()}:</Text>
                </View>
                <View style={{flex: 1, alignSelf: 'center'}}>
                    <NumberPicker
                        value={this.state.combatDetails[stateKey] || heroDesignerCharacter.getCharacteristicTotal(stateKey, this.props.character)}
                        increment={this.incrementCv}
                        decrement={this.decrementCv}
                        stateKey={stateKey}
                    />
                </View>
                {this._renderCvRollButton(stateKey, renderRollButton)}
            </View>
        )
    }

    _renderLevels() {
        if (this.props.character.skills.length > 0) {
            let skillMap = common.toMap(common.flatten(this.props.character.skills, 'skills'));

            if (skillMap.has('COMBAT_LEVELS') || skillMap.has('SKILL_LEVELS')) {
                return (
                    <View style={{flex: 1, width: scale(300), alignSelf: 'center', paddingTop: verticalScale(10)}}>
                        {Array.from(skillMap.values()).map((skill, index) => {
                            if (Array.isArray(skill)) {
                                return skill.map((s, i) => {
                                    return this._renderCombatSkillLevel(s);
                                });
                            } else {
                                return this._renderCombatSkillLevel(skill);
                            }
                        })}
                    </View>
                );
            }
        }

        return null;
    }

    _renderCombatSkillLevel(skill) {
        if (skill.xmlid.toUpperCase() !== 'COMBAT_LEVELS' && skill.xmlid.toUpperCase() !== 'SKILL_LEVELS') {
            return null;
        }

        if (skill.xmlid.toUpperCase() === 'SKILL_LEVELS') {
            if (skill.optionid.toUpperCase() !== 'OVERALL') {
                return null;
            }
        }

        let decorated = characterTraitDecorator.decorate(skill, 'skills', () => this.props.character);

        return (
            <View style={{flex: 1, flexDirection: 'row'}} key={'skill-' + decorated.trait.id}>
                <View>
                    <Text style={styles.grey}>{decorated.label()}</Text>
                </View>
            </View>
        );
    }

    _renderStatuses() {
        if (this.props.character.hasOwnProperty('statuses') && this.props.character.statuses.length > 0) {
            return <Text style={styles.grey}>Status</Text>;
        }

        return (
            <View style={{flex: 1, alignSelf: 'flex-start'}}>
                <Text style={styles.grey}>You have no active status effects</Text>
            </View>
        );
    }

    render() {
        return (
            <View>
                <Heading text='Health' />
                <View style={{flex: 1, width: scale(300), alignSelf: 'center', alignItems: 'center', justifyContent: 'center'}}>
                    {this._renderHealthItem('stun')}
                    {this._renderHealthItem('body')}
                    {this._renderHealthItem('endurance', 'END')}
                    <View style={[styles.buttonContainer, {paddingVertical: verticalScale(10)}]}>
                        <Button style={styles.buttonSmall} onPress={() => this.takeRecovery()}>
                            <Text uppercase={false} style={styles.buttonText}>Recovery</Text>
                        </Button>
                    </View>
                </View>
                <Heading text='Status Effects' />
                <View style={{flex: 1, width: scale(300), alignSelf: 'center', alignItems: 'center', paddingBottom: verticalScale(10)}}>
                    <View style={{flex: 1, flexDirection: 'row', alignSelf: 'flex-end'}}>
                        <Button style={styles.buttonSmall} onPress={() => this._openStatusDialog()}>
                            <Text uppercase={false} style={styles.buttonText}>Add</Text>
                        </Button>
                    </View>
                    {this._renderStatuses()}
                </View>
                <Heading text='Defenses' />
                <View style={{flex: 1, width: scale(300), alignSelf: 'center', alignItems: 'center', paddingBottom: verticalScale(10)}}>
                    {this._renderDefenses()}
                </View>
                <Heading text='Phases' />
                <View style={{flex: 1, flexDirection: 'row', alignSelf: 'center', paddingBottom: verticalScale(10)}}>
                    {this._renderPhases()}
                </View>
                <Heading text='Combat Values' />
                <View style={{flex: 1, width: scale(300), alignSelf: 'center', alignItems: 'center', justifyContent: 'center'}}>
                    {this._renderCv('ocv', true)}
                    {this._renderCv('dcv')}
                    {this._renderCv('omcv', true)}
                    {this._renderCv('dmcv')}
                </View>
                {this._renderLevels()}
                <StatusDialog
                    character={this.props.character}
                    statusForm={this.props.forms.status}
                    updateFormValue={this.props.updateFormValue}
                    visible={this.state.statusDialogVisible}
                    onApply={this.applyStatus}
                    onClose={this.closeStatusDialog}
                />
            </View>
        );
    }
}
