import React, {useState} from 'react';
import {View, TouchableHighlight, Text, Switch} from 'react-native';
import {scale, verticalScale} from 'react-native-size-matters';
import {Heading} from '../Heading/Heading';
import {CircleText} from '../CircleText/CircleText';
import {dieRoller} from '../../lib/DieRoller';
import {common} from '../../lib/Common';
import {heroDesignerCharacter, TYPE_MOVEMENT} from '../../lib/HeroDesignerCharacter';
import strengthTable from '../../../public/strengthTable.json';
import speedTable from '../../../public/speed.json';
import {AccordionCard} from '../Card/AccordionCard';
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

const initCharacteristicsShow = (characteristics, movement) => {
    let show = {};
    let buttonsShow = {};

    characteristics.map((characteristic, index) => {
        show[characteristic.shortName] = false;
        buttonsShow[characteristic.shortName] = 'plus-circle';
    });

    movement.map((move, index) => {
        show[move.shortName] = false;
        buttonsShow[move.shortName] = 'plus-circle';
    });

    return {
        show: show,
        buttonsShow: buttonsShow,
    };
};

export const Characteristics = ({character, setShowSecondary, updateForm}) => {
    const navigation = useNavigation();

    const scheme = useSelector((state) => state.settings.colorScheme);

    const {Colors, styles} = useColorTheme(scheme);

    const {show, buttonsShow} = initCharacteristicsShow(character.characteristics, character.movement);

    const [characteristicsShow, setCharacteristicsShow] = useState(show);

    const [characteristicsButtonsShow, setCharacteristicsButtonsShow] = useState(buttonsShow);

    const powersMap = common.toMap(common.flatten(character.powers, 'powers'));

    // constructor(props) {
    //     super(props);

    //     const displayOptions = initCharacteristicsShow(props.character.characteristics, props.character.movement);

    //     this.state = {
    //         characteristicsShow: displayOptions.characteristicsShow,
    //         characteristicsButtonsShow: displayOptions.characteristicsButtonsShow,
    //         character: props.character,
    //         powersMap: common.toMap(common.flatten(props.character.powers, 'powers')),
    //     };
    // }

    // static getDerivedStateFromProps(nextProps, prevState) {
    //     if (prevState.character !== nextProps.character) {
    //         const displayOptions = initCharacteristicsShow(nextProps.character.characteristics, nextProps.character.movement);
    //         let newState = {...prevState};

    //         newState.characteristicsShow = displayOptions.characteristicsShow;
    //         newState.characteristicsButtonsShow = displayOptions.characteristicsButtonsShow;
    //         newState.character = nextProps.character;
    //         newState.powersMap = common.toMap(common.flatten(nextProps.character.powers, 'powers'));

    //         return newState;
    //     }

    //     return null;
    // }

    const toggleDefinitionShow = (name) => {
        const newShow = {...characteristicsShow};

        newShow[name] = !characteristicsShow[name];

        setCharacteristicsShow(newShow);

        const newButtonsShow = {...characteristicsButtonsShow};

        newButtonsShow[name] = characteristicsButtonsShow[name] === 'plus-circle' ? 'minus-circle' : 'plus-circle';

        setCharacteristicsButtonsShow(newButtonsShow);
        // let newState = {...this.state};
        // newState.characteristicsShow[name] = !newState.characteristicsShow[name];
        // newState.characteristicsButtonsShow[name] = newState.characteristicsButtonsShow[name] === 'plus-circle' ? 'minus-circle' : 'plus-circle';

        // this.setState(newState);
    };

    const getMovementTotal = (characteristic, formatFraction = false) => {
        let meters = characteristic.value;

        if (characteristic.shortName.toUpperCase() === 'LEAPING' && heroDesignerCharacter.isFifth(character)) {
            let total = heroDesignerCharacter.getAdditionalCharacteristicPoints('STR', character) / 5;
            let fractionalPart = parseFloat((total % 1).toFixed(1));

            if (fractionalPart >= 0.6) {
                total = Math.trunc(total) + 0.5;
            } else {
                total = Math.trunc(total);
            }

            meters = characteristic.base + total;
        }

        if (powersMap.has(characteristic.shortName.toUpperCase())) {
            meters = getTotalMeters(powersMap.get(characteristic.shortName.toUpperCase()), meters);
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
    };

    const getTotalMeters = (movementMode, meters) => {
        if (Array.isArray(movementMode)) {
            for (let move of movementMode) {
                meters += getTotalMeters(move, meters);
            }
        } else {
            if (movementMode.affectsPrimary && movementMode.affectsTotal) {
                meters += movementMode.levels;
            } else if (!movementMode.affectsPrimary && movementMode.affectsTotal && character.showSecondary) {
                meters += movementMode.levels;
            }
        }

        return meters;
    };

    const getStrengthDamage = (strength) => {
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
    };

    const rollStrengthDamage = (strengthDamage) => {
        let dice = common.toDice(strengthDamage);

        updateForm('damage', {
            dice: dice.full,
            partialDie: dice.partial,
        });

        navigation.navigate('Damage', {from: 'ViewHeroDesignerCharacter'});
    };

    const renderNotes = (characteristic) => {
        let whitelistedCharacteristics = ['DEX', 'INT', 'EGO', 'SPD'];

        if (whitelistedCharacteristics.includes(characteristic.shortName.toUpperCase())) {
            let note = {
                label: '',
                text: '',
            };

            if (characteristic.shortName.toUpperCase() === 'INT') {
                // TODO: total all sources or PER modifiers
                note.label = 'PER';
                note.text = heroDesignerCharacter.getRollTotal(characteristic, character);
            } else if (characteristic.shortName.toUpperCase() === 'SPD') {
                note.label = 'Phases';
                note.text = speedTable[heroDesignerCharacter.getCharacteristicTotal('SPD', character).toString()].phases.join(', ');
            }

            if (heroDesignerCharacter.isFifth(character)) {
                if (characteristic.shortName.toUpperCase() === 'DEX') {
                    let cv = common.roundInPlayersFavor(heroDesignerCharacter.getCharacteristicTotal('DEX', character) / 3);

                    note.label = 'OCV/DCV';
                    note.text = `${cv}/${cv}`;
                } else if (characteristic.shortName.toUpperCase() === 'EGO') {
                    note.label = 'ECV';
                    note.text = common.roundInPlayersFavor(heroDesignerCharacter.getCharacteristicTotal('EGO', character) / 3);
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
    };

    const renderDefinition = (characteristic) => {
        if (characteristicsShow[characteristic.shortName]) {
            let definition = characteristic.definition;

            if (characteristic.type === TYPE_MOVEMENT) {
                definition = `${definition.split('.').shift()}.`;
            }

            return (
                <View paddingVertical={verticalScale(3)} style={{backgroundColor: Colors.background}}>
                    <View style={{backgroundColor: Colors.background}}>
                        {renderNonCombatMovement(characteristic)}
                        {renderStrength(characteristic)}
                        {renderNotes(characteristic)}
                        <Text style={styles.grey}>{definition}</Text>
                    </View>
                    <View flexDirection="row" justifyContent="center" style={{backgroundColor: Colors.background, marginTop: verticalScale(10)}}>
                        <Text style={styles.grey}>
                            <Text style={styles.boldGrey}>Base:</Text> {characteristic.base}
                        </Text>
                        <View style={{width: scale(20), alignItems: 'center'}}>
                            <Text style={styles.grey}>&bull;</Text>
                        </View>
                        <Text style={styles.grey}>
                            <Text style={styles.boldGrey}>Cost:</Text> {characteristic.cost}
                        </Text>
                    </View>
                </View>
            );
        }

        return null;
    };

    const renderNonCombatMovement = (characteristic) => {
        if (characteristic.type === TYPE_MOVEMENT) {
            let speed = heroDesignerCharacter.getCharacteristicTotal('SPD', character);
            let movement = getMovementTotal(characteristic);
            let meters = movement;
            let unit = 'm';
            let ncm = 2;

            if (heroDesignerCharacter.isFifth(character)) {
                unit = '"';
                meters *= 2;
            }

            if (powersMap.has(characteristic.shortName.toUpperCase())) {
                ncm = getTotalNcm(powersMap.get(characteristic.shortName.toUpperCase()), ncm);
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
    };

    const getTotalNcm = (movementMode, ncm) => {
        if (Array.isArray(movementMode)) {
            for (let move of movementMode) {
                ncm += getTotalNcm(move, ncm);
            }
        } else {
            if (
                (movementMode.affectsPrimary && movementMode.affectsTotal) ||
                (!movementMode.affectsPrimary && movementMode.affectsTotal && character.showSecondary)
            ) {
                let adderMap = common.toMap(movementMode.adder);

                if (adderMap.has('IMPROVEDNONCOMBAT')) {
                    ncm **= adderMap.get('IMPROVEDNONCOMBAT').levels + 1;
                }
            }
        }

        return ncm;
    };

    const renderStrength = (characteristic) => {
        if (characteristic.shortName === 'STR') {
            let step = null;
            let lift = '0.0 kg';
            let totalStrength = heroDesignerCharacter.getCharacteristicTotal('STR', character);

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

            let strengthDamage = getStrengthDamage(totalStrength);

            return (
                <View style={{flex: 1, paddingBottom: verticalScale(10)}}>
                    <TouchableHighlight underlayColor="#121212" onPress={() => rollStrengthDamage(strengthDamage)}>
                        <Text style={styles.grey}>
                            <Text style={styles.boldGrey}>Damage:</Text> {strengthDamage}
                        </Text>
                    </TouchableHighlight>

                    <Text style={styles.grey}>
                        <Text style={styles.boldGrey}>Lift:</Text> {renderLift(lift)}
                    </Text>
                    <Text style={styles.grey}>
                        <Text style={styles.boldGrey}>Example:</Text> {step.example}
                    </Text>
                </View>
            );
        }

        return null;
    };

    const renderLift = (lift) => {
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
    };

    const renderStat = (characteristic) => {
        if (characteristic.type === TYPE_MOVEMENT) {
            let unit = 'm';

            if (heroDesignerCharacter.isFifth(character)) {
                unit = '"';
            }

            return <CircleText title={getMovementTotal(characteristic, true) + unit} fontSize={18} size={55} color={Colors.formControl} />;
        }

        return (
            <CircleText
                title={heroDesignerCharacter.getCharacteristicTotal(characteristic.shortName, character).toString()}
                fontSize={18}
                size={45}
                color={Colors.formControl}
            />
        );
    };

    const renderCharacteristics = (characteristics) => {
        return (
            <>
                {characteristics.map((characteristic, index) => {
                    let name = characteristic.name.toLowerCase().startsWith('custom') ? characteristic.shortName : characteristic.name;

                    return (
                        <View key={`characteristic-${index}`} marginBottom={verticalScale(5)}>
                            <AccordionCard
                                title={
                                    <View flex={1} flexDirection="row" alignItems="center" paddingTop={verticalScale(2)}>
                                        {renderStat(characteristic)}
                                        <Text
                                            style={[
                                                styles.grey,
                                                {fontSize: verticalScale(16), paddingLeft: scale(10), fontFamily: 'Roboto', fontVariant: 'small-caps'},
                                            ]}
                                        >
                                            {name}
                                        </Text>
                                    </View>
                                }
                                onTitlePress={() => toggleDefinitionShow(characteristic.shortName)}
                                secondaryTitle={
                                    <TouchableHighlight
                                        underlayColor={Colors.secondaryForm}
                                        onPress={() =>
                                            navigation.navigate('Result', {
                                                from: 'ViewHeroDesignerCharacter',
                                                result: dieRoller.rollCheck(heroDesignerCharacter.getRollTotal(characteristic, character)),
                                            })
                                        }
                                    >
                                        <Text style={[styles.grey, {fontSize: verticalScale(16), paddingLeft: scale(10)}]}>
                                            {heroDesignerCharacter.getRollTotal(characteristic, character)}
                                        </Text>
                                    </TouchableHighlight>
                                }
                                content={renderDefinition(characteristic)}
                                showContent={characteristicsShow[characteristic.shortName]}
                            />
                        </View>
                    );
                })}
            </>
        );
    };

    const toggleSecondaryCharacteristics = () => {
        setShowSecondary(!character.showSecondary);
    };

    const renderSecondaryCharacteristicToggle = () => {
        if (heroDesignerCharacter.hasSecondaryCharacteristics(common.flatten(character.powers, 'powers'))) {
            return (
                <View style={{flex: 1, flexDirection: 'row', justifyContent: 'space-around', paddingVertical: verticalScale(20)}}>
                    <View>
                        <Text style={styles.boldGrey}>Include Secondary Characteristics?</Text>
                    </View>
                    <View>
                        <Switch
                            value={character.showSecondary}
                            onValueChange={() => toggleSecondaryCharacteristics()}
                            color="#3da0ff"
                            minimumTrackTintColor={Colors.formAccent}
                            maximumTrackTintColor={Colors.secondaryForm}
                            thumbColor={Colors.formControl}
                            trackColor={{false: Colors.switchGutter, true: Colors.formAccent}}
                            ios_backgroundColor={Colors.switchGutter}
                        />
                    </View>
                </View>
            );
        }

        return null;
    };

    return (
        <View>
            {renderSecondaryCharacteristicToggle()}
            {renderCharacteristics(character.characteristics)}
            <View style={{paddingTop: verticalScale(20)}} />
            <Heading text="Movement" />
            {renderCharacteristics(character.movement)}
        </View>
    );
};
