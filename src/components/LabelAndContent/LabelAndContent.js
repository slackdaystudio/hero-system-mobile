import React, { Component }  from 'react';
import { StyleSheet, View } from 'react-native';
import { Text } from 'native-base';
import styles from '../../Styles';

export default class LabelAndContent extends Component {
	render() {
		return (
			<View style={localStyles.lineContainer}>
				<Text style={[styles.boldGrey, localStyles.alignStart]}>{this.props.label}: </Text>
				<Text style={styles.grey}>{this.props.content}</Text>
			</View>			
		);
	}
}

const localStyles = StyleSheet.create({
	lineContainer: {
	    flexDirection: 'row',
	    alignItems: 'center'
	},
	alignStart: {
		alignSelf: 'flex-start'
	}
});