import React, {Fragment, useState} from 'react';
import {View, Text, TouchableHighlight} from 'react-native';
import {scale, verticalScale} from 'react-native-size-matters';
import {Heading} from '../Heading/Heading';
import {Button} from '../Button/Button';
import {Icon} from '../Icon/Icon';
import {CircleText} from '../CircleText/CircleText';
import {NumberPicker} from '../NumberPicker/NumberPicker';
import {StatusDialog} from '../StatusDialog/StatusDialog';
import {common} from '../../lib/Common';
import {heroDesignerCharacter} from '../../lib/HeroDesignerCharacter';
import {dieRoller} from '../../lib/DieRoller';
import {characterTraitDecorator} from '../../decorators/CharacterTraitDecorator';
import {TextInput} from 'react-native-gesture-handler';
import {useNavigation} from '@react-navigation/native';
import {useSelector} from 'react-redux';
import {useColorTheme} from '../../hooks/useColorTheme';
import {useDatabase} from '../../contexts/DatabaseContext';

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

const getCombatDetails = (character) => {
    if (character === null) {
        return null;
    }

    return character.showSecondary ? character.combatDetails.secondary : character.combatDetails.primary;
};

export const Combat = ({
    character,
    forms,
    setSparseCombatDetails,
    checkPhase,
    updateForm,
    updateFormValue,
    resetForm,
    applyStatus,
    clearAllStatuses,
    clearStatus,
}) => {
    const db = useDatabase();

    const navigation = useNavigation();

    const scheme = useSelector((state) => state.settings.colorScheme);

    const {Colors, styles} = useColorTheme(scheme);

    const [statusDialogVisible, setStatusDialogVisible] = useState(false);

    const combatDetails = getCombatDetails(character);

    const updateCombatState = (key, value) => {
        if (/^(-)?[0-9]*$/.test(value) === false) {
            return;
        }

        let newCombatDetails = {...combatDetails};

        newCombatDetails[key] = value;

        setSparseCombatDetails(newCombatDetails, character.showSecondary);
    };

    const resetCombatState = (key) => {
        let newCombatDetails = {...combatDetails};

        newCombatDetails[key] = heroDesignerCharacter.getCharacteristicTotal(key === 'endurance' ? 'end' : key, character);

        setSparseCombatDetails(newCombatDetails, character.showSecondary);
    };

    const takeRecovery = () => {
        let recovery = heroDesignerCharacter.getCharacteristicTotal('rec', character);
        let stunMax = heroDesignerCharacter.getCharacteristicTotal('stun', character);
        let endMax = heroDesignerCharacter.getCharacteristicTotal('end', character);
        let stun = combatDetails.stun;
        let combatStun = parseInt(stun, 10);
        let endurance = combatDetails.endurance;
        let combatEnd = parseInt(endurance, 10);
        let newCombatDetails = {...combatDetails};

        if (stun < stunMax) {
            stun = combatStun + recovery > stunMax ? stunMax : combatStun + recovery;
        }

        if (endurance < endMax) {
            endurance = combatEnd + recovery > endMax ? endMax : combatEnd + recovery;
        }

        newCombatDetails.stun = stun;
        newCombatDetails.endurance = endurance;

        setSparseCombatDetails(newCombatDetails, character.showSecondary);
    };

    const incrementCv = (key, step = 1) => {
        let newCombatDetails = {};

        newCombatDetails[key] = combatDetails[key] + step;

        setSparseCombatDetails(newCombatDetails, character.showSecondary);
    };

    const decrementCv = (key, step = 1) => {
        let newCombatDetails = {...combatDetails};

        newCombatDetails[key] -= step;

        setSparseCombatDetails(newCombatDetails, character.showSecondary);
    };

    const rollToHit = (stateKey) => {
        let hitForm = {...forms.hit};
        hitForm.ocv = combatDetails[stateKey];

        updateForm('hit', hitForm);

        navigation.navigate('Result', {from: 'ViewHeroDesignerCharacter', result: dieRoller.rollToHit(db, hitForm.ocv, 1, false, 0)});
    };

    const _usePhase = (phase) => {
        checkPhase(phase, character.showSecondary, false);
    };

    const abortPhase = (phase) => {
        checkPhase(phase, character.showSecondary, true);
    };

    const openStatusDialog = () => {
        setStatusDialogVisible(true);
    };

    const _applyStatus = () => {
        applyStatus(forms.status);

        resetForm('status');

        closeStatusDialog();
    };

    const editStatus = (index) => {
        const key = character.showSecondary ? 'secondary' : 'primary';
        const status = character.combatDetails[key].statuses[index];
        const statusForm = {...forms.status};

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

        updateForm('status', statusForm);

        openStatusDialog();
    };

    const closeStatusDialog = () => {
        setStatusDialogVisible(false);
    };

    const renderHealthItem = (stateKey, label = null) => {
        return (
            <View style={{flexDirection: 'row', justifyContent: 'space-evenly', alignItems: 'center', paddingHorizontal: scale(25)}}>
                <View style={{flex: 1, alignSelf: 'center'}}>
                    <Text style={styles.boldGrey}>{label === null ? stateKey.toUpperCase() : label}:</Text>
                </View>
                <View style={{flex: 1, alignSelf: 'center'}}>
                    <View style={{alignSelf: 'center', width: scale(75)}}>
                        <TextInput
                            style={styles.textInput}
                            keyboardType="numeric"
                            maxLength={3}
                            defaultValue={combatDetails[stateKey].toString()}
                            onEndEditing={(event) => updateCombatState(stateKey, event.nativeEvent.text)}
                        />
                    </View>
                </View>
                <View marginLeft={scale(25)}>
                    <Button label="Reset" style={styles.buttonTiny} onPress={() => resetCombatState(stateKey)} labelStyle={{fontSize: verticalScale(12)}} />
                </View>
            </View>
        );
    };

    const renderDefenses = () => {
        let rows = [
            {
                label: 'PD',
                value: heroDesignerCharacter.getTotalDefense(character, 'PD'),
            },
            {
                label: 'ED',
                value: heroDesignerCharacter.getTotalDefense(character, 'ED'),
            },
            {
                label: 'MD',
                value: heroDesignerCharacter.getTotalUnusualDefense(character, 'MENTALDEFENSE'),
            },
            {
                label: 'PwD',
                value: heroDesignerCharacter.getTotalUnusualDefense(character, 'POWERDEFENSE'),
            },
        ];

        return (
            <>
                <View style={{flex: 1, flexDirection: 'row'}}>
                    {renderDefense(rows[0])}
                    {renderDefense(rows[1])}
                </View>
                <View style={{flex: 1, flexDirection: 'row'}}>
                    {renderDefense(rows[2])}
                    {renderDefense(rows[3])}
                </View>
            </>
        );
    };

    const renderDefense = (row) => {
        return (
            <>
                <View style={{flex: 1, flexDirection: 'row', alignSelf: 'center', justifyContent: 'flex-end'}}>
                    <Text style={styles.boldGrey}>{row.label}: </Text>
                </View>
                <View style={{flex: 1, flexDirection: 'row', alignSelf: 'center'}}>
                    <View style={{flex: 1}}>
                        <Text style={styles.grey}>{row.value}</Text>
                    </View>
                </View>
            </>
        );
    };

    const renderPhases = () => {
        let phases = Object.keys(combatDetails.phases);

        if (phases.length > 6) {
            let firstRow = phases.slice(0, 6);
            let secondRow = phases.slice(6);

            return (
                <View style={{flex: 1, alignItems: 'center'}}>
                    <View style={{flex: 1, flexDirection: 'row', paddingBottom: verticalScale(10)}}>
                        {firstRow.map((phase, index) => {
                            return renderPhase(phase.toString());
                        })}
                    </View>
                    <View style={{flex: 1, flexDirection: 'row', paddingBottom: verticalScale(10)}}>
                        {secondRow.map((phase, index) => {
                            return renderPhase(phase.toString());
                        })}
                    </View>
                    {renderPhaseInfo()}
                </View>
            );
        }

        return (
            <View style={{flex: 1, alignItems: 'center'}}>
                <View style={{flex: 1, flexDirection: 'row', paddingBottom: verticalScale(10)}}>
                    {phases.map((phase, index) => {
                        return renderPhase(phase.toString());
                    })}
                </View>
                {renderPhaseInfo()}
            </View>
        );
    };

    const renderPhase = (phase) => {
        let color = Colors.formControl;

        if (combatDetails.phases[phase].used) {
            color = '#FFC300';
        } else if (combatDetails.phases[phase].aborted) {
            color = '#D11F1F';
        }

        return (
            <View key={`phase-${phase}`} style={{paddingHorizontal: scale(5)}}>
                <TouchableHighlight
                    underlayColor={Colors.background}
                    onPress={() => _usePhase(phase, character.showSecondary)}
                    onLongPress={() => abortPhase(phase)}
                >
                    <CircleText title={phase} fontSize={18} size={40} color={color} />
                </TouchableHighlight>
            </View>
        );
    };

    const renderPhaseInfo = () => {
        return (
            <View style={{flex: 1, flexDirection: 'row', justifyContent: 'center'}}>
                <Text style={styles.grey}>
                    <Text style={styles.boldGrey}>Dexterity:</Text> {heroDesignerCharacter.getCharacteristicTotal('DEX', character)}
                </Text>
                <View style={{width: scale(40)}} />
                <Text style={styles.grey}>
                    <Text style={styles.boldGrey}>Speed:</Text> {heroDesignerCharacter.getCharacteristicTotal('SPD', character)}
                </Text>
            </View>
        );
    };

    const renderCvRollButton = (stateKey, renderRollButton) => {
        if (renderRollButton) {
            return (
                <View style={{flex: 0.75, justifyContent: 'flex-start', alignSelf: 'center'}}>
                    <Button label="roll" style={styles.buttonTiny} onPress={() => rollToHit(stateKey)} />
                </View>
            );
        }

        return <View style={{flex: 0.75}} />;
    };

    const renderCv = (stateKey, renderRollButton = false) => {
        if (!combatDetails.hasOwnProperty(stateKey)) {
            return null;
        }

        return (
            <View style={{flexDirection: 'row', alignSelf: 'stretch', justifyContent: 'center'}}>
                <View style={{flex: 1, alignSelf: 'center'}}>
                    <Text style={styles.boldGrey}>{stateKey.toUpperCase()}:</Text>
                </View>
                <View style={{flex: 1, alignSelf: 'center'}}>
                    <NumberPicker
                        value={combatDetails[stateKey] ?? heroDesignerCharacter.getCharacteristicTotal(stateKey, character)}
                        increment={incrementCv}
                        decrement={decrementCv}
                        stateKey={stateKey}
                    />
                </View>
                {renderCvRollButton(stateKey, renderRollButton)}
            </View>
        );
    };

    const renderLevels = () => {
        if (character.skills.length > 0) {
            let skillMap = common.toMap(common.flatten(character.skills, 'skills'));

            if (skillMap.has('COMBAT_LEVELS') || skillMap.has('SKILL_LEVELS')) {
                return (
                    <View style={{flex: 1, width: scale(300), alignSelf: 'center', paddingTop: verticalScale(10)}}>
                        {Array.from(skillMap.values()).map((skill, index) => {
                            if (Array.isArray(skill)) {
                                return skill.map((s, i) => {
                                    return renderCombatSkillLevel(s);
                                });
                            } else {
                                return renderCombatSkillLevel(skill);
                            }
                        })}
                    </View>
                );
            }
        }

        return null;
    };

    const renderCombatSkillLevel = (skill) => {
        if (skill.xmlid.toUpperCase() !== 'COMBAT_LEVELS' && skill.xmlid.toUpperCase() !== 'SKILL_LEVELS') {
            return null;
        }

        if (skill.xmlid.toUpperCase() === 'SKILL_LEVELS') {
            if (skill.optionid.toUpperCase() !== 'OVERALL') {
                return null;
            }
        }

        let decorated = characterTraitDecorator.decorate(skill, 'skills', () => character);

        return (
            <View style={{flex: 1, flexDirection: 'row'}} key={'skill-' + decorated.trait.id}>
                <View>
                    <Text style={styles.grey}>{decorated.label()}</Text>
                </View>
            </View>
        );
    };

    const renderStatuses = () => {
        const combatDetailsKey = character.showSecondary ? 'secondary' : 'primary';

        if (character.combatDetails[combatDetailsKey].hasOwnProperty('statuses') && character.combatDetails[combatDetailsKey].statuses.length > 0) {
            return (
                <Fragment>
                    {character.combatDetails[combatDetailsKey].statuses.map((status, index) => {
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
                                    style={{fontSize: verticalScale(20), color: Colors.formControl, marginRight: scale(10), paddingTop: verticalScale(3)}}
                                    onPress={() => editStatus(index)}
                                />
                                <Icon
                                    type="FontAwesome"
                                    name="trash"
                                    style={{fontSize: verticalScale(20), color: Colors.formControl}}
                                    onPress={() => clearStatus(index)}
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
    };

    return (
        <View>
            <Heading text="Health" />
            <View style={{alignSelf: 'center', alignItems: 'center', justifyContent: 'center'}}>
                {renderHealthItem('stun')}
                {renderHealthItem('body')}
                {renderHealthItem('endurance', 'END')}
                <View style={[styles.buttonContainer, {paddingVertical: verticalScale(10)}]}>
                    <Button label="Recovery" style={styles.buttonTiny} onPress={() => takeRecovery()} labelStyle={{fontSize: verticalScale(12)}} />
                </View>
            </View>
            <Heading text="Status Effects" />
            <View style={{flex: 1, paddingHorizontal: scale(10), alignItems: 'center', paddingBottom: verticalScale(10)}}>
                <View style={{flex: 1, flexDirection: 'row', alignSelf: 'flex-end', paddingBottom: verticalScale(10)}}>
                    <Button label="Add" style={styles.buttonTiny} onPress={() => openStatusDialog()} labelStyle={{fontSize: verticalScale(12)}} />
                    <View style={{paddingHorizontal: scale(5)}} />
                    <Button label="Clear All" style={styles.buttonTiny} onPress={() => clearAllStatuses()} labelStyle={{fontSize: verticalScale(12)}} />
                </View>
                {renderStatuses()}
            </View>
            <Heading text="Defenses" />
            <View style={{flex: 1, width: scale(300), alignSelf: 'center', alignItems: 'center', paddingBottom: verticalScale(10)}}>{renderDefenses()}</View>
            <Heading text="Phases" />
            <View style={{flex: 1, flexDirection: 'row', alignSelf: 'center', paddingBottom: verticalScale(10)}}>{renderPhases()}</View>
            <Heading text="Combat Values" />
            <View style={{flex: 1, width: scale(300), alignSelf: 'center', alignItems: 'center', justifyContent: 'center'}}>
                {renderCv('ocv', true)}
                {renderCv('dcv')}
                {renderCv('omcv', true)}
                {renderCv('dmcv')}
            </View>
            {renderLevels()}
            <StatusDialog
                character={character}
                statusForm={forms.status}
                updateForm={updateForm}
                updateFormValue={updateFormValue}
                visible={statusDialogVisible}
                onApply={_applyStatus}
                onClose={closeStatusDialog}
            />
        </View>
    );
};
