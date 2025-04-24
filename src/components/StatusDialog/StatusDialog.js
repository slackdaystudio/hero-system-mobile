import React, {useRef, useState} from 'react';
import {Platform, View, Text, TextInput, KeyboardAvoidingView} from 'react-native';
import DropDownPicker from 'react-native-dropdown-picker';
import Modal from 'react-native-modal';
import {scale, verticalScale} from 'react-native-size-matters';
import SectionedMultiSelect from 'react-native-sectioned-multi-select';
import Icon from 'react-native-vector-icons/MaterialIcons';
import {Button} from '../Button/Button';
import {VirtualizedList} from '../VirtualizedList/VirtualizedList';
import {useSelector} from 'react-redux';
import {useColorTheme} from '../../hooks/useColorTheme';

export const STATUSES = ['Aid', 'Drain', 'Entangle', 'Flash'];

const getItems = (character) => {
    let items = [
        {
            id: 0,
            name: 'Characteristics',
            children: [],
        },
        {
            id: 1,
            name: 'Powers',
            children: [],
        },
    ];

    items[0].children = character.characteristics
        .map((c) => {
            return {
                id: c.shortName,
                name: c.name,
            };
        })
        .slice();

    items[1].children = character.powers
        .map((p) => {
            return {
                id: p.id,
                name: p.name,
            };
        })
        .slice();

    return items;
};

const getItemIds = (targetTrait, items) => {
    const itemIds = [];

    if (targetTrait !== null) {
        for (const category of items) {
            for (const item of category.children) {
                if (targetTrait.includes(item.name)) {
                    itemIds.push(item.id);
                }
            }
        }
    }

    return itemIds;
};

