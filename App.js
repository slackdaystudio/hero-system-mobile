import React, { Component }  from 'react';
import { AsyncStorage, StyleSheet, Text, View, Button, Alert } from 'react-native';
import { StackNavigator, DrawerNavigator } from 'react-navigation';
import { Root } from "native-base";
import HomeScreen from './src/components/Screens/HomeScreen';
import ViewCharacterScreen from './src/components/Screens/ViewCharacterScreen';
import RandomCharacterScreen from './src/components/Screens/RandomCharacterScreen';
import ResultScreen from './src/components/Screens/ResultScreen';
import HitScreen from './src/components/Screens/HitScreen';
import DamageScreen from './src/components/Screens/DamageScreen';
import FreeFormScreen from './src/components/Screens/FreeFormScreen';
import StatisticsScreen from './src/components/Screens/StatisticsScreen';
import SettingsScreen from './src/components/Screens/SettingsScreen';
import Sidebar from './src/components/Sidebar/Sidebar';
import { statistics } from './src/lib/Statistics';

const RootStack = DrawerNavigator({
		Home: {
			screen: HomeScreen,
		},
		ViewCharacter: {
			screen: ViewCharacterScreen
		},
		RandomCharacter: {
			screen: RandomCharacterScreen
		},
		Result: {
			screen: ResultScreen
		}, 
		Hit: {
			screen: HitScreen
		}, 
		Damage: {
			screen: DamageScreen
		}, 
		FreeForm: {
			screen: FreeFormScreen
		},
		Statistics: {
		    screen: StatisticsScreen
		},
		Settings: {
			screen: SettingsScreen
		}
	}, {
		initialRouteName: 'Home',
		drawerPosition: 'right',
		contentComponent: props => <Sidebar {...props} />
	}
);

export default class App extends Component {
	async componentWillMount() {
		let stats = await AsyncStorage.getItem('statistics');

		if (stats === null) {
		    statistics.init();
		}
	}

	render() {
		return (
			<Root>
				<RootStack />
			</Root>	
		);
	}
}