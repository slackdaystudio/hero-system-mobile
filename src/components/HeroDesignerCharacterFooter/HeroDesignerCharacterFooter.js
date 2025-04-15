import React, {Component} from 'react';
import PropTypes from 'prop-types';
import {View} from 'react-native';
import {verticalScale} from 'react-native-size-matters';
import {Icon} from '../Icon/Icon';
import ConfirmationDialog from '../ConfirmationDialog/ConfirmationDialog';
import {MAX_CHARACTER_SLOTS} from '../../lib/Persistence';
import {common} from '../../lib/Common';
import {Colors} from '../../Styles';

export default class HeroDesignerCharacterFooter extends Component {
    static propTypes = {
        navigation: PropTypes.object.isRequired,
        character: PropTypes.object,
        characters: PropTypes.object.isRequired,
        selectCharacter: PropTypes.func.isRequired,
        clearCharacter: PropTypes.func.isRequired,
    };

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

    componentDidUpdate(prevProps) {
        if (this.props.character !== null && prevProps.character !== null && prevProps.character.filename !== this.props.character.filename) {
            this.props.navigation.navigate('ViewHeroDesignerCharacter');
        }
    }

    _isCharacterSelected(slot) {
        if (this.props.character === null || this.props.character === undefined) {
            return false;
        }

        return this.props.character.filename === this.props.characters[slot]?.filename;
    }

    _isSlotFilled(slot) {
        return !common.isEmptyObject(this.props.characters[slot.toString()]);
    }

    _getFooterButtonStyle(slot) {
        if (this._isSlotFilled(slot) && this._isCharacterSelected(slot)) {
            return {
                backgroundColor: Colors.tertiary,
                borderWidth: 1,
                borderColor: Colors.formControl,
            };
        }

        return {
            backgroundColor: Colors.tertiary,
        };
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
            const newState = {...this.state};

            newState.selectedSlot = slot.toString();
            newState.deleteDialogVisible = true;

            this.setState(newState);
        }
    }

    _onDeleteDialogOk() {
        this.props.clearCharacter(this.props.characters[this.state.selectedSlot.toString()].filename, this.props.character, this.props.characters, false);

        this._onDeleteDialogClose();
    }

    _onDeleteDialogClose() {
        this.setState({deleteDialogVisible: false, selectedSlot: null});
    }

    render() {
        return (
            <View
                flexDirection="row"
                justifyContent="space-evenly"
                style={{
                    backgroundColor: Colors.primary,
                    paddingVertical: verticalScale(5),
                    borderTopWidth: 0.5,
                    borderColor: Colors.characterFooter,
                    paddingBottom: verticalScale(13),
                }}
            >
                {this.slots.map((slot) => {
                    return (
                        <Icon
                            key={'character-' + slot}
                            solid
                            name={this._getIcon(slot)}
                            style={{fontSize: verticalScale(23), color: Colors.tertiary}}
                            onPress={() => this._activateSlot(slot)}
                            onLongPress={() => this._emptySlot(slot)}
                        />
                    );
                })}
                <ConfirmationDialog
                    visible={this.state.deleteDialogVisible}
                    title="Remove Character?"
                    info={
                        // eslint-disable-next-line max-len
                        'Are you certain you want to remove this character from this slot?\n\nThis will not delete this character from your imported characters.'
                    }
                    onOk={this.onDeleteDialogOk}
                    onClose={this.onDeleteDialogClose}
                />
            </View>
        );
    }
}