export const StatusDialog = ({character, statusForm, updateForm, updateFormValue, visible, onApply, onClose}) => {
    const scheme = useSelector((state) => state.settings.colorScheme);

    const {Colors, styles} = useColorTheme(scheme);

    const statuses = useRef(getItems(character));

    const [open, setOpen] = useState(false);

    const [value, setValue] = useState(statusForm.name);

    // eslint-disable-next-line no-unused-vars
    const [items, _setItems] = useState(STATUSES.map((status) => ({label: status, value: status})));

    const [selectedItems, setSelectedItems] = useState(getItemIds(statusForm.targetTrait, items));

    // constructor(props) {
    //     super(props);

    //     this.items = this._getItems();

    //     this.state = {
    //         open: props.visible,
    //         value: props.statusForm.name,
    //         items: STATUSES.map((status) => ({label: status, value: status})),
    //         selectedItems: this._getItemIds(props.statusForm.targetTrait, this.items),
    //     };

    //     this.updateFormValue = this._updateFormValue.bind(this);
    //     this.setValue = this._setValue.bind(this);
    // }

    // componentDidUpdate(prevProps) {
    //     if (visible !== prevProps.visible && visible) {
    //         this.setState((state) => ({
    //             ...state,
    //             value: statusForm.name,
    //             selectedItems: this._getItemIds(statusForm.targetTrait, this.items),
    //         }));
    //     }
    // }

    const setNewValue = (callback) => {
        setValue(callback(value));

        updateFormValue('name', value);

        // this.setState((state) => {
        //     const newState = {...state};

        //     newState.value = callback(state.value);

        //     this.updateFormValue('name', newState.value);

        //     return newState;
        // });
    };

    const _updateFormValue = (key, val) => {
        if (key === 'activePoints') {
            if (/^(-)?[0-9]*$/.test(val) === false) {
                return;
            }
        } else if (key !== 'name' && key !== 'label') {
            if (/^[0-9]*$/.test(val) === false) {
                return;
            }
        }

        updateFormValue('status', key, val);
    };

    const onSelectedItemsChange = (newItems) => {
        setSelectedItems(newItems);

        let itemLabels = [];

        for (const category of items) {
            for (const item of category.children) {
                if (selectedItems.includes(item.id)) {
                    itemLabels.push(item.name);
                }
            }
        }

        statusForm.targetTrait = itemLabels.length === 0 ? '' : itemLabels.join(', ');

        updateForm('status', statusForm);
    };

    const _onApply = () => {
        setSelectedItems([]);

        onApply();
    };

    const renderSecondaryControls = () => {
        switch (statusForm.name) {
            case 'Aid':
            case 'Drain':
                return renderAdjustmentControls();
            case 'Entangle':
                return renderEntangleControls();
            case 'Flash':
                return renderFlashControls();
            default:
                return null;
        }
    };

    const renderAdjustmentControls = () => {
        return (
            <>
                <View flexDirection="row" justifyContent="space-between">
                    <Text style={[styles.grey, {alignSelf: 'center'}]}>Active Points:</Text>
                    <TextInput
                        style={styles.textInput}
                        keyboardType="numeric"
                        maxLength={3}
                        defaultValue={statusForm.activePoints.toString()}
                        onEndEditing={(event) => _updateFormValue('activePoints', event.nativeEvent.text)}
                    />
                </View>
                <SectionedMultiSelect
                    styles={{
                        selectToggleText: [styles.grey, {marginLeft: scale(-7), width: 50}],
                        container: {backgroundColor: Colors.background, borderWidth: 1, borderColor: Colors.formControl},
                        searchBar: {backgroundColor: Colors.switchGutter},
                        searchTextInput: {color: Colors.text},
                        separator: {color: Colors.background},
                    }}
                    colors={{
                        selectToggleTextColor: Colors.text,
                        chipColor: Colors.tertiary,
                        primary: Colors.formControl,
                        cancel: Colors.red,
                        text: Colors.text,
                        subText: Colors.text,
                        itemBackground: Colors.background,
                        subItemBackground: Colors.primary,
                        searchSelectionColor: Colors.text,
                    }}
                    items={items}
                    IconRenderer={Icon}
                    searchIconComponent={<Icon name="search" color="white" size={18} style={{paddingLeft: scale(5)}} />}
                    uniqueKey="id"
                    subKey="children"
                    selectText="Select affected..."
                    showDropDowns={true}
                    showCancelButton={true}
                    readOnlyHeadings={true}
                    onSelectedItemsChange={(selected) => onSelectedItemsChange(selected)}
                    selectedItems={selectedItems}
                />
            </>
        );
    };

    const renderEntangleControls = () => {
        return (
            <View>
                <View flexDirection="row" justifyContent="space-between">
                    <Text style={[styles.grey, {alignSelf: 'center'}]}>BODY:</Text>
                    <TextInput
                        style={styles.textInput}
                        keyboardType="numeric"
                        maxLength={3}
                        defaultValue={statusForm.body.toString()}
                        onEndEditing={(event) => _updateFormValue('body', event.nativeEvent.text)}
                    />
                </View>
                <View flexDirection="row" justifyContent="space-between">
                    <Text style={[styles.grey, {alignSelf: 'center'}]}>PD: </Text>
                    <TextInput
                        style={styles.textInput}
                        keyboardType="numeric"
                        maxLength={3}
                        defaultValue={statusForm.pd.toString()}
                        onEndEditing={(event) => _updateFormValue('pd', event.nativeEvent.text)}
                    />
                </View>
                <View flexDirection="row" justifyContent="space-between">
                    <Text style={[styles.grey, {alignSelf: 'center'}]}>ED: </Text>
                    <TextInput
                        style={styles.textInput}
                        keyboardType="numeric"
                        maxLength={3}
                        defaultValue={statusForm.ed.toString()}
                        onEndEditing={(event) => _updateFormValue('ed', event.nativeEvent.text)}
                    />
                </View>
            </View>
        );
    };

    const renderFlashControls = () => {
        return (
            <View flexDirection="row" justifyContent="space-between">
                <Text style={[styles.grey, {alignSelf: 'center'}]}>Segments:</Text>
                <TextInput
                    style={styles.textInput}
                    keyboardType="numeric"
                    maxLength={3}
                    defaultValue={statusForm.segments.toString()}
                    onEndEditing={(event) => _updateFormValue('segments', event.nativeEvent.text)}
                />
            </View>
        );
    };

    return (
        <Modal
            style={{paddingBottom: verticalScale(Platform.OS === 'ios' ? 200 : 10)}}
            isVisible={visible}
            onBackButtonPress={() => onClose()}
            onBackdropPress={() => onClose()}
        >
            <KeyboardAvoidingView behavior="padding">
                <View style={styles.modal}>
                    <Text style={styles.modalHeader}>Apply Status</Text>
                    <VirtualizedList flex={0}>
                        <View style={[styles.modalContent]}>
                            <View flexDirection="row" justifyContent="space-between">
                                <Text style={[styles.grey, {alignSelf: 'center'}]}>Name:</Text>
                                <TextInput
                                    editable
                                    style={[styles.textInput, {width: scale(200)}]}
                                    maxLength={32}
                                    defaultValue={statusForm.label}
                                    onEndEditing={(event) => _updateFormValue('label', event.nativeEvent.text)}
                                />
                            </View>
                            <View flexDirection="row" justifyContent="space-between">
                                <Text style={[styles.grey, {alignSelf: 'center'}]}>Status:</Text>
                                <DropDownPicker
                                    containerStyle={{maxWidth: '75%'}}
                                    theme="DARK"
                                    listMode="MODAL"
                                    open={open}
                                    value={value}
                                    items={statuses.current}
                                    setOpen={(val) => setOpen(val === true)}
                                    setValue={setNewValue}
                                    style={{backgroundColor: Colors.formControl}}
                                    labelStyle={[styles.buttonText, {fontSize: verticalScale(12), paddingLeft: scale(5)}]}
                                    listItemContainerStyle={{backgroundColor: Colors.background}}
                                    selectedItemContainerStyle={{backgroundColor: Colors.formAccent}}
                                    modalContentContainerStyle={{backgroundColor: Colors.primary}}
                                />
                            </View>
                            {renderSecondaryControls()}
                            <View style={{flex: 1, flexDirection: 'row', justifyContent: 'space-around', paddingTop: verticalScale(30)}}>
                                <Button small label="Apply" onPress={() => _onApply()} />
                                <Button small label="Cancel" style={styles.button} onPress={() => onClose()} />
                            </View>
                        </View>
                    </VirtualizedList>
                </View>
            </KeyboardAvoidingView>
        </Modal>
    );
};
