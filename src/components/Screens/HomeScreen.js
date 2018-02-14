import React, { Component }  from 'react';
import { StyleSheet, View, Text, Button, Image, Alert } from 'react-native';
import { dieRoller } from '../../lib/DieRoller';

export default class HomeScreen extends Component {
	render() {
		return (
			<View style={styles.container}>
				<View style={styles.logo}>
					<Image source={require('../../../public/hero_logo.png')} />
				</View>
				<View style={styles.content}>
					<Text style={styles.heading}>Random Super</Text>
					<View style={styles.buttonContainer}>
		    			<Button title='Randomize!' onPress={() => this.props.navigation.navigate('Hit')} />
		    		</View>						
					<Text style={styles.heading}>Die Rollers</Text>
					<View style={styles.buttonContainer}>
		    			<Button title='3d6' onPress={() => this.props.navigation.navigate('Result', dieRoller.rollCheck())} />
		    		</View>
		    		<View style={styles.buttonContainer}>
		    			<Button title='Hit' onPress={() => this.props.navigation.navigate('Hit')} />
		    		</View>
			    	<View style={styles.buttonContainer}>
		    			<Button title='Damage' onPress={() => this.props.navigation.navigate('Damage')} />
		    		</View>	
			    	<View style={styles.buttonContainer}>
		    			<Button title='Free Form' onPress={() => this.props.navigation.navigate('Free Form')} />
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
		fontSize: 30,
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
	buttonContainer: {
		paddingVertical: 5,
		minWidth: 300,
		minHeight: 50
	}
});