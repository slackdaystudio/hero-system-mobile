import React, { Component }  from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { BackHandler, StyleSheet, View } from 'react-native';
import { Container, Content, Button, Text, Form, Item, Label, Input } from 'native-base';
import { NavigationEvents } from 'react-navigation';
import Slider from '../Slider/Slider';
import Header from '../Header/Header';
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

class CostCruncherScreen extends Component {
    static propTypes = {
        navigation: PropTypes.object.isRequired,
        costCruncherForm: PropTypes.object.isRequired,
        updateFormValue: PropTypes.func.isRequired,
    }

    constructor(props) {
        super(props);

        this.updateFormValue = this._updateFormValue.bind(this);
    }

    onDidFocus() {
        this.backHandler = BackHandler.addEventListener('hardwareBackPress', () => {
            this.props.navigation.navigate('Home');

            return true;
        });
    }

    onDidBlur() {
        this.backHandler.remove();
    }

    _updateFormValue(key, value) {
        if (key === 'cost') {
            if (/^[0-9]*$/.test(value) === false) {
                return;
            }
        } else if (key === 'advantages' || key === 'limitations') {
            value = parseFloat(value);
        }

        this.props.updateFormValue('costCruncher', key, value);
    }

    _renderActiveCost() {
        return (
            <Text style={[styles.grey, {fontSize: 75}]}>
                {Math.round(this.props.costCruncherForm.cost * (1 + this.props.costCruncherForm.advantages))}
            </Text>
        );
    }

    _renderRealCost() {
        let cost = Math.round(this.props.costCruncherForm.cost * (1 + this.props.costCruncherForm.advantages) / (1 + Math.abs(this.props.costCruncherForm.limitations)));

        return <Text style={[styles.grey, {fontSize: 75}]}>{cost}</Text>;
    }

    render() {
        return (
            <Container style={styles.container}>
                <NavigationEvents
                    onDidFocus={(payload) => this.onDidFocus()}
                    onDidBlur={(payload) => this.onDidBlur()}
                />
                <Header navigation={this.props.navigation} />
                <Content style={styles.content}>
                    <Text style={styles.heading}>Cruncher</Text>
                    <Text style={styles.grey}>Use this tool to calculate power costs on the fly.</Text>
                    <View style={{flexDirection: 'row', justifyContent: 'space-around', alignItems: 'center', paddingTop: 20}}>
                        <Text style={styles.boldGrey}>Active Cost</Text>
                        <Text style={styles.boldGrey}>Real Cost</Text>
                    </View>
                    <View style={{flexDirection: 'row', justifyContent: 'space-around', alignItems: 'center'}}>
                        {this._renderActiveCost()}
                        {this._renderRealCost()}
                    </View>
                    <Form>
                        <Item stackedLabel>
                            <Label style={styles.boldGrey}>Base Cost:</Label>
                            <Input
                                style={styles.grey}
                                keyboardType="numeric"
                                maxLength={3}
                                value={this.props.costCruncherForm.cost.toString()}
                                onChangeText={(text) => this.updateFormValue('cost', text)} />
                        </Item>
                    </Form>
                    <Slider
                        label="Advantages:"
                        value={this.props.costCruncherForm.advantages}
                        step={0.25}
                        min={0}
                        max={5}
                        onValueChange={this.updateFormValue}
                        valueKey="advantages" />
                    <Slider
                        label="Limitations:"
                        value={this.props.costCruncherForm.limitations}
                        step={0.25}
                        min={-5}
                        max={0}
                        onValueChange={this.updateFormValue}
                        valueKey="limitations" />
                </Content>
            </Container>
        );
    }
}

const mapStateToProps = state => {
    return {
        costCruncherForm: state.forms.costCruncher,
    };
};

const mapDispatchToProps = {
    updateFormValue,
};

export default connect(mapStateToProps, mapDispatchToProps)(CostCruncherScreen);
