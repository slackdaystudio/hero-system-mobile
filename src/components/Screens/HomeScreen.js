import React, { Component }  from 'react';
import { StyleSheet, Text, View, Button, Alert } from 'react-native';

export default class HomeScreen extends Component {
	render() {
		return (
				<View style={styles.container}>
				    <Text>Open up App.js to start working on your app!</Text>
					<Text>Changes you make will automatically reload.</Text>
					<Text>Shake your phone to open the developer menu.</Text>
					<Button title='Die Rollers' onPress={() => this.props.navigation.navigate('DieRollerList')} />
				</View>
		);
	}
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
		backgroundColor: '#fff',
		alignItems: 'center',
		justifyContent: 'center',
	},
});