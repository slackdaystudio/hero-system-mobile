import React, { Component }  from 'react';
import { StyleSheet, Text, View, Button, StatusBar, Alert } from 'react-native';
import { createAppContainer } from 'react-navigation';
import { createStore, applyMiddleware } from 'redux';
import { addNavigationHelpers, Provider, dispatch, addListener } from 'react-redux';
import SplashScreen from 'react-native-splash-screen'
import thunk from 'redux-thunk';
import { Root } from "native-base";
import { statistics } from './src/lib/Statistics';
import { heroDesignerCharacter } from './src/lib/HeroDesignerCharacter';
import { common } from './src/lib/Common';
import reducer from './src/reducers/index';
import { GET_SHOW_SECONDARY } from './src/reducers/character';
import AppNavigator from './AppNavigator';

export const store = createStore(reducer, applyMiddleware(thunk));

const AppContainer = createAppContainer(AppNavigator);

export default class App extends Component {
	componentWillMount() {
        SplashScreen.hide();
	}

	render() {
		return (
			<Provider store={store}>
				<Root>
					<AppContainer />
				</Root>
			</Provider>
		);
	}
}
