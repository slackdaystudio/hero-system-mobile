import React, { Component }  from 'react';
import { StyleSheet, Text, View } from 'react-native';

export default class DieRollerListScreen extends Component {
	_onDieRollerClick() {
		Alert.alert('TODO: Transition screens');
	}
	
  render() {
    return (
      <View style={styles.container}>
        <Text>List of die rollers go here...</Text>
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