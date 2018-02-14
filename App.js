import React, { Component }  from 'react';
import { StyleSheet, Text, View, Button, Alert } from 'react-native';
import Expo from 'expo';
import { StackNavigator } from 'react-navigation';
import HomeScreen from './src/components/Screens/HomeScreen';
import ResultScreen from './src/components/Screens/ResultScreen';
import HitScreen from './src/components/Screens/HitScreen';
import FreeFormScreen from './src/components/Screens/FreeFormScreen';

const RootStack = StackNavigator({
		Home: {
			screen: HomeScreen,
		},
		Result: {
			screen: ResultScreen
		}, 
		Hit: {
			screen: HitScreen
		}, 
		FreeForm: {
			screen: FreeFormScreen
		}
	}, {
		initialRouteName: 'Home'
	}
);

export default class App extends Component {
	constructor(props) {
		super(props);

		this.state = {
			fontsLoaded: false
		}
	}
	
	async componentWillMount() {
		await Expo.Font.loadAsync({
			'Roboto': require('native-base/Fonts/Roboto.ttf'),
			'Roboto_medium': require('native-base/Fonts/Roboto_medium.ttf'),
		});

		this.setState({
			fontsLoaded: true
		});
	}

	render() {
		if (!this.state.fontsLoaded) {
			return <Expo.AppLoading />;
		}

		return <RootStack />;
	}
}