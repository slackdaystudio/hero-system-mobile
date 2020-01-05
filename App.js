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

// Copyright 2020 Philip J. Guinchard
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//    http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

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
