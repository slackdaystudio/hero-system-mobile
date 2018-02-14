import React, { Component }  from 'react';
import { StyleSheet, Text, View, Button, Alert } from 'react-native';
import { StackNavigator } from 'react-navigation';
import HomeScreen from './src/components/Screens/HomeScreen';
import HitScreen from './src/components/Screens/HitScreen';

const RootStack = StackNavigator(
		{
			Home: {
				screen: HomeScreen,
			}, 
			Hit: {
				screen: HitScreen
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