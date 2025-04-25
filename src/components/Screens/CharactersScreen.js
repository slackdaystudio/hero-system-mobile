import React, {useCallback, useState} from 'react';
import {useDispatch, useSelector} from 'react-redux';
import {useFocusEffect, useNavigation, useRoute} from '@react-navigation/native';
import {ActivityIndicator, Image, Text, View} from 'react-native';
import DropDownPicker from 'react-native-dropdown-picker';
import {scale, verticalScale} from 'react-native-size-matters';
import {Header} from '../Header/Header';
import {Heading} from '../Heading/Heading';
import {Button} from '../Button/Button';
import {ConfirmationDialog} from '../ConfirmationDialog/ConfirmationDialog';
import {VirtualizedList} from '../VirtualizedList/VirtualizedList';
import {file} from '../../lib/File';
import {common} from '../../lib/Common';
import {combatDetails} from '../../lib/CombatDetails';
import {setCharacter, clearCharacter, updateLoadedCharacters} from '../../reducers/character';
import {MAX_CHARACTER_SLOTS} from '../../lib/Persistence';
import {character as libCharacter} from '../../lib/Character';
import {useColorTheme} from '../../hooks/useColorTheme';
import {Card} from '../Card/Card';
import {FooterButton} from '../FooterButton/FooterButton';
import {Animated} from '../Animated';

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

const Portrait = ({character, Colors}) => {
    const [portraitWidth, setPortraitWidth] = useState(0);

    const [portraitHeight, setPortraitHeight] = useState(0);

    if (common.isEmptyObject(character.portrait)) {
        return (
            <Image
                style={{
                    width: 130,
                    height: 137,
                    overflow: 'hidden',
                    borderWidth: 0.75,
                    borderColor: Colors.text,
                    marginLeft: scale(5),
                    tintColor: Colors.text,
                }}
                source={require('../../../public/default-portrait.png')}
            />
        );
    }

    const width = 130;

    Image.getSize(
        character.portrait,
        (imageWidth, imageHeight) => {
            const paddedWidth = width - 10;

            if (imageWidth - paddedWidth > 0) {
                let percentageDecrease = 1 - (imageWidth - paddedWidth) / imageWidth;

                imageWidth = imageWidth * percentageDecrease;
                imageHeight = imageHeight * percentageDecrease;
            }

            setPortraitWidth(imageWidth);
            setPortraitHeight(imageHeight);
        },
        (error) => {
            console.error('Error loading image:', error);
        },
    );

    if (portraitWidth === 0 || portraitHeight === 0) {
        return <ActivityIndicator color={Colors.text} />;
    }

    return (
        <View width={130} height={137} overflow="hidden" borderWidth={1.5} borderColor={Colors.text}>
            <Image
                style={{
                    alignSelf: 'center',
                    width: portraitWidth,
                    height: portraitHeight,
                    overflow: 'hidden',
                }}
                source={{uri: character.portrait.valueOf()}}
            />
        </View>
    );
};

const CharacterCard = ({index, children}) => {
    if (index < 5) {
        return (
            <Animated key={`character-${index}`} animationProps={{from: {opactity: 0, scale: 0.5}, animate: {opactity: 1, scale: 1}, delay: index * 300}}>
                {children}
            </Animated>
        );
    }

    return <View key={`character-${index}`}>{children}</View>;
};

