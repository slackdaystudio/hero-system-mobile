import React, { Component }  from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { BackHandler, StyleSheet, View, Image } from 'react-native';
import { Container, Content, List, ListItem, Left, Right, Button, Text, Radio, Picker, Item } from 'native-base';
import RNShake from 'react-native-shake';
import { NavigationEvents } from 'react-navigation';
import Slider from '../Slider/Slider';
import Header from '../Header/Header';
import Heading from '../Heading/Heading';
import { dieRoller, PARTIAL_DIE_PLUS_ONE, PARTIAL_DIE_HALF, PARTIAL_DIE_MINUS_ONE } from '../../lib/DieRoller';
import { common } from '../../lib/Common';
import styles from '../../Styles';
import { updateFormValue } from '../../reducers/forms';

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

const effectTypes = [
    'None',
    'Aid',
    'Dispel',
    'Entangle',
    'Flash',
    'Healing',
    'Luck',
    'Unluck',
];

class EffectScreen extends Component {
    static propTypes = {
        navigation: PropTypes.object.isRequired,
        effectForm: PropTypes.object.isRequired,
        updateFormValue: PropTypes.func.isRequired,
    }

    constructor(props) {
        super(props);

        this.setSliderState = this._setSliderState.bind(this);
        this.updatePartialDie = this._updatePartialDie.bind(this);
        this.selectEffect = this._selectEffect.bind(this);
        this.roll = this._roll.bind(this);
    }

    onDidFocus() {
        this.backHandler = BackHandler.addEventListener('hardwareBackPress', () => {
            this.props.navigation.navigate(this._getBackScreen());

            return true;
        });

        RNShake.addEventListener('ShakeEvent', () => {
            this.roll();
        });
    }

    onDidBlur() {
        RNShake.removeEventListener('ShakeEvent');
        this.backHandler.remove();
    }

    _getBackScreen() {
        let backScreen = 'Home';

        if (this.props.navigation.state.params !== undefined && this.props.navigation.state.params.hasOwnProperty('from')) {
            backScreen = this.props.navigation.state.params.from;
        }

        return backScreen;
    }

    _roll() {
        this.props.navigation.navigate('Result', {
            from: 'Effect',
            result: dieRoller.effectRoll(this.props.effectForm.dice, this.props.effectForm.partialDie, this.props.effectForm.effectType, this.props.effectForm.sfx)
        });
    }

    _selectEffect(effect) {
        this.props.updateFormValue('effect', 'effectType', effect);
    }

    _setSliderState(key, value) {
        this.props.updateFormValue('effect', key, parseInt(value, 10));
    }

    _updatePartialDie(value) {
        this.props.updateFormValue('effect', 'partialDie', parseInt(value));
    }

    _renderEffects() {
        return (
            <List>
                {effectTypes.map((type, index) => {
                    return (
                        <ListItem noIndent underlayColor="#1b1d1f" style={{borderBottomWidth: 0, paddingBottom: 0}} onPress={() => this.selectEffect(type)}>
                            <Left>
                                <Text style={styles.grey}>{type}</Text>
                            </Left>
                            <Right>
                                <Radio
                                    color='#14354d'
                                    selectedColor='#14354d'
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
                <NavigationEvents
                    onDidFocus={(payload) => this.onDidFocus()}
                    onDidBlur={(payload) => this.onDidBlur()}
                />
                <Header navigation={this.props.navigation} backScreen={this._getBackScreen()} />
                <Content style={styles.content}>
                    <Heading text='Effect Roll' />
                    <Slider
                        label="Dice:"
                        value={this.props.effectForm.dice}
                        step={1}
                        min={0}
                        max={50}
                        onValueChange={this.setSliderState}
                        valueKey="dice"
                    />
                    <Picker
                        inlinelabel
                        label='Partial Die'
                        style={{width: undefined, color: '#FFFFFF'}}
                        textStyle={{fontSize: 16, color: '#FFFFFF'}}
                        iosHeader="Select one"
                        mode="dropdown"
                        selectedValue={this.props.effectForm.partialDie}
                        onValueChange={(value) => this.updatePartialDie(value)}
                    >
                        <Item label="No partial die" value={0} />
                        <Item label="+1 pip" value={PARTIAL_DIE_PLUS_ONE} />
                        <Item label="+½ die" value={PARTIAL_DIE_HALF} />
                        <Item label="-1 pip" value={PARTIAL_DIE_MINUS_ONE} />
                    </Picker>
                    <Heading text='Effect' />
                    {this._renderEffects()}
                    <View style={{paddingBottom: 20}} />
                    <Button block style={styles.button}  onPress={this.roll}>
                        <Text uppercase={false}>Roll</Text>
                    </Button>
                    <View style={{paddingBottom: 20}} />
                </Content>
            </Container>
        );
    }
}

const mapStateToProps = state => {
    return {
        effectForm: state.forms.effect,
    };
};

const mapDispatchToProps = {
    updateFormValue,
};

export default connect(mapStateToProps, mapDispatchToProps)(EffectScreen);
