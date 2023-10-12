import React, {Component, Fragment} from 'react';
import PropTypes from 'prop-types';
import {ImageBackground, View, Text, TouchableHighlight} from 'react-native';
import {scale, verticalScale} from 'react-native-size-matters';
// import Feather from 'react-native-vector-icons/Feather';
import Heading from '../Heading/Heading';
import {Button} from '../Button/Button';
import {Icon} from '../Icon/Icon';
import CircleText from '../CircleText/CircleText';
import NumberPicker from '../NumberPicker/NumberPicker';
import CalculatorInput from '../CalculatorInput/CalculatorInput';
import StatusDialog from '../StatusDialog/StatusDialog';
import {common} from '../../lib/Common';
import {heroDesignerCharacter} from '../../lib/HeroDesignerCharacter';
import {dieRoller} from '../../lib/DieRoller';
import {characterTraitDecorator} from '../../decorators/CharacterTraitDecorator';
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

// Feather.loadFont().catch((error) => console.error(error));

export default class Combat extends Component {
    static propTypes = {
        navigation: PropTypes.object.isRequired,
        character: PropTypes.object.isRequired,
        characters: PropTypes.object.isRequired,
        setSparseCombatDetails: PropTypes.func.isRequired,
        usePhase: PropTypes.func.isRequired,
        forms: PropTypes.object.isRequired,
        updateForm: PropTypes.func.isRequired,
        updateFormValue: PropTypes.func.isRequired,
        resetForm: PropTypes.func.isRequired,
        applyStatus: PropTypes.func.isRequired,
        clearAllStatuses: PropTypes.func.isRequired,
        clearStatus: PropTypes.func.isRequired,
    };

    constructor(props) {
        super(props);

        this.state = {
            combatDetails: this._getCombatDetails(props.character),
            statusDialogVisible: false,
        };

        this.updateCombatState = this._updateCombatState.bind(this);
        this.resetCombatState = this._resetCombatState.bind(this);
        this.takeRecovery = this._takeRecovery.bind(this);
        this.incrementCv = this._incrementCv.bind(this);
        this.decrementCv = this._decrementCv.bind(this);
        this.rollToHit = this._rollToHit.bind(this);
        this.usePhase = this._usePhase.bind(this);
        this.abortPhase = this._abortPhase.bind(this);
        this.applyStatus = this._applyStatus.bind(this);
        this.openStatusDialog = this._openStatusDialog.bind(this);
        this.closeStatusDialog = this._closeStatusDialog.bind(this);
        this.clearAllStatuses = this._clearAllStatuses.bind(this);
        this.editStatus = this._editStatus.bind(this);
        this.clearStatus = this._clearStatus.bind(this);
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
        this.props.usePhase(phase, this.props.character.showSecondary, false);
    }

    _abortPhase(phase) {
        this.props.usePhase(phase, this.props.character.showSecondary, true);
    }

    _openStatusDialog() {
        let newState = {...this.state};
        newState.statusDialogVisible = true;

        this.setState(newState);
    }

    _applyStatus() {
        this.props.applyStatus(this.props.forms.status);

        this.props.resetForm('status');

        this._closeStatusDialog();
    }

    _clearAllStatuses() {
        this.props.clearAllStatuses();
    }

    _editStatus(index) {
        const key = this.props.character.showSecondary ? 'secondary' : 'primary';
        const status = this.props.character.combatDetails[key].statuses[index];
        const statusForm = {...this.props.forms.status};

        statusForm.name = status.name;
        statusForm.label = status.label || '';
        statusForm.index = index;

        switch (status.name) {
            case 'Aid':
            case 'Drain':
                statusForm.activePoints = status.activePoints || 0;
                statusForm.targetTrait = status.targetTrait || null;
                break;
            case 'Entangle':
                statusForm.body = status.body || 0;
                statusForm.pd = status.pd || 0;
                statusForm.ed = status.ed || 0;
                break;
            case 'Flash':
                statusForm.segments = status.segments || 0;
                break;
            default:
            // Do nothing
        }

        this.props.updateForm('status', statusForm);

        this.openStatusDialog();
    }

    _clearStatus(index) {
        this.props.clearStatus(index);
    }

    _closeStatusDialog() {
        this.setState({statusDialogVisible: false});
    }

    _renderHealthItem(stateKey, label = null) {
        return (
            <View style={{flexDirection: 'row', justifyContent: 'space-evenly', alignItems: 'center', paddingHorizontal: scale(50)}}>
                <View style={{flex: 1, alignSelf: 'center'}}>
                    <Text style={styles.boldGrey}>{label === null ? stateKey.toUpperCase() : label}:</Text>
                </View>
                <View style={{flex: 1, alignSelf: 'center'}}>
                    <View style={{alignSelf: 'center', width: scale(75)}}>
                        <CalculatorInput
                            itemKey={stateKey}
                            value={this.state.combatDetails[stateKey] || heroDesignerCharacter.getCharacteristicTotal(stateKey, this.props.character)}
                            onAccept={this.updateCombatState}
                            alignment="flex-end"
                        />
                    </View>
                </View>
                <View>
                    <Button
                        label="Reset"
                        style={styles.buttonTiny}
                        onPress={() => this.resetCombatState(stateKey)}
                        labelStyle={{fontSize: verticalScale(12)}}
                    />
                </View>
            </View>
        );
    }

