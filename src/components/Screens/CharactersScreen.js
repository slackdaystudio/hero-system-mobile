import React, {Component, Fragment} from 'react';
import PropTypes from 'prop-types';
import {connect} from 'react-redux';
import {View} from 'react-native';
import {Container, Content, Button, Spinner, Text, List, ListItem, Left, Right, Body, Icon} from 'native-base';
import DropDownPicker from 'react-native-dropdown-picker';
import {scale, verticalScale} from 'react-native-size-matters';
import Header from '../Header/Header';
import Heading from '../Heading/Heading';
import ConfirmationDialog from '../ConfirmationDialog/ConfirmationDialog';
import {file} from '../../lib/File';
import {character} from '../../lib/Character';
import {common} from '../../lib/Common';
import {combatDetails} from '../../lib/CombatDetails';
import {setCharacter, clearCharacter, updateLoadedCharacters} from '../../reducers/character';
import {MAX_CHARACTER_SLOTS} from '../../lib/Persistence';
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

class CharactersScreen extends Component {
    static propTypes = {
        route: PropTypes.object.isRequired,
        navigation: PropTypes.object.isRequired,
        character: PropTypes.object,
        characters: PropTypes.object,
        setCharacter: PropTypes.func.isRequired,
        clearCharacter: PropTypes.func.isRequired,
        updateLoadedCharacters: PropTypes.func.isRequired,
    };

    constructor(props) {
        super(props);

        this.slots = [];

        for (let i = 0; i < MAX_CHARACTER_SLOTS; i++) {
            this.slots.push(i);
        }

        this.state = {
            characters: null,
            characterLoading: false,
            dialogTitle: '',
            dialogMessage: '',
            dialogOnOkFn: null,
            deleteDialogVisible: false,
            toBeDeleted: null,
            picker: {
                open: false,
                value: null,
                items: this.slots.map((slot, _index) => {
                    return {
                        label: `Slot ${slot + 1}`,
                        value: slot,
                    };
                }),
            },
        };

        this.startLoad = this._startLoad.bind(this);
        this.endLoad = this._endLoad.bind(this);
        this.onViewCharacterPress = this._onViewCharacterPress.bind(this);
        this.openDeleteDialog = this._openDeleteDialog.bind(this);
        this.onDeleteDialogOk = this._onDeleteDialogOk.bind(this);
        this.onDeleteDialogClose = this._onDeleteDialogClose.bind(this);
        this.updateSlot = this._updateSlot.bind(this);
        this.setValue = this._setValue.bind(this);
    }

    componentDidMount() {
        this._unsubscribe = this.props.navigation.addListener('focus', () => {
            this._refreshCharacters();

            if (this.props.route.params !== undefined && this.props.route.params.hasOwnProperty('slot')) {
                this.setState({slot: this.props.route.params.slot});
            }
        });
    }

    componentWillUnmount() {
        this._unsubscribe();
    }

    _setValue(callback) {
        this.setState((state) => ({
            value: callback(state.value),
        }));
    }

    _updateSlot(slot) {
        this.setState({slot: slot});
    }

    _refreshCharacters() {
        file.listCharacters()
            .then((characters) => {
                this.setState({characters: characters});
            })
            .catch((error) => {
                console.log(error.message);
            });
    }

    _startLoad() {
        this.setState({characterLoading: true});
    }

    _endLoad() {
        this.setState({characterLoading: false});
    }

    _importCharacter() {
        if (this.props.character !== null && this.props.character.hasOwnProperty('filename')) {
            file.saveCharacter(this.props.character, this.props.character.filename.slice(0, -5)).then(() => {
                character
                    .import(this.startLoad, this.endLoad)
                    .then((char) => {
                        this._postImport(char);
                    })
                    .catch((error) => {
                        console.log(error.message);
                    });
            });
        } else {
            character
                .import(this.startLoad, this.endLoad)
                .then((char) => {
                    this._postImport(char);
                })
                .catch((error) => {
                    console.log(error.message);
                });
        }
    }

    _postImport(importedCharacter) {
        this._refreshCharacters();

        if (Object.keys(this.props.characters).length >= 1) {
            for (let char of Object.values(this.props.characters)) {
                if (char !== null && char.filename === importedCharacter.filename) {
                    this.props.updateLoadedCharacters(importedCharacter, this.props.character, this.props.characters);
                    break;
                }
            }
        }
    }

    _onViewCharacterPress(characterFilename) {
        if (!common.isEmptyObject(this.props.character) && this.props.character.filename === characterFilename) {
            this._goToCharacterScreen();
        } else {
            if (!common.isEmptyObject(this.props.character) && this.props.character.hasOwnProperty('filename')) {
                file.saveCharacter(this.props.character, this.props.character.filename.slice(0, -5))
                    .then(() => {
                        this._loadCharacter(characterFilename);
                    })
                    .catch((error) => {
                        console.log(error.message);
                    });
            } else {
                this._loadCharacter(characterFilename);
            }
        }
    }

