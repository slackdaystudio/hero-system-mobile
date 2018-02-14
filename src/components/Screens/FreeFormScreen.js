import React, { Component }  from 'react';
import { StyleSheet, View, Image } from 'react-native';
import { Container, Content, Button, Text } from 'native-base';
import Slider from 'react-native-slider';
import { dieRoller } from '../../lib/DieRoller';
import styles from '../../Styles';

export default class HitScreen extends Component {
	constructor(props) {
		super(props);

		this.state = {
			dice: 1,
			halfDice: 0,
			pips: 0
		}
	}
	
	render() {
		return (
			<Container style={styles.container}>
				<Content>
					<View style={styles.logo}>
						<Image source={require('../../../public/hero_logo.png')} />
					</View>
					<View style={localStyles.titleContainer}>
						<Text style={styles.grey}>Dice:</Text>
						<Text style={styles.grey}>{this.state.dice}</Text>
					</View>
					<Slider 
						value={this.state.dice}
						step={1} 
						minimumValue={0} 
						maximumValue={50} 
						onValueChange={(value) => this.setState({dice: value})} 
						trackStyle={thumbStyles.track}
						thumbStyle={thumbStyles.thumb}
						minimumTrackTintColor='#3da0ff'
					/>
					<View style={localStyles.titleContainer}>
						<Text style={styles.grey}>½ Dice:</Text>
						<Text style={styles.grey}>{this.state.halfDice}</Text>
					</View>
					<Slider 
						step={1} 
						minimumValue={0} 
						maximumValue={50} 
						onValueChange={(value) => this.setState({halfDice: value})} 
						trackStyle={thumbStyles.track}
						thumbStyle={thumbStyles.thumb}
						minimumTrackTintColor='#3da0ff'
					/>
					<View style={localStyles.titleContainer}>
						<Text style={styles.grey}>Pips:</Text>
						<Text style={styles.grey}>{this.state.pips}</Text>
					</View>
					<Slider 
						step={1} 
						minimumValue={0} 
						maximumValue={100} 
						onValueChange={(value) => this.setState({pips: value})} 
						trackStyle={thumbStyles.track}
						thumbStyle={thumbStyles.thumb}
						minimumTrackTintColor='#3da0ff'
					/>
					<Button block onPress={() => this.props.navigation.navigate('Result', dieRoller.freeFormRoll(this.state.dice, this.state.halfDice, this.state.pips))}>
						<Text>Roll</Text>
					</Button>
				</Content>
			</Container>
		);
	}
}

const localStyles = StyleSheet.create({
	titleContainer: {
		flexDirection: 'row',
		justifyContent: 'space-between',
		alignItems: 'center'
	},
});

const thumbStyles = StyleSheet.create({
	track: {
		height: 16,
		borderRadius: 10,
	},
	thumb: {
		width: 30,
		height: 30,
		borderRadius: 30 / 2,
		backgroundColor: 'white',
		borderColor: '#3da0ff',
		borderWidth: 2,
	}
});