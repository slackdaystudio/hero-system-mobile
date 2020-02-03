import React, { Component }  from 'react';
import PropTypes from 'prop-types';
import { View, Alert } from 'react-native';
import { Button, Text, Icon, Footer, FooterTab } from 'native-base';
import { verticalScale } from 'react-native-size-matters';
import ConfirmationDialog from '../ConfirmationDialog/ConfirmationDialog';
import { MAX_CHARACTER_SLOTS } from '../../lib/Persistence';
import { character as libCharacter } from '../../lib/Character';
import styles from '../../Styles';

export default class HeroDesignerCharacterFooter extends Component {
    static propTypes = {
        navigation: PropTypes.object.isRequired,
        character: PropTypes.object,
        characters: PropTypes.object.isRequired,
        selectCharacter: PropTypes.func.isRequired,
        emptyCharacterSlot: PropTypes.func.isRequired,
    }

    constructor(props) {
        super(props);

        this.state = {
            deleteDialogVisible: false,
            selectedSlot: null,
        };

        this.slots = [];

        for (let i = 0; i < MAX_CHARACTER_SLOTS; i++) {
            this.slots.push(i);
        }

        this.onDeleteDialogOk = this._onDeleteDialogOk.bind(this);
        this.onDeleteDialogClose = this._onDeleteDialogClose.bind(this);
    }

    componentDidUpdate(prevProps, prevState, snapshot) {
        if (this.props.character !== null && prevProps.character !== null && prevProps.character.filename !== this.props.character.filename) {
            if (libCharacter.isHeroDesignerCharacter(this.props.character)) {
                this.props.navigation.navigate('ViewHeroDesignerCharacter');
            } else {
                this.props.navigation.navigate('ViewCharacter');
            }
        }
    }

    _isCharacterSelected(slot) {
        if (this.props.character === null || this.props.character === undefined) {
            return false;
        }

        return this.props.character.filename === this.props.characters[slot].filename;
    }

    _isSlotFilled(slot) {
        return this.props.characters[slot] !== null;
    }

    _getBackgroundColor(slot) {
        if (this._isSlotFilled(slot) && this._isCharacterSelected(slot)) {
            return '#121212';
        }

        return '#000';
    }

    _getIcon(slot) {
        if (this._isSlotFilled(slot)) {
            return 'user';
        }

        return 'user-plus';
    }

    _activateSlot(slot) {
        if (this._isSlotFilled(slot)) {
            if (this.props.character.filename !== this.props.characters[slot].filename) {
                this.props.selectCharacter(this.props.characters[slot]);
            }
        } else {
            this.props.navigation.navigate('Characters', {from: 'ViewHeroDesignerCharacter', slot: parseInt(slot, 10)});
        }
    }

    _emptySlot(slot) {
        if (this._isSlotFilled(slot) && !this._isCharacterSelected(slot)) {
            this.setState({deleteDialogVisible: true, selectedSlot: slot});
        }
    }

    _onDeleteDialogOk() {
        this.props.emptyCharacterSlot(this.state.selectedSlot);

        this._onDeleteDialogClose();
    }

    _onDeleteDialogClose() {
        this.setState({deleteDialogVisible: false, selectedSlot: null});
    }

    render() {
        return (
            <Footer>
                <FooterTab style={{justifyContent: 'center', backgroundColor: '#000'}}>
                    {this.slots.map((slot, index) => {
                        return (
                            <Button
                                key={'character-' + slot}
                                style={{backgroundColor: this._getBackgroundColor(slot.toString())}}
                                onPress={() => this._activateSlot(slot.toString())}
                                onLongPress={() => this._emptySlot(slot.toString())}
                            >
                                <Icon type='FontAwesome' name={this._getIcon(slot)} style={{fontSize: verticalScale(23), color: '#e8e8e8'}} />
                            </Button>
                        );
                    })}
                </FooterTab>
                <ConfirmationDialog
                    visible={this.state.deleteDialogVisible}
                    title='Remove Character?'
                    info={`Are you certain you want to remove this character from this slot?\n\nThis will not delete this character from your imported characters.`}
                    onOk={this.onDeleteDialogOk}
                    onClose={this.onDeleteDialogClose}
                />
            </Footer>
        );
    }
}
