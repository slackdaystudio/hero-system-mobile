import React, { Component, Fragment }  from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { BackHandler, Alert, View, ImageBackground } from 'react-native';
import { Container, Content, Button, Spinner, Text, List, ListItem, Left, Right, Body, Icon, Picker, Item } from 'native-base';
import { NavigationEvents } from 'react-navigation';
import { scale, verticalScale } from 'react-native-size-matters';
import Header from '../Header/Header';
import Heading from '../Heading/Heading';
import ConfirmationDialog from '../ConfirmationDialog/ConfirmationDialog';
import { file } from '../../lib/File';
import { character } from '../../lib/Character';
import { common } from '../../lib/Common';
import { combatDetails } from '../../lib/CombatDetails';
import styles from '../../Styles';
import { setCharacter, clearCharacter } from '../../reducers/character';
import { MAX_CHARACTER_SLOTS } from '../../lib/Persistence';

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
        navigation: PropTypes.object.isRequired,
        character: PropTypes.object,
        setCharacter: PropTypes.func.isRequired,
        clearCharacter: PropTypes.func.isRequired,
    }

    constructor(props) {
        super(props);

        this.state = {
            characters: null,
            characterLoading: false,
            deleteDialogVisible: false,
            toBeDeleted: null,
            slot: 0,
        };

        this.slots = [];

        for (let i = 0; i < MAX_CHARACTER_SLOTS; i++) {
            this.slots.push(i);
        }

        this.startLoad = this._startLoad.bind(this);
        this.endLoad = this._endLoad.bind(this);
        this.onViewCharacterPress = this._onViewCharacterPress.bind(this);
        this.openDeleteDialog = this._openDeleteDialog.bind(this);
        this.onDeleteDialogOk = this._onDeleteDialogOk.bind(this);
        this.onDeleteDialogClose = this._onDeleteDialogClose.bind(this);
        this.updateSlot = this._updateSlot.bind(this);
    }

    onDidFocus() {
        this._refreshCharacters();

        this.backHandler = BackHandler.addEventListener('hardwareBackPress', () => {
            this.props.navigation.navigate(this._getBackScreen());

            return true;
        });

        if (this.props.navigation.state.params !== undefined && this.props.navigation.state.params.hasOwnProperty('slot')) {
            this.setState({slot: this.props.navigation.state.params.slot});
        }
    }

    onDidBlur() {
        this.backHandler.remove();
    }

    _getBackScreen() {
        let backScreen = 'Home';

        if (this.props.navigation.state.params !== undefined && this.props.navigation.state.params.hasOwnProperty('from')) {
            backScreen = this.props.navigation.state.params.from;
        }

        return backScreen;
    }

    _updateSlot(slot) {
        this.setState({slot: slot});
    }

    _refreshCharacters() {
        file.listCharacters().then((characters) => {
            this.setState({characters: characters});
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
                character.import(this.startLoad, this.endLoad).then(char => {
                    this._refreshCharacters();
                });
            })
        } else {
            character.import(this.startLoad, this.endLoad).then(char => {
                this._refreshCharacters();
            });
        }
    }

    _onViewCharacterPress(characterFilename) {
        if (!common.isEmptyObject(this.props.character) && this.props.character.filename === characterFilename) {
            this._goToCharacterScreen(this.props.character);
        } else {
            if (!common.isEmptyObject(this.props.character) && this.props.character.hasOwnProperty('filename')) {
                file.saveCharacter(this.props.character, this.props.character.filename.slice(0, -5)).then(() => {
                    this._loadCharacter(characterFilename);
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

            this.props.setCharacter(char, this.state.slot.toString());

            this._goToCharacterScreen(char);
        });
    }

    _goToCharacterScreen(char) {
        let screen = 'ViewCharacter';

        if (character.isHeroDesignerCharacter(char)) {
            screen = 'ViewHeroDesignerCharacter';
        }

        this.props.navigation.navigate(screen, {from: 'Characters'});
    }

    _openDeleteDialog(filename) {
        let newState = {...this.state};

        newState.deleteDialogVisible = true;
        newState.toBeDeleted = filename;

        this.setState(newState);
    }

    _onDeleteDialogClose() {
        let newState = {...this.state};

        newState.deleteDialogVisible = false;
        newState.toBeDeleted = null;

        this.setState(newState);
    }

    _onDeleteDialogOk() {
        file.deleteCharacter(this.state.toBeDeleted).then(() => {
            if (!common.isEmptyObject(this.props.character) && this.props.character.filename === this.state.toBeDeleted) {
                this.props.clearCharacter(this.state.toBeDeleted);
            }

            this._onDeleteDialogClose();
            this._refreshCharacters();
        });
    }

    _renderImportCharacterButton() {
        if (this.state.characterLoading) {
            return <Spinner color="#D0D1D3" />;
        }

        return (
            <Button style={styles.button} onPress={() => this.onLoadPress()}>
                <Text uppercase={false} style={styles.buttonText}>View</Text>
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
                        <Picker
                            style={{width: undefined, color: '#FFFFFF'}}
                            textStyle={{fontSize: verticalScale(16), color: '#FFFFFF'}}
                            iosHeader="Select one"
                            mode="dropdown"
                            selectedValue={this.state.slot}
                            onValueChange={(value) => this.updateSlot(value)}
                        >
                            {this.slots.map((slot, index) => {
                                return <Item key={'slot-' + slot} label={`Slot ${slot + 1}`} value={slot} />
                            })}
                        </Picker>
                    </View>
                </View>
                <List>
                    {this.state.characters.map((characterName, index) => {
                        name = characterName.slice(0, -5);

                        return (
                            <ListItem icon key={name}>
                                <Left>
                                    <Icon
                                        type='FontAwesome'
                                        name='trash'
                                        style={{fontSize: verticalScale(25), color: '#14354d', alignSelf: 'center', paddingTop: 0}}
                                        onPress={() => this.openDeleteDialog(characterName)}
                                    />
                                </Left>
                                <Body>
                                    <Text style={styles.grey}>{name}</Text>
                                </Body>
                                <Right>
                                    <Icon
                                        type='FontAwesome'
                                        name='chevron-right'
                                        style={{fontSize: verticalScale(20), color: '#e8e8e8', alignSelf: 'center', paddingTop: 0}}
                                        onPress={() => this.onViewCharacterPress(characterName)}
                                    />
                                </Right>
                            </ListItem>
                        );
                    })}
                </List>
                <View style={[styles.buttonContainer, {paddingTop: verticalScale(20)}]}>
                    <Button style={styles.button}  onPress={() => this._importCharacter()}>
                        <Text uppercase={false} style={styles.buttonText}>Import</Text>
                    </Button>
                </View>
            </Fragment>
        );
    }

    render() {
        return (
            <Container style={styles.container}>
                <NavigationEvents
                    onDidFocus={(payload) => this.onDidFocus()}
                    onDidBlur={(payload) => this.onDidBlur()}
                />
                <Header navigation={this.props.navigation} backScreen='Home' />
                <Content style={styles.content}>
                    <Heading text="Characters" />
                    {this._renderCharacters()}
                    <View style={{paddingBottom: verticalScale(20)}} />
                    <ConfirmationDialog
                        visible={this.state.deleteDialogVisible}
                        title='Delete Character?'
                        info={`Are you certain you want to delete this character?\n\nThis will permanently delete your current health and any notes you have recorded`}
                        onOk={this.onDeleteDialogOk}
                        onClose={this.onDeleteDialogClose}
                    />
                </Content>
            </Container>
        );
    }
}

const mapStateToProps = state => {
    return {
        character: state.character.character
    };
};

const mapDispatchToProps = {
    setCharacter,
    clearCharacter,
};

export default connect(mapStateToProps, mapDispatchToProps)(CharactersScreen);
