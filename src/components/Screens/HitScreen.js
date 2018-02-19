import React, { Component }  from 'react';
import { StyleSheet, View, Image, AsyncStorage } from 'react-native';
import { Container, Content, Button, Text } from 'native-base';
import Slider from '../Slider/Slider';
import Header from '../Header/Header';
import { dieRoller } from '../../lib/DieRoller';
import styles from '../../Styles';

export default class HitScreen extends Component {
	constructor(props) {
		super(props);
		
		this.state = {
			value: 0
		}
		
		this.updateSliderValue = this._updateSliderValue.bind(this);
	}
		
	
	componentDidMount() {
	    AsyncStorage.getItem('ocvSliderValue').then((value) => {
	        this.setState({value: value ? parseInt(value, 10) : 0});
	    }).done();
	}
	
	_updateSliderValue(value) {
		AsyncStorage.setItem('ocvSliderValue', String(value));
		
        this.setState({value: value});
	}
	
	render() {
		return (
			<Container style={styles.container}>
			    <Header navigation={this.props.navigation} />
				<Content style={styles.content}>
				    <Text style={styles.heading}>Roll To Hit</Text>
					<Slider 
						label='Total OCVOMCV:' 
						value={this.state.value} 
						step={1} 
						min={-30} 
						max={30}
						onValueChange={this.updateSliderValue} />
					<Button block style={styles.button} onPress={() => this.props.navigation.navigate('Result', dieRoller.rollToHit(this.state.value))}>
						<Text>Roll</Text>
					</Button>
				</Content>
			</Container>
		);
	}
}