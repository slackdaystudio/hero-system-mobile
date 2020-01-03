import React, { Component }  from 'react';
import { StyleSheet, Text, View, Button, StatusBar, Alert } from 'react-native';
import { DrawerNavigator } from 'react-navigation';
import { createStore, applyMiddleware } from 'redux';
import { Provider } from 'react-redux';
import thunk from 'redux-thunk';
import { Root } from "native-base";
import SplashScreen from 'react-native-splash-screen'
import HomeScreen from './src/components/Screens/HomeScreen';
import ViewCharacterScreen from './src/components/Screens/ViewCharacterScreen';
import ViewHeroDesignerCharacterScreen from './src/components/Screens/ViewHeroDesignerCharacterScreen';
import RandomCharacterScreen from './src/components/Screens/RandomCharacterScreen';
import PdfViewerScreen from './src/components/Screens/PdfViewerScreen';
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
import { heroDesignerCharacter } from './src/lib/HeroDesignerCharacter';
import { common } from './src/lib/Common';
import reducer from './src/reducers/index';
import { GET_SHOW_SECONDARY } from './src/reducers/character';

const RootStack = DrawerNavigator({
		Home: {
			screen: HomeScreen,
		},
		ViewCharacter: {
			screen: ViewCharacterScreen
		},
		ViewHeroDesignerCharacter: {
			screen: ViewHeroDesignerCharacterScreen
		},
		RandomCharacter: {
			screen: RandomCharacterScreen
		},
		PdfViewer: {
			screen: PdfViewerScreen
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

export const store = createStore(reducer, applyMiddleware(thunk));

export default class App extends Component {
	componentWillMount() {
        SplashScreen.hide();
	}

	render() {
		return (
			<Provider store={store}>
				<Root>
					<RootStack />
				</Root>
			</Provider>
		);
	}
}