export const CharactersScreen = () => {
    const navigation = useNavigation();

    const route = useRoute();

    const scheme = useSelector((state) => state.settings.colorScheme);

    const {Colors, styles} = useColorTheme(scheme);

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
                        if (common.isEmptyObject(char)) {
                            common.toast('Error: could not import character.');
                        } else {
                            postImport(char);
                        }
                    })
                    .catch((error) => {
                        console.error(error.message);
                    });
            });
        } else {
            libCharacter
                .import(startLoad, endLoad)
                .then((char) => {
                    if (common.isEmptyObject(char)) {
                        common.toast('Error: could not import character.');
                    } else {
                        postImport(char);
                    }
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

    const openDeleteDialog = (name, filename) => {
        const newState = {...dialogProps};

        newState.dialogTitle = `Delete ${name}?`;
        newState.dialogMessage =
            'Are you certain you want to delete this character?\n\nThis will permanently delete your current health and any notes you have recorded';
        newState.dialogOnOkFn = () => onDeleteDialogOk(filename);
        newState.deleteDialogVisible = true;

        setDialogProps(newState);
    };

    const onDeleteDialogClose = (callback) => {
        setDialogProps({
            dialogTitle: '',
            dialogMessage: '',
            dialogOnOkFn: null,
            deleteDialogVisible: false,
        });

        if (typeof callback === 'function') {
            callback();
        }
    };

    const onDeleteDialogOk = (filename) => {
        file.deleteCharacter(filename)
            .then(() => {
                if (!common.isEmptyObject(character)) {
                    dispatch(
                        clearCharacter({
                            toBeDeleted: filename,
                            character: character,
                            characters: loadedCharacters,
                            saveCharacter: false,
                        }),
                    );
                }
            })
            .finally(() => {
                onDeleteDialogClose(refreshCharacters());
            });
    };

    const renderCharacters = () => {
        if (loadedCharacters === null || charactersLoading) {
            return <ActivityIndicator color={Colors.text} />;
        }

        return (
            <VirtualizedList paddingHorizontal={scale(10)}>
                <View style={styles.buttonContainer}>
                    <Button label="Import" style={styles.button} onPress={() => importCharacter()} />
                </View>
                <View style={{flexDirection: 'row', alignItems: 'center', justifyContent: 'space-around', width: scale(300), alignSelf: 'center'}}>
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
                            style={{backgroundColor: Colors.formControl}}
                            labelStyle={[styles.buttonText, {fontSize: verticalScale(12), paddingLeft: scale(5)}]}
                            listItemContainerStyle={{backgroundColor: Colors.background}}
                            selectedItemContainerStyle={{backgroundColor: Colors.formAccent}}
                            modalContentContainerStyle={{backgroundColor: Colors.primary}}
                        />
                    </View>
                </View>
                <View paddingTop={verticalScale(20)} />
                {loadedCharacters.map((c, index) => {
                    return (
                        <CharacterCard index={index} key={`character-${index}`}>
                            <View marginBottom={verticalScale(5)} key={`character-${index}`}>
                                <Card
                                    paddingTop={5}
                                    heading={
                                        <View flex={1} paddingHorizontal={scale(10)}>
                                            <View flex={1} flexDirection="row" justifyContent="space-between">
                                                <View>
                                                    <Text
                                                        style={[
                                                            styles.grey,
                                                            {
                                                                fontSize: verticalScale(15),
                                                                fontWeight: 'bold',
                                                                fontFamily: 'Roboto',
                                                                fontVariant: 'small-caps',
                                                            },
                                                        ]}
                                                    >
                                                        {c.name}
                                                    </Text>
                                                </View>
                                                <View>
                                                    <Text style={[styles.grey, {fontFamily: 'Roboto', fontVariant: 'small-caps', fontSize: verticalScale(12)}]}>
                                                        {c.basePoints}
                                                        <Text style={[styles.grey, {fontSize: verticalScale(8)}]}>+{c.experience}</Text>
                                                    </Text>
                                                </View>
                                            </View>
                                        </View>
                                    }
                                    body={
                                        <View borderTopWidth={0.5} borderBottomWidth={0.5} borderColor="#dce1de">
                                            <View flex={1} flexDirection="row" alignItems="flex-start" justifyContent="space-between">
                                                <View flex={1} paddingTop={verticalScale(10)} paddingBottom={verticalScale(10)}>
                                                    <Portrait character={c} Colors={Colors} />
                                                </View>
                                                <View flex={1.7} paddingTop={verticalScale(10)}>
                                                    <Text style={styles.grey}>
                                                        {c.background?.length > 108 ? `${c.background.substring(0, 105)}...` : c.background}
                                                    </Text>
                                                </View>
                                            </View>
                                        </View>
                                    }
                                    footer={
                                        <View marginVertical={verticalScale(5)} flexDirection="row" width="50%" justifyContent="space-evenly">
                                            <FooterButton circular iconName="eye" size={verticalScale(12)} onPress={() => onViewCharacterPress(c.fileName)} />
                                            <FooterButton
                                                circular
                                                iconName="trash"
                                                size={verticalScale(12)}
                                                onPress={() => openDeleteDialog(c.name, c.fileName)}
                                            />
                                        </View>
                                    }
                                />
                            </View>
                        </CharacterCard>
                    );
                })}
            </VirtualizedList>
        );
    };

    return (
        <>
            <Header navigation={navigation} />
            <Heading text="Characters" />
            <View style={{flex: 1, flexDirection: 'column'}}>{renderCharacters()}</View>
            <View style={{paddingBottom: verticalScale(20)}} />
            <ConfirmationDialog
                visible={dialogProps.deleteDialogVisible}
                title={dialogProps.dialogTitle}
                info={dialogProps.dialogMessage}
                onOk={dialogProps.dialogOnOkFn}
                onClose={onDeleteDialogClose}
            />
        </>
    );
};
