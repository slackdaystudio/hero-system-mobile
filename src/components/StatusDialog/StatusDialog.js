import React, { Component, Fragment }  from 'react';
import PropTypes from 'prop-types'
import { Alert, StyleSheet, View, ScrollView, SafeAreaView } from 'react-native';
import { Container, Content, Button, Text, Form, Input, Picker, Item, Label, Icon } from 'native-base';
import Modal from 'react-native-modal';
import { scale, verticalScale } from 'react-native-size-matters';
import { Autocomplete, withKeyboardAwareScrollView } from "react-native-dropdown-autocomplete";
import styles from '../../Styles';
import Heading from '../Heading/Heading';

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
            scrollOffset: 0,
            query: '',
        };

        this.updateFormValue = this._updateFormValue.bind(this);
    }

    _updateFormValue(key, value) {
        if (key === 'activePoints') {
            if (/^(-)?[0-9]*$/.test(value) === false) {
                return;
            }
        } else if (key !== 'name' && key !== 'label' || key !== 'targetTrait') {
            if (/^[0-9]*$/.test(value) === false) {
                return;
            }
        }

        this.props.updateFormValue('status', key, value);
    }

    _searchTraits(query) {
        let matches = [];
        let regex = RegExp(`${this.state.query.trim()}`,'ig');

        for (let characteristic of this.props.character.characteristics) {
            if (characteristic.name.search(regex) >= 0) {
                matches.push({
                    name: characteristic.name,
                    type: 'Characteristic',
                });
            }
        }

        let name = '';

        for (let power of this.props.character.powers) {
            if (power.alias.search(regex) >= 0 || power.name.search(regex) >= 0) {
                if (power.name === null) {
                    name = power.alias;
                } else {
                    name = `${power.name} (${power.alias})`;
                }

                matches.push({
                    name: name,
                    type: 'Power',
                });
            }
        }

        if (matches.length > 0) {
            matches.sort((a, b) => a.name > b.name);
        }

        return matches;
    }

    _handleSelectItem(item, index) {
        let statusForm = {...this.props.statusForm};
        statusForm.targetTrait = item.name;
        statusForm.targetTraitType = item.type;

        this.props.updateForm('status', statusForm);

        this.props.onDropdownClose();
    }

    _renderSecondaryControls() {
        switch(this.props.statusForm.name) {
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

    _renderMatch(matches) {
        if (matches.length > 0) {
            return <Text style={styles.grey}>{matches[0]}</Text>
        }

        return <Text style={styles.grey}>Enter a character trait name</Text>;
    }

    _renderAdjustmentControls() {
        const matches = this._searchTraits();

        return (
            <Fragment>
                <Item inlineLabel style={{marginLeft: 0}}>
                    <Label style={styles.grey}>Active Points:</Label>
                    <Input
                        style={styles.grey}
                        keyboardType='numeric'
                        maxLength={3}
                        value={this.props.statusForm.activePoints.toString()}
                        onChangeText={(value) => this.updateFormValue('activePoints', value)}
                    />
                </Item>
                <Autocomplete
                    placeholder='Search characteristics and powers'
                    handleSelectItem={(item, id) => this._handleSelectItem(item, id)}
                    onDropdownClose={() => this.props.onDropdownClose()}
                    onDropdownShow={() => this.props.onDropdownShow()}
                    data={matches}
                    minimumCharactersCount={1}
                    renderIcon={() => <Icon type='FontAwesome' name="search" style={{position: 'absolute', left: scale(12), top: verticalScale(12), fontSize: verticalScale(12), color: '#e8e8e8'}} />}
                    highlightText
                    highLightColor='yellow'
                    spinnerColor='#e8e8e8'
                    valueExtractor={item => item.name}
                    rightContent
                    rightTextExtractor={item => item.type}
                    inputContainerStyle={[styles.grey, styles.autocompleteInputContainer]}
                    inputStyle={[styles.grey, {borderWidth: 0}]}
                    pickerStyle={{backgroundColor: '#121212'}}
                    scrollStyle={[styles.grey, {borderColor: '#e8e8e8', width: '89%'}]}
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
                        keyboardType='numeric'
                        maxLength={3}
                        value={this.props.statusForm.body.toString()}
                        onChangeText={(value) => this.updateFormValue('body', value)}
                    />
                </Item>
                <Item inlineLabel style={{marginLeft: 0}}>
                    <Label style={styles.grey}>PD:     </Label>
                    <Input
                        style={styles.grey}
                        keyboardType='numeric'
                        maxLength={3}
                        value={this.props.statusForm.pd.toString()}
                        onChangeText={(value) => this.updateFormValue('pd', value)}
                    />
                </Item>
                <Item inlineLabel style={{marginLeft: 0}}>
                    <Label style={styles.grey}>ED:     </Label>
                    <Input
                        style={styles.grey}
                        keyboardType='numeric'
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
                    keyboardType='numeric'
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
                                    label='Status'
                                    style={{width: undefined, color: '#FFFFFF'}}
                                    textStyle={{fontSize: verticalScale(12), color: '#FFFFFF'}}
                                    iosHeader="Select one"
                                    mode="dropdown"
                                    selectedValue={this.props.statusForm.name}
                                    onValueChange={(value) => this.updateFormValue('name', value)}
                                >
                                    {STATUSES.map((status, index) => {
                                        return <Item key={`status-${index}`} label={status} value={status} />
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

export default withKeyboardAwareScrollView(StatusDialog);