    _renderDefenses() {
        let rows = [
            {
                label: 'PD',
                value: heroDesignerCharacter.getTotalDefense(this.props.character, 'PD'),
            },
            {
                label: 'ED',
                value: heroDesignerCharacter.getTotalDefense(this.props.character, 'ED'),
            },
            {
                label: 'MD',
                value: heroDesignerCharacter.getTotalUnusualDefense(this.props.character, 'MENTALDEFENSE'),
            },
            {
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
                <TouchableHighlight
                    underlayColor="#1b1d1f"
                    onPress={() => this.usePhase(phase, this.props.character.showSecondary)}
                    onLongPress={() => this.abortPhase(phase)}
                >
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
                <View style={{flex: 0.75, justifyContent: 'flex-start', alignSelf: 'center'}}>
                    <Button label="roll" style={styles.buttonTiny} onPress={() => this.rollToHit(stateKey)} />
                </View>
            );
        }

        return <View style={{flex: 0.75}} />;
    }

    _renderCv(stateKey, renderRollButton = false) {
        if (!this.state.combatDetails.hasOwnProperty(stateKey)) {
            return null;
        }

        return (
            <View style={{flexDirection: 'row', alignSelf: 'stretch', justifyContent: 'center'}}>
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
        );
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
        const combatDetailsKey = this.props.character.showSecondary ? 'secondary' : 'primary';

        if (
            this.props.character.combatDetails[combatDetailsKey].hasOwnProperty('statuses') &&
            this.props.character.combatDetails[combatDetailsKey].statuses.length > 0
        ) {
            return (
                <Fragment>
                    {this.props.character.combatDetails[combatDetailsKey].statuses.map((status, index) => {
                        let statusText = status.label === '' ? `${status.name} - ` : `${status.label} (${status.name})`;

                        switch (status.name) {
                            case 'Aid':
                            case 'Drain':
                                statusText += `: ${status.activePoints < 0 ? status.activePoints : `+${status.activePoints}`} AP to ${status.targetTrait}`;
                                break;
                            case 'Entangle':
                                statusText += `: ${status.body} BODY, ${status.pd}/${status.ed}`;
                                break;
                            case 'Flash':
                                statusText += `: For ${status.segments} segments`;
                                break;
                            default:
                            // Do nothing
                        }

                        return (
                            <View
                                key={`status-${index}`}
                                style={{flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingBottom: verticalScale(10)}}
                            >
                                <View style={{flex: 1, flexGrow: 1, alignSelf: 'flex-start'}}>
                                    <Text style={styles.grey}>•</Text>
                                </View>
                                <View style={{flex: 1, flexGrow: 20, alignSelf: 'center', justifyContent: 'center'}}>
                                    <Text style={styles.grey}>{statusText}</Text>
                                </View>
                                <Icon
                                    type="FontAwesome"
                                    name="edit"
                                    style={{fontSize: verticalScale(20), color: '#14354d', marginRight: scale(10), paddingTop: verticalScale(3)}}
                                    onPress={() => this.editStatus(index)}
                                />
                                <Icon
                                    type="FontAwesome"
                                    name="trash"
                                    style={{fontSize: verticalScale(20), color: '#14354d'}}
                                    onPress={() => this.clearStatus(index)}
                                />
                            </View>
                        );
                    })}
                </Fragment>
            );
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
                <ImageBackground
                    source={require('../../../public/background.png')}
                    style={{flex: 1, flexDirection: 'column'}}
                    imageStyle={{resizeMode: 'repeat'}}
                >
                    <Heading text="Health" />
                    <View style={{alignSelf: 'center', alignItems: 'center', justifyContent: 'center'}}>
                        {this._renderHealthItem('stun')}
                        {this._renderHealthItem('body')}
                        {this._renderHealthItem('endurance', 'END')}
                        <View style={[styles.buttonContainer, {paddingVertical: verticalScale(10)}]}>
                            <Button
                                label="Recovery"
                                style={styles.buttonTiny}
                                onPress={() => this.takeRecovery()}
                                labelStyle={{fontSize: verticalScale(12), color: '#e8e8e8'}}
                            />
                        </View>
                    </View>
                    <Heading text="Status Effects" />
                    <View style={{flex: 1, paddingHorizontal: scale(10), alignItems: 'center', paddingBottom: verticalScale(10)}}>
                        <View style={{flex: 1, flexDirection: 'row', alignSelf: 'flex-end', paddingBottom: verticalScale(10)}}>
                            <Button
                                label="Add"
                                style={styles.buttonTiny}
                                onPress={() => this.openStatusDialog()}
                                labelStyle={{fontSize: verticalScale(12), color: '#e8e8e8'}}
                            />
                            <View style={{paddingHorizontal: scale(5)}} />
                            <Button
                                label="Clear All"
                                style={styles.buttonTiny}
                                onPress={() => this.clearAllStatuses()}
                                labelStyle={{fontSize: verticalScale(12), color: '#e8e8e8'}}
                            />
                        </View>
                        {this._renderStatuses()}
                    </View>
                    <Heading text="Defenses" />
                    <View style={{flex: 1, width: scale(300), alignSelf: 'center', alignItems: 'center', paddingBottom: verticalScale(10)}}>
                        {this._renderDefenses()}
                    </View>
                    <Heading text="Phases" />
                    <View style={{flex: 1, flexDirection: 'row', alignSelf: 'center', paddingBottom: verticalScale(10)}}>{this._renderPhases()}</View>
                    <Heading text="Combat Values" />
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
                        updateForm={this.props.updateForm}
                        updateFormValue={this.props.updateFormValue}
                        visible={this.state.statusDialogVisible}
                        onApply={this.applyStatus}
                        onClose={this.closeStatusDialog}
                    />
                </ImageBackground>
            </View>
        );
    }
}
