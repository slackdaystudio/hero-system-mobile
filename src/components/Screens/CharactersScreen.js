import React, {Fragment, useCallback, useState} from 'react';
import PropTypes from 'prop-types';
import {useDispatch, useSelector} from 'react-redux';
import {useFocusEffect} from '@react-navigation/native';
import {View} from 'react-native';
import {Container, Content, Button, Spinner, Text, List, ListItem, Left, Right, Body, Icon} from 'native-base';
import DropDownPicker from 'react-native-dropdown-picker';
import {scale, verticalScale} from 'react-native-size-matters';
import Header from '../Header/Header';
import Heading from '../Heading/Heading';
import ConfirmationDialog from '../ConfirmationDialog/ConfirmationDialog';
import {file} from '../../lib/File';
import {common} from '../../lib/Common';
import {combatDetails} from '../../lib/CombatDetails';
import {setCharacter, clearCharacter, updateLoadedCharacters} from '../../reducers/character';
import {MAX_CHARACTER_SLOTS} from '../../lib/Persistence';
import {character as libCharacter} from '../../lib/Character';
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

export const CharactersScreen = ({navigation, route}) => {
    const dispatch = useDispatch();

    const getSlots = () => {
        const slots = [];

        for (let i = 0; i < MAX_CHARACTER_SLOTS; i++) {
            slots[i] = {
                label: `Slot ${i + 1}`,
                value: i,
            };
        }

        return slots;
    };

    const refreshCharacters = useCallback((onComplete) => {
        setCharactersLoading(true);

        file.listCharacters()
            .then((chars) => {
                setLoadedCharacters(chars);

                if (typeof onComplete === 'function') {
                    onComplete();
                }
            })
            .catch((error) => {
                console.error(error.message);
            })
            .finally(() => {
                setCharactersLoading(false);
            });
    }, []);

    useFocusEffect(
        useCallback(() => {
            refreshCharacters();

            if (route.params !== undefined && route.params.hasOwnProperty('slot')) {
                setValue(route.params.slot);
            }
        }, [route, refreshCharacters]),
    );

    const {character, characters} = useSelector((state) => state.character);

    const [loadedCharacters, setLoadedCharacters] = useState(null);

    const [open, setOpen] = useState(false);

    const [value, setValue] = useState(0);

    const [items, setItems] = useState(getSlots());

    const [charactersLoading, setCharactersLoading] = useState(true);

    const [dialogProps, setDialogProps] = useState({
        dialogTitle: '',
        dialogMessage: '',
        dialogOnOkFn: null,
        deleteDialogVisible: false,
    });

    const startLoad = () => {
        setCharactersLoading(true);
    };

    const endLoad = () => {
        setCharactersLoading(false);
    };

    const importCharacter = () => {
        if (character !== null && character.hasOwnProperty('filename')) {
            file.saveCharacter(character, character.filename.slice(0, -5)).then(() => {
                libCharacter
                    .import(startLoad, endLoad)
                    .then((char) => {
                        postImport(char);
                    })
                    .catch((error) => {
                        console.error(error.message);
                    });
            });
        } else {
            libCharacter
                .import(startLoad, endLoad)
                .then((char) => {
                    postImport(char);
                })
                .catch((error) => {
                    console.error(error.message);
                });
        }
    };

    const postImport = (newCharacter) => {
        refreshCharacters(() => {
            if (Object.keys(characters).length >= 1) {
                for (let char of Object.values(loadedCharacters)) {
                    if (char !== null && char.filename === newCharacter.filename) {
                        dispatch(updateLoadedCharacters({newCharacter, character, characters}));
                        break;
                    }
                }
            }
        });
    };

    const onViewCharacterPress = (characterFilename) => {
        if (!common.isEmptyObject(character) && character.filename === characterFilename) {
            goToCharacterScreen();
        } else {
            if (!common.isEmptyObject(character) && character.hasOwnProperty('filename')) {
                file.saveCharacter(character, character.filename.slice(0, -5))
                    .then(() => {
                        loadCharacter(characterFilename);
                    })
                    .catch((error) => {
                        console.error(error.message);
                    });
            } else {
                loadCharacter(characterFilename);
            }
        }
    };

    const loadCharacter = (characterFilename) => {
        file.loadCharacter(characterFilename, startLoad, endLoad)
            .then((char) => {
                // Legacy: done on character load now, do not touch
                if (!char.hasOwnProperty('filename')) {
                    char.filename = characterFilename;
                    char.showSecondary = true;
                    char.combatDetails = combatDetails.init(char);
                }

                dispatch(setCharacter({character: char, slot: value.toString()}));

                goToCharacterScreen();
            })
            .catch((error) => console.error(error));
    };

    const goToCharacterScreen = () => {
        navigation.navigate('ViewHeroDesignerCharacter', {from: 'Characters'});
    };

    const openDeleteDialog = (filename) => {
        const newState = {...dialogProps};

        newState.dialogTitle = `Delete ${filename.slice(0, -5)}?`;
        newState.dialogMessage =
            'Are you certain you want to delete this character?\n\nThis will permanently delete your current health and any notes you have recorded';
        newState.dialogOnOkFn = () => onDeleteDialogOk(filename);
        newState.deleteDialogVisible = true;

        setDialogProps(newState);
    };

    const onDeleteDialogClose = () => {
        setDialogProps({
            dialogTitle: '',
            dialogMessage: '',
            dialogOnOkFn: null,
            deleteDialogVisible: false,
        });
    };

    const onDeleteDialogOk = (filename) => {
        file.deleteCharacter(filename).then(() => {
            if (!common.isEmptyObject(character)) {
                dispatch(
                    clearCharacter({
                        toBeDeleted: filename,
                        character: character,
                        characters: loadedCharacters,
                        saveCharacter: false,
                    }),
                );

                refreshCharacters();
                onDeleteDialogClose();
            }
        });
    };

    const renderCharacters = () => {
        if (loadedCharacters === null || charactersLoading) {
            return <Spinner color="#D0D1D3" />;
        }

        let name = null;

        return (
            <Fragment>
                <View style={{flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-around', width: scale(300), alignSelf: 'center'}}>
                    <View style={{flex: 1}}>
                        <Text style={styles.grey}>Load character into: </Text>
                    </View>
                    <View style={{flex: 1}}>
                        <DropDownPicker
                            theme="DARK"
                            listMode="MODAL"
                            open={open}
                            value={value}
                            items={items}
                            setOpen={setOpen}
                            setValue={setValue}
                            setItems={setItems}
                        />
                    </View>
                </View>
                <List>
                    {loadedCharacters.map((characterName) => {
                        name = characterName.slice(0, -5);

                        return (
                            <ListItem icon key={name}>
                                <Left>
                                    <Icon
                                        type="FontAwesome"
                                        name="trash"
                                        style={{fontSize: verticalScale(25), color: '#14354d', alignSelf: 'center', paddingTop: 0}}
                                        onPress={() => openDeleteDialog(characterName)}
                                    />
                                </Left>
                                <Body>
                                    <Text style={styles.grey}>{name}</Text>
                                </Body>
                                <Right>
                                    <Icon
                                        type="FontAwesome"
                                        name="chevron-right"
                                        style={{fontSize: verticalScale(20), color: '#e8e8e8', alignSelf: 'center', paddingTop: 0}}
                                        onPress={() => onViewCharacterPress(characterName)}
                                    />
                                </Right>
                            </ListItem>
                        );
                    })}
                </List>
                <View style={[styles.buttonContainer, {paddingTop: verticalScale(20)}]}>
                    <Button style={styles.button} onPress={() => importCharacter()}>
                        <Text uppercase={false} style={styles.buttonText}>
                            Import
                        </Text>
                    </Button>
                </View>
            </Fragment>
        );
    };

    return (
        <Container style={styles.container}>
            <Header navigation={navigation} />
            <Content style={styles.content}>
                <Heading text="Characters" />
                {renderCharacters()}
                <View style={{paddingBottom: verticalScale(20)}} />
                <ConfirmationDialog
                    visible={dialogProps.deleteDialogVisible}
                    title={dialogProps.dialogTitle}
                    info={dialogProps.dialogMessage}
                    onOk={dialogProps.dialogOnOkFn}
                    onClose={onDeleteDialogClose}
                />
            </Content>
        </Container>
    );
};

CharactersScreen.propTypes = {
    route: PropTypes.object.isRequired,
    navigation: PropTypes.object.isRequired,
};
