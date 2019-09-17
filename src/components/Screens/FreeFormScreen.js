import React, { Component }  from 'react';
import { StyleSheet, View, Image } from 'react-native';
import { Container, Content, Button, Text } from 'native-base';
import AsyncStorage from '@react-native-community/async-storage';
import RNShake from 'react-native-shake';
import Slider from '../Slider/Slider';
import Header from '../Header/Header';
import { dieRoller } from '../../lib/DieRoller';
import { common } from '../../lib/Common';
import styles from '../../Styles';

export default class HitScreen extends Component {
	constructor(props) {
		super(props);

		this.state = common.initFreeFormForm(props.navigation.state.params);

		this.skipFormLoad = props.navigation.state.params !== undefined ? true : false;

        // So the next screen load doesn't reuse it we manually delete the params (bug in React???)
        delete props.navigation.state.params;

		this.setSliderState = this._setSliderState.bind(this);
		this.roll = this._roll.bind(this);
	}
	
	componentDidMount() {
        RNShake.addEventListener('ShakeEvent', () => {
            this.roll();
        });

        if (!this.skipFormLoad) {
            AsyncStorage.getItem('freeFormState').then((value) => {
                if (value !== undefined) {
                    if (common.compare(this.state, JSON.parse(value))) {
                        this.setState(JSON.parse(value));
                    }
                }
            }).done();
        }
	}

   	componentWillUnmount() {
   		RNShake.removeEventListener('ShakeEvent');
   	}

    _roll() {
        this.props.navigation.navigate('Result', dieRoller.freeFormRoll(this.state.dice, this.state.halfDice, this.state.pips));
    }

	_setSliderState(key, value) {
		let newState = {...this.state};
		newState[key] = parseInt(value, 10);
		
		AsyncStorage.setItem('freeFormState', JSON.stringify(newState));
		
        this.setState(newState);
	}
	
	render() {
		return (
			<Container style={styles.container}>
				<Header navigation={this.props.navigation} />
				<Content style={styles.content}>
				    <Text style={styles.heading}>Free Form Roll</Text>
					<Slider 
						label='Dice:'
						value={this.state.dice} 
						step={1} 
						min={0} 
						max={50}
						onValueChange={this.setSliderState}
						valueKey='dice' />
					<Slider 
						label='Half Dice:'
						value={this.state.halfDice} 
						step={1} 
						min={0} 
						max={50}
						onValueChange={this.setSliderState}
						valueKey='halfDice' />
					<Slider 
						label='Pips:'
						value={this.state.pips} 
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