    _loadCharacter(characterFilename) {
        file.loadCharacter(characterFilename, this.startLoad, this.endLoad).then((char) => {
            // Legacy: done on character load now, do not touch
            if (!char.hasOwnProperty('filename')) {
                char.filename = characterFilename;
                char.showSecondary = true;
                char.combatDetails = combatDetails.init(char);
            }

            this.props.setCharacter(char, this.state.picker.value.toString());

            this._goToCharacterScreen();
        });
    }

    _goToCharacterScreen() {
        this.props.navigation.navigate('ViewHeroDesignerCharacter', {from: 'Characters'});
    }

    _openDeleteDialog(filename) {
        let newState = {...this.state};

        newState.dialogTitle = `Delete ${filename.slice(0, -5)}?`;
        newState.dialogMessage =
            'Are you certain you want to delete this character?\n\nThis will permanently delete your current health and any notes you have recorded';
        newState.dialogOnOkFn = this.onDeleteDialogOk;
        newState.deleteDialogVisible = true;
        newState.toBeDeleted = filename;

        this.setState(newState);
    }

    _onDeleteDialogClose() {
        let newState = {...this.state};

        newState.dialogTitle = '';
        newState.dialogMessage = '';
        newState.dialogOnOkFn = null;
        newState.deleteDialogVisible = false;
        newState.toBeDeleted = null;

        this.setState(newState);
    }

    _onDeleteDialogOk() {
        file.deleteCharacter(this.state.toBeDeleted).then(() => {
            if (!common.isEmptyObject(this.props.character)) {
                this.props.clearCharacter(this.state.toBeDeleted, this.props.character, this.props.characters, false);
            }

            this._refreshCharacters();
            this._onDeleteDialogClose();
        });
    }

    _renderImportCharacterButton() {
        if (this.state.characterLoading) {
            return <Spinner color="#D0D1D3" />;
        }

        return (
            <Button style={styles.button} onPress={() => this.onLoadPress()}>
                <Text uppercase={false} style={styles.buttonText}>
                    View
                </Text>
            </Button>
        );
    }

    _renderCharacters() {
        if (this.state.characters === null || this.state.characterLoading) {
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
                            open={this.state.picker.open}
                            value={this.state.picker.value}
                            items={this.state.picker.items}
                            setOpen={(open) => {
                                const newState = {...this.state};

                                newState.picker.open = open;

                                this.setState(newState);
                            }}
                            setValue={(callback) => {
                                this.setState((state) => {
                                    state.picker.value = callback(state.picker.value);
                                });
                            }}
                        />
                    </View>
                </View>
                <List>
                    {this.state.characters.map((characterName, index) => {
                        name = characterName.slice(0, -5);

                        return (
                            <ListItem icon key={name}>
                                <Left>
                                    <Icon
                                        type="FontAwesome"
                                        name="trash"
                                        style={{fontSize: verticalScale(25), color: '#14354d', alignSelf: 'center', paddingTop: 0}}
                                        onPress={() => this.openDeleteDialog(characterName)}
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
                                        onPress={() => this.onViewCharacterPress(characterName)}
                                    />
                                </Right>
                            </ListItem>
                        );
                    })}
                </List>
                <View style={[styles.buttonContainer, {paddingTop: verticalScale(20)}]}>
                    <Button style={styles.button} onPress={() => this._importCharacter()}>
                        <Text uppercase={false} style={styles.buttonText}>
                            Import
                        </Text>
                    </Button>
                </View>
            </Fragment>
        );
    }

    render() {
        return (
            <Container style={styles.container}>
                <Header navigation={this.props.navigation} />
                <Content style={styles.content}>
                    <Heading text="Characters" />
                    {this._renderCharacters()}
                    <View style={{paddingBottom: verticalScale(20)}} />
                    <ConfirmationDialog
                        visible={this.state.deleteDialogVisible}
                        title={this.state.dialogTitle}
                        info={this.state.dialogMessage}
                        onOk={this.state.dialogOnOkFn}
                        onClose={this.onDeleteDialogClose}
                    />
                </Content>
            </Container>
        );
    }
}

const mapStateToProps = (state) => {
    return {
        character: state.character.character,
        characters: state.character.characters,
    };
};

const mapDispatchToProps = {
    setCharacter,
    clearCharacter,
    updateLoadedCharacters,
};

export default connect(mapStateToProps, mapDispatchToProps)(CharactersScreen);
