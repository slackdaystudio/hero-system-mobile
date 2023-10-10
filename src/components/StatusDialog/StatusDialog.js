import React, {Component, Fragment} from 'react';
import PropTypes from 'prop-types';
import {Platform, View, Text, TextInput, KeyboardAvoidingView} from 'react-native';
import DropDownPicker from 'react-native-dropdown-picker';
import Modal from 'react-native-modal';
import {scale, verticalScale} from 'react-native-size-matters';
import SectionedMultiSelect from 'react-native-sectioned-multi-select';
import Icon from 'react-native-vector-icons/MaterialIcons';
import {Button} from '../Button/Button';
import styles from '../../Styles';
import {VirtualizedList} from '../VirtualizedList/VirtualizedList';

export const STATUSES = ['Aid', 'Drain', 'Entangle', 'Flash'];

class StatusDialog extends Component {
    static propTypes = {
        character: PropTypes.object.isRequired,
        statusForm: PropTypes.object.isRequired,
        updateForm: PropTypes.func.isRequired,
        updateFormValue: PropTypes.func.isRequired,
        visible: PropTypes.bool.isRequired,
        onApply: PropTypes.func.isRequired,
        onClose: PropTypes.func.isRequired,
    };

    constructor(props) {
        super(props);

        this.items = this._getItems();

        this.state = {
            open: props.visible,
            value: props.statusForm.name,
            items: STATUSES.map((status) => ({label: status, value: status})),
            selectedItems: this._getItemIds(props.statusForm.targetTrait, this.items),
        };

        this.updateFormValue = this._updateFormValue.bind(this);
        this.setValue = this._setValue.bind(this);
    }

    componentDidUpdate(prevProps) {
        if (this.props.visible !== prevProps.visible && this.props.visible) {
            this.setState((state) => ({
                ...state,
                value: this.props.statusForm.name,
                selectedItems: this._getItemIds(this.props.statusForm.targetTrait, this.items),
            }));
        }
    }

    _getItemIds(targetTrait, items) {
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
    }

    _setValue(callback) {
        this.setState((state) => {
            const newState = {...state};

            newState.value = callback(state.value);

            this.updateFormValue('name', newState.value);

            return newState;
        });
    }

    _updateFormValue(key, value) {
        if (key === 'activePoints') {
            if (/^(-)?[0-9]*$/.test(value) === false) {
                return;
            }
        } else if (key !== 'name' && key !== 'label') {
            if (/^[0-9]*$/.test(value) === false) {
                return;
            }
        }

        this.props.updateFormValue('status', key, value);
    }

    _getItems() {
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

        items[0].children = this.props.character.characteristics
            .map((c) => {
                return {
                    id: c.shortName,
                    name: c.name,
                };
            })
            .slice();

        items[1].children = this.props.character.powers
            .map((p) => {
                return {
                    id: p.id,
                    name: p.name,
                };
            })
            .slice();

        return items;
    }

    _onSelectedItemsChange(selectedItems) {
        this.setState({selectedItems: selectedItems}, () => {
            let statusForm = {...this.props.statusForm};
            let itemLabels = [];

            for (const category of this.items) {
                for (const item of category.children) {
                    if (this.state.selectedItems.includes(item.id)) {
                        itemLabels.push(item.name);
                    }
                }
            }

            statusForm.targetTrait = itemLabels.length === 0 ? '' : itemLabels.join(', ');

            this.props.updateForm('status', statusForm);
        });
    }

    _onApply() {
        this.setState({selectedItems: []}, () => {
            this.props.onApply();
        });
    }

    _renderSecondaryControls() {
        switch (this.props.statusForm.name) {
            case 'Aid':
            case 'Drain':
                return this._renderAdjustmentControls();
            case 'Entangle':
                return this._renderEntangleControls();
            case 'Flash':
                return this._renderFlashControls();
            default:
                return null;
        }
    }

