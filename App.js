import React, { Component }  from 'react';
import { AsyncStorage, StyleSheet, Text, View, Button, StatusBar } from 'react-native';
import { DrawerNavigator } from 'react-navigation';
import { Root } from "native-base";
import SplashScreen from 'react-native-splash-screen'
import HomeScreen from './src/components/Screens/HomeScreen';
import ViewCharacterScreen from './src/components/Screens/ViewCharacterScreen';
import RandomCharacterScreen from './src/components/Screens/RandomCharacterScreen';
import ResultScreen from './src/components/Screens/ResultScreen';
import SkillScreen from './src/components/Screens/SkillScreen';
import HitScreen from './src/components/Screens/HitScreen';
import DamageScreen from './src/components/Screens/DamageScreen';
import FreeFormScreen from './src/components/Screens/FreeFormScreen';
import CostCruncherScreen from './src/components/Screens/CostCruncherScreen';
import StatisticsScreen from './src/components/Screens/StatisticsScreen';
import SettingsScreen from './src/components/Screens/SettingsScreen';
import Sidebar from './src/components/Sidebar/Sidebar';
import { statistics } from './src/lib/Statistics';
import { common } from './src/lib/Common';

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
		Skill: {
			screen: SkillScreen
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
		CostCruncher: {
            screen: CostCruncherScreen
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
		let appSettings = await AsyncStorage.getItem('appSettings');

		if (stats === null) {
		    statistics.init();
		}

        if (appSettings === null) {
            await AsyncStorage.setItem('appSettings', JSON.stringify(common.getAppSettings()));
        }

		StatusBar.setHidden(true);
        SplashScreen.hide();
	}

	render() {
		return (
			<Root>
				<RootStack />
			</Root>	
		);
	}
}
