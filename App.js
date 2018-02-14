import React, { Component }  from 'react';
import { StyleSheet, Text, View, Button, Alert } from 'react-native';
import { StackNavigator } from 'react-navigation';
import HomeScreen from './src/components/Screens/HomeScreen';
import DieRollerListScreen from './src/components/Screens/DieRollerListScreen';

const RootStack = StackNavigator(
		{
			Home: {
				screen: HomeScreen,
			}, 
			DieRollerList: {
				screen: DieRollerListScreen,
			}
		}, {
			initialRouteName: 'Home',
		}
);

export default class App extends Component {
  render() {
    return <RootStack />;
  }
}