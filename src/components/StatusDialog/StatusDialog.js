import React, {Component, Fragment} from 'react';
import PropTypes from 'prop-types';
import {View} from 'react-native';
import {Button, Text, Form, Input, Item, Label} from 'native-base';
import DropDownPicker from 'react-native-dropdown-picker';
import Modal from 'react-native-modal';
import {scale, verticalScale} from 'react-native-size-matters';
import SectionedMultiSelect from 'react-native-sectioned-multi-select';
import Icon from 'react-native-vector-icons/MaterialIcons';
import styles from '../../Styles';

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
            <Fragment>
                <Item inlineLabel style={{marginLeft: 0}}>
                    <Label style={styles.grey}>Active Points:</Label>
                    <Input
                        style={styles.grey}
                        keyboardType="numeric"
                        maxLength={3}
                        value={this.props.statusForm.activePoints.toString()}
                        onChangeText={(value) => this.updateFormValue('activePoints', value)}
                    />
                </Item>
                <SectionedMultiSelect
                    styles={{
                        selectToggleText: [styles.grey, {marginLeft: scale(-7)}],
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
                    searchIconComponent={() => <Icon name="search" color="white" size={18} style={{paddingLeft: scale(5)}} />}
                    uniqueKey="id"
                    subKey="children"
                    selectText="Select affected..."
                    showDropDowns={true}
                    showCancelButton={true}
                    readOnlyHeadings={true}
                    onSelectedItemsChange={(selected) => this._onSelectedItemsChange(selected)}
                    selectedItems={this.state.selectedItems}
                />
            </Fragment>
        );
    }

    _renderEntangleControls() {
        return (
            <View>
                <Item inlineLabel style={{marginLeft: 0}}>
                    <Label style={styles.grey}>BODY:</Label>
                    <Input
                        style={styles.grey}
                        keyboardType="numeric"
                        maxLength={3}
                        value={this.props.statusForm.body.toString()}
                        onChangeText={(value) => this.updateFormValue('body', value)}
                    />
                </Item>
                <Item inlineLabel style={{marginLeft: 0}}>
                    <Label style={styles.grey}>PD: </Label>
                    <Input
                        style={styles.grey}
                        keyboardType="numeric"
                        maxLength={3}
                        value={this.props.statusForm.pd.toString()}
                        onChangeText={(value) => this.updateFormValue('pd', value)}
                    />
                </Item>
                <Item inlineLabel style={{marginLeft: 0}}>
                    <Label style={styles.grey}>ED: </Label>
                    <Input
                        style={styles.grey}
                        keyboardType="numeric"
                        maxLength={3}
                        value={this.props.statusForm.ed.toString()}
                        onChangeText={(value) => this.updateFormValue('ed', value)}
                    />
                </Item>
            </View>
        );
    }

    _renderFlashControls() {
        return (
            <Item inlineLabel style={{marginLeft: 0}}>
                <Label style={styles.grey}>Segments:</Label>
                <Input
                    style={styles.grey}
                    keyboardType="numeric"
                    maxLength={3}
                    value={this.props.statusForm.segments.toString()}
                    onChangeText={(value) => this.updateFormValue('segments', value)}
                />
            </Item>
        );
    }

    render() {
        return (
            <Modal isVisible={this.props.visible} onBackButtonPress={() => this.props.onClose()} onBackdropPress={() => this.props.onClose()}>
                <View style={styles.modal}>
                    <Text style={styles.modalHeader}>Apply Status</Text>
                    <View style={styles.modalContent}>
                        <Form>
                            <Item inlineLabel style={{marginLeft: 0}}>
                                <Label style={styles.grey}>Name:</Label>
                                <Input
                                    style={styles.grey}
                                    maxLength={32}
                                    value={this.props.statusForm.label}
                                    onChangeText={(value) => this.updateFormValue('label', value)}
                                />
                            </Item>
                            <Item inlineLabel style={{marginLeft: 0}}>
                                <Label style={styles.grey}>Status:</Label>
                                <DropDownPicker
                                    containerStyle={{maxWidth: '80%'}}
                                    theme="DARK"
                                    listMode="MODAL"
                                    open={this.state.open}
                                    value={this.state.value}
                                    items={this.state.items}
                                    setOpen={(open) => this.setState({open})}
                                    setValue={this.setValue}
                                />
                            </Item>
                            {this._renderSecondaryControls()}
                        </Form>
                        <View style={{flex: 1, flexDirection: 'row', justifyContent: 'space-around', paddingTop: verticalScale(30)}}>
                            <Button style={styles.button} onPress={() => this._onApply()}>
                                <Text uppercase={false} style={styles.buttonText}>
                                    Apply
                                </Text>
                            </Button>
                            <Button style={styles.button} onPress={() => this.props.onClose()}>
                                <Text uppercase={false} style={styles.buttonText}>
                                    Cancel
                                </Text>
                            </Button>
                        </View>
                    </View>
                </View>
            </Modal>
        );
    }
}

export default StatusDialog;
