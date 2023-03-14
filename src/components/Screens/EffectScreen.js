import React, {Component} from 'react';
import PropTypes from 'prop-types';
import {connect} from 'react-redux';
import {View} from 'react-native';
import {Container, Content, List, ListItem, Left, Right, Button, Text, Radio} from 'native-base';
import DropDownPicker from 'react-native-dropdown-picker';
import {verticalScale} from 'react-native-size-matters';
import Slider from '../Slider/Slider';
import Header from '../Header/Header';
import Heading from '../Heading/Heading';
import {dieRoller, PARTIAL_DIE_PLUS_ONE, PARTIAL_DIE_HALF, PARTIAL_DIE_MINUS_ONE} from '../../lib/DieRoller';
import {common as libCommon} from '../../lib/Common';
import styles from '../../Styles';
import {updateFormValue} from '../../reducers/forms';

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

const effectTypes = ['None', 'Aid', 'Dispel', 'Drain', 'Entangle', 'Flash', 'Healing', 'Luck', 'Unluck'];

class EffectScreen extends Component {
    static propTypes = {
        navigation: PropTypes.object.isRequired,
        effectForm: PropTypes.object.isRequired,
        updateFormValue: PropTypes.func.isRequired,
    };

    constructor(props) {
        super(props);

        this.state = {
            open: false,
            value: 0,
            items: [
                {label: 'No partial die', value: 0},
                {label: '+1 pip', value: PARTIAL_DIE_PLUS_ONE},
                {label: '+½ die', value: PARTIAL_DIE_HALF},
                {label: '-1 pip', value: PARTIAL_DIE_MINUS_ONE},
            ],
        };

        this.setSliderState = this._setSliderState.bind(this);
        this.selectEffect = this._selectEffect.bind(this);
        this.roll = this._roll.bind(this);
        this.setOpen = this._setOpen.bind(this);
        this.setValue = this._setValue.bind(this);
    }

    componentDidUpdate(prevProps) {
        if (!libCommon.isEmptyObject(this.props.effectForm)) {
            if (libCommon.isEmptyObject(prevProps.effectForm) || this.props.effectForm.partialDie !== prevProps.effectForm.partialDie) {
                this.setState((state) => ({...state, value: this.props.effectForm.partialDie}));
            }
        }
    }

    _setOpen(open) {
        this.setState((state) => ({
            ...state,
            open: open,
        }));
    }

    _setValue(callback) {
        this.setState((state) => {
            const newState = {...state};

            newState.value = callback(state.value);

            this.props.updateFormValue({formName: 'effect', key: 'partialDie', value: newState.value});

            return state;
        });
    }

    _roll() {
        this.props.navigation.navigate('Result', {
            from: 'Effect',
            result: dieRoller.effectRoll(
                this.props.effectForm.dice,
                this.props.effectForm.partialDie,
                this.props.effectForm.effectType,
                this.props.effectForm.sfx,
            ),
        });
    }

    _selectEffect(effect) {
        this.props.updateFormValue({formName: 'effect', key: 'effectType', value: effect});
    }

    _setSliderState(key, value) {
        this.props.updateFormValue({formName: 'effect', key, value: parseInt(value, 10)});
    }

    _renderEffects() {
        return (
            <List>
                {effectTypes.map((type, index) => {
                    return (
                        <ListItem
                            key={`effect-${index}`}
                            noIndent
                            underlayColor="#1b1d1f"
                            style={{borderBottomWidth: 0, paddingBottom: 0}}
                            onPress={() => this.selectEffect(type)}
                        >
                            <Left>
                                <Text style={styles.grey}>{type}</Text>
                            </Left>
                            <Right>
                                <Radio
                                    color="#14354d"
                                    selectedColor="#14354d"
                                    selected={this.props.effectForm.effectType === type}
                                    onPress={() => this.selectEffect(type)}
                                />
                            </Right>
                        </ListItem>
                    );
                })}
            </List>
        );
    }

    render() {
        return (
            <Container style={styles.container}>
                <Header navigation={this.props.navigation} />
                <Content style={styles.content}>
                    <Heading text="Effect Roll" />
                    <View>
                        <Slider
                            label="Dice:"
                            value={this.props.effectForm.dice}
                            step={1}
                            min={0}
                            max={50}
                            onValueChange={this.setSliderState}
                            valueKey="dice"
                        />
                    </View>
                    <View>
                        <DropDownPicker
                            theme="DARK"
                            listMode="MODAL"
                            open={this.state.open}
                            value={this.state.value}
                            items={this.state.items}
                            setOpen={this.setOpen}
                            setValue={this.setValue}
                        />
                    </View>
                    <Heading text="Effect" />
                    {this._renderEffects()}
                    <View style={{paddingBottom: verticalScale(20)}} />
                    <Button block style={styles.button} onPress={this.roll}>
                        <Text uppercase={false}>Roll</Text>
                    </Button>
                    <View style={{paddingBottom: verticalScale(20)}} />
                </Content>
            </Container>
        );
    }
}

const mapStateToProps = (state) => {
    return {
        effectForm: state.forms.effect,
    };
};

const mapDispatchToProps = {
    updateFormValue,
};

export default connect(mapStateToProps, mapDispatchToProps)(EffectScreen);
