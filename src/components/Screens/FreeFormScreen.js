import React, { Component }  from 'react';
import { connect } from 'react-redux';
import { BackHandler, StyleSheet, View, Image } from 'react-native';
import { Container, Content, Button, Text } from 'native-base';
import RNShake from 'react-native-shake';
import { NavigationEvents } from 'react-navigation';
import Slider from '../Slider/Slider';
import Header from '../Header/Header';
import { dieRoller } from '../../lib/DieRoller';
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

class FreeFormScreen extends Component {
	constructor(props) {
		super(props);

		this.setSliderState = this._setSliderState.bind(this);
		this.roll = this._roll.bind(this);
	}
	
	onDidFocus() {
        this.backHandler = BackHandler.addEventListener('hardwareBackPress', () => {
            if (this.props.navigation.state.params === undefined) {
                this.props.navigation.navigate('Home');
            } else {
                this.props.navigation.navigate(this.props.navigation.state.params.from);
            }

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

    _roll() {
        this.props.navigation.navigate('Result', {from: 'FreeForm', result: dieRoller.freeFormRoll(this.props.freeFormForm.dice, this.props.freeFormForm.halfDice, this.props.freeFormForm.pips)});
    }

	_setSliderState(key, value) {
		this.props.updateFormValue('freeForm', key, parseInt(value, 10));
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
				    <Text style={styles.heading}>Free Form Roll</Text>
					<Slider 
						label='Dice:'
						value={this.props.freeFormForm.dice}
						step={1} 
						min={0} 
						max={50}
						onValueChange={this.setSliderState}
						valueKey='dice' />
					<Slider 
						label='Half Dice:'
						value={this.props.freeFormForm.halfDice}
						step={1} 
						min={0} 
						max={50}
						onValueChange={this.setSliderState}
						valueKey='halfDice' />
					<Slider 
						label='Pips:'
						value={this.props.freeFormForm.pips}
						step={1} 
						min={-50}
						max={50}
						onValueChange={this.setSliderState}
						valueKey='pips' />
					<Button block style={styles.button}  onPress={this.roll}>
						<Text uppercase={false}>Roll</Text>
					</Button>
				</Content>
			</Container>
		);
	}
}

const mapStateToProps = state => {
    return {
        freeFormForm: state.forms.freeForm
    };
}

const mapDispatchToProps = {
    updateFormValue
}

export default connect(mapStateToProps, mapDispatchToProps)(FreeFormScreen);