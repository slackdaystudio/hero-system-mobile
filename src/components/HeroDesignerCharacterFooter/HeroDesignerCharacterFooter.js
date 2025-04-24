import React, {useState} from 'react';
import {View} from 'react-native';
import {verticalScale} from 'react-native-size-matters';
import {Icon} from '../Icon/Icon';
import {ConfirmationDialog} from '../ConfirmationDialog/ConfirmationDialog';
import {MAX_CHARACTER_SLOTS} from '../../lib/Persistence';
import {common} from '../../lib/Common';
import {useNavigation} from '@react-navigation/native';
import {useSelector} from 'react-redux';
import {useColorTheme} from '../../hooks/useColorTheme';

export const HeroDesignerCharacterFooter = ({character, characters, selectCharacter, clearCharacter}) => {
    const scheme = useSelector((state) => state.settings.colorScheme);

    const {Colors} = useColorTheme(scheme);

    const navigation = useNavigation();

    const [deleteDialogVisible, setDeleteDialogVisible] = useState(false);

    const [selectedSlot, setSelectedSlot] = useState(null);

    const slots = [];

    for (let i = 0; i < MAX_CHARACTER_SLOTS; i++) {
        slots.push(i);
    }

    // constructor(props) {
    //     super(props);

    //     this.state = {
    //         deleteDialogVisible: false,
    //         selectedSlot: null,
    //     };

    //     this.slots = [];

    //     for (let i = 0; i < MAX_CHARACTER_SLOTS; i++) {
    //         this.slots.push(i);
    //     }

    //     this.onDeleteDialogOk = this._onDeleteDialogOk.bind(this);
    //     this.onDeleteDialogClose = this._onDeleteDialogClose.bind(this);
    // }

    // componentDidUpdate(prevProps) {
    //     if (character !== null && prevProps.character !== null && prevProps.character.filename !== character.filename) {
    //         this.props.navigation.navigate('ViewHeroDesignerCharacter');
    //     }
    // }

    const _isCharacterSelected = (slot) => {
        if (character === null || character === undefined) {
            return false;
        }

        return character.filename === characters[slot]?.filename;
    };

    const _isSlotFilled = (slot) => {
        return !common.isEmptyObject(characters[slot.toString()]);
    };

    const _getIcon = (slot) => {
        if (_isSlotFilled(slot)) {
            return 'user';
        }

        return 'user-plus';
    };

    const _activateSlot = (slot) => {
        if (_isSlotFilled(slot)) {
            if (character.filename !== characters[slot].filename) {
                selectCharacter(characters[slot]);
            }
        } else {
            navigation.navigate('Characters', {from: 'ViewHeroDesignerCharacter', slot: parseInt(slot, 10)});
        }
    };

    const _emptySlot = (slot) => {
        if (_isSlotFilled(slot) && !_isCharacterSelected(slot)) {
            setSelectedSlot(slot.toString());

            setDeleteDialogVisible(true);
        }
    };

    const _onDeleteDialogOk = () => {
        clearCharacter(characters[selectedSlot.toString()].filename, character, characters, false);

        _onDeleteDialogClose();
    };

    const _onDeleteDialogClose = () => {
        setSelectedSlot(null);

        setDeleteDialogVisible(false);
    };

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
            {slots.map((slot) => {
                return (
                    <Icon
                        key={'character-' + slot}
                        solid
                        name={_getIcon(slot)}
                        style={{fontSize: verticalScale(23), color: Colors.tertiary}}
                        onPress={() => _activateSlot(slot)}
                        onLongPress={() => _emptySlot(slot)}
                    />
                );
            })}
            <ConfirmationDialog
                visible={deleteDialogVisible}
                title="Remove Character?"
                info={'Are you certain you want to remove this character from this slot?\n\nThis will not delete this character from your imported characters.'}
                onOk={_onDeleteDialogOk}
                onClose={_onDeleteDialogClose}
            />
        </View>
    );
};
