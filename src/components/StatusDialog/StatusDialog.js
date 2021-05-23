import React, { Component, Fragment }  from 'react';
import PropTypes from 'prop-types';
import { View } from 'react-native';
import { Button, Text, Form, Input, Picker, Item, Label } from 'native-base';
import Modal from 'react-native-modal';
import { scale, verticalScale } from 'react-native-size-matters';
import SectionedMultiSelect from 'react-native-sectioned-multi-select';
import Icon from 'react-native-vector-icons/MaterialIcons';
import styles from '../../Styles';

export const STATUSES = [
    'Aid',
    'Drain',
    'Entangle',
    'Flash',
];

class StatusDialog extends Component {
    static propTypes = {
        character: PropTypes.object.isRequired,
        statusForm: PropTypes.object.isRequired,
        updateForm: PropTypes.func.isRequired,
        updateFormValue: PropTypes.func.isRequired,
        visible: PropTypes.bool.isRequired,
        onApply: PropTypes.func.isRequired,
        onClose: PropTypes.func.isRequired,
        onDropdownShow: PropTypes.func.isRequired,
        onDropdownClose: PropTypes.func.isRequired,
    }

    constructor(props) {
        super(props);

        this.state = {
            selectedItems: [],
        };

        this.items = this._getItems();

        this.updateFormValue = this._updateFormValue.bind(this);
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
            }, {
                id: 1,
                name: 'Powers',
                children: [],
            },
        ];

        let id = 1;

        items[0].children = this.props.character.characteristics.map((c) => {
            id++;

            return {
                id: id,
                name: c.name,
            };
        }).slice();

        items[1].children = this.props.character.powers.map((p) => {
            id++;

            return {
                id: id,
                name: p.name,
            };
        }).slice();

        return items;
    }

    _onSelectedItemsChange(selectedItems) {
        this.setState({selectedItems: selectedItems}, () => {
            let statusForm = {...this.props.statusForm};
            let itemLabels = [];

            for (const category of this.items) {
                for (const item of category.children) {
                    if (selectedItems.includes(item.id)) {
                        itemLabels.push(item.name);
                    }
                }
            }

            statusForm.targetTrait = itemLabels.length === 0 ? '' : itemLabels.join(', ');

            this.props.updateForm('status', statusForm);
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
                    styles={{selectToggleText: [styles.grey, {marginLeft: scale(-7)}]}}
                    colors={{selectToggleTextColor: '#FFFFFF', chipColor: '#e8e8e8'}}
                    items={this.items}
                    IconRenderer={Icon}
                    uniqueKey="id"
                    subKey="children"
                    selectText="Select affected..."
                    showDropDowns={true}
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
                    <Label style={styles.grey}>PD:     </Label>
                    <Input
                        style={styles.grey}
                        keyboardType="numeric"
                        maxLength={3}
                        value={this.props.statusForm.pd.toString()}
                        onChangeText={(value) => this.updateFormValue('pd', value)}
                    />
                </Item>
                <Item inlineLabel style={{marginLeft: 0}}>
                    <Label style={styles.grey}>ED:     </Label>
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
            <Modal
                isVisible={this.props.visible}
                onBackButtonPress={() => this.props.onClose()}
                onBackdropPress={() => this.props.onClose()}
            >
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
                                <Picker
                                    inlinelabel
                                    label="Status"
                                    style={{width: undefined, color: '#FFFFFF'}}
                                    textStyle={{fontSize: verticalScale(12), color: '#FFFFFF'}}
                                    iosHeader="Select one"
                                    mode="dropdown"
                                    selectedValue={this.props.statusForm.name}
                                    onValueChange={(value) => this.updateFormValue('name', value)}
                                >
                                    {STATUSES.map((status, index) => {
                                        return <Item key={`status-${index}`} label={status} value={status} />;
                                    })}
                                </Picker>
                            </Item>
                            {this._renderSecondaryControls()}
                        </Form>
                        <View style={{flex: 1, flexDirection: 'row', justifyContent: 'space-around', paddingTop: verticalScale(30)}}>
                            <Button style={styles.button}  onPress={() => this.props.onApply()}>
                                <Text uppercase={false} style={styles.buttonText}>Apply</Text>
                            </Button>
                            <Button style={styles.button}  onPress={() => this.props.onClose()}>
                                <Text uppercase={false} style={styles.buttonText}>Cancel</Text>
                            </Button>
                        </View>
                    </View>
                </View>
            </Modal>
        );
    }
}

export default StatusDialog;
