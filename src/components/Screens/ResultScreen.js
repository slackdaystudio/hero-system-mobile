import React, { Component }  from 'react';
import { StyleSheet, View, Text, Button, Image, Alert } from 'react-native';
import { dieRoller } from '../../lib/DieRoller';

export default class ResultScreen extends Component {
	_onRollAgainClick() {
		
	}
	
	render() {	
		const result = this.props.navigation.state.params;
		
		return (
			<View style={styles.container}>
				<View style={styles.logo}>
					<Image source={require('../../../public/hero_logo.png')} />
				</View>
				<View style={styles.content}>
					<Text style={styles.heading}>{result.total}</Text>
					<View style={styles.diceRolledContainer}>
						<Text style={styles.diceRolled}>Dice Rolled: </Text>
						<Text style={styles.lightGrey}>{result.rolls.length} ({result.rolls.join(', ')})</Text>
					</View>
					<View style={styles.buttonContainer}>
		    			<Button title='Roll Again' onPress={this._onRollAgainClick} />
		    		</View>
		      	</View>
			</View>
		);
	}
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
		backgroundColor: '#3C6591',
		alignItems: 'center',
		justifyContent: 'space-around',
	},
	heading: {
		fontSize: 75,
		fontWeight: 'bold',
		color: '#D0D1D3'
	},
	logo: {
		flex: 1,
		paddingTop: 15
	},
	content: {
		flex: 5
	},
	diceRolledContainer: {
	    flexDirection: 'row',
	    alignItems: 'center'
	},
	diceRolled: {
		fontWeight: 'bold',
		color: '#D0D1D3'
	},
	lightGrey: {
		color: '#D0D1D3'
	},
	buttonContainer: {
		paddingVertical: 5,
		minWidth: 300,
		minHeight: 50
	}
});