    _renderAdjustmentControls() {
        return (
            <>
                <View flexDirection="row" justifyContent="space-between">
                    <Text style={[styles.grey, {alignSelf: 'center'}]}>Active Points:</Text>
                    <TextInput
                        style={styles.textInput}
                        keyboardType="numeric"
                        maxLength={3}
                        defaultValue={this.props.statusForm.activePoints.toString()}
                        onEndEditing={(event) => this.updateFormValue('activePoints', event.nativeEvent.text)}
                    />
                </View>
                <SectionedMultiSelect
                    styles={{
                        selectToggleText: [styles.grey, {marginLeft: scale(-7), width: 50}],
                        container: {backgroundColor: '#1b1d1f', borderWidth: 1, borderColor: '#303030'},
                        searchBar: {backgroundColor: '#000000'},
                        searchTextInput: {color: '#ffffff'},
                        separator: {color: '#e8e8e8'},
                    }}
                    colors={{
                        selectToggleTextColor: '#ffffff',
                        chipColor: '#e8e8e8',
                        primary: '#14354d',
                        cancel: '#14354d',
                        text: '#e8e8e8',
                        subText: '#e8e8e8',
                        itemBackground: '#1b1d1f',
                        subItemBackground: '#1b1d1f',
                        searchSelectionColor: '#ffffff',
                    }}
                    items={this.items}
                    IconRenderer={Icon}
                    searchIconComponent={<Icon name="search" color="white" size={18} style={{paddingLeft: scale(5)}} />}
                    uniqueKey="id"
                    subKey="children"
                    selectText="Select affected..."
                    showDropDowns={true}
                    showCancelButton={true}
                    readOnlyHeadings={true}
                    onSelectedItemsChange={(selected) => this._onSelectedItemsChange(selected)}
                    selectedItems={this.state.selectedItems}
                />
            </>
        );
    }

    _renderEntangleControls() {
        return (
            <View>
                <View flexDirection="row" justifyContent="space-between">
                    <Text style={[styles.grey, {alignSelf: 'center'}]}>BODY:</Text>
                    <TextInput
                        style={styles.textInput}
                        keyboardType="numeric"
                        maxLength={3}
                        defaultValue={this.props.statusForm.body.toString()}
                        onEndEditing={(event) => this.updateFormValue('body', event.nativeEvent.text)}
                    />
                </View>
                <View flexDirection="row" justifyContent="space-between">
                    <Text style={[styles.grey, {alignSelf: 'center'}]}>PD: </Text>
                    <TextInput
                        style={styles.textInput}
                        keyboardType="numeric"
                        maxLength={3}
                        defaultValue={this.props.statusForm.pd.toString()}
                        onEndEditing={(event) => this.updateFormValue('pd', event.nativeEvent.text)}
                    />
                </View>
                <View flexDirection="row" justifyContent="space-between">
                    <Text style={[styles.grey, {alignSelf: 'center'}]}>ED: </Text>
                    <TextInput
                        style={styles.textInput}
                        keyboardType="numeric"
                        maxLength={3}
                        defaultValue={this.props.statusForm.ed.toString()}
                        onEndEditing={(event) => this.updateFormValue('ed', event.nativeEvent.text)}
                    />
                </View>
            </View>
        );
    }

    _renderFlashControls() {
        return (
            <View flexDirection="row" justifyContent="space-between">
                <Text style={[styles.grey, {alignSelf: 'center'}]}>Segments:</Text>
                <TextInput
                    style={styles.textInput}
                    keyboardType="numeric"
                    maxLength={3}
                    defaultValue={this.props.statusForm.segments.toString()}
                    onEndEditing={(event) => this.updateFormValue('segments', event.nativeEvent.text)}
                />
            </View>
        );
    }

    render() {
        return (
            <Modal
                style={{paddingBottom: verticalScale(Platform.OS === 'ios' ? 200 : 10)}}
                isVisible={this.props.visible}
                onBackButtonPress={() => this.props.onClose()}
                onBackdropPress={() => this.props.onClose()}
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
                                        defaultValue={this.props.statusForm.label}
                                        onEndEditing={(event) => this.updateFormValue('label', event.nativeEvent.text)}
                                    />
                                </View>
                                <View flexDirection="row" justifyContent="space-between">
                                    <Text style={[styles.grey, {alignSelf: 'center'}]}>Status:</Text>
                                    <DropDownPicker
                                        containerStyle={{maxWidth: '75%'}}
                                        theme="DARK"
                                        listMode="MODAL"
                                        open={this.state.open}
                                        value={this.state.value}
                                        items={this.state.items}
                                        setOpen={(open) => this.setState({open})}
                                        setValue={this.setValue}
                                    />
                                </View>
                                {this._renderSecondaryControls()}
                                <View style={{flex: 1, flexDirection: 'row', justifyContent: 'space-around', paddingTop: verticalScale(30)}}>
                                    <Button label="Apply" onPress={() => this._onApply()} />
                                    <Button label="Cancel" style={styles.button} onPress={() => this.props.onClose()} />
                                </View>
                            </View>
                        </VirtualizedList>
                    </View>
                </KeyboardAvoidingView>
            </Modal>
        );
    }
}

export default StatusDialog;
