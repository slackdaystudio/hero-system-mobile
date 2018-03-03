import React, { Component }  from 'react';
import { StyleSheet, View, AsyncStorage } from 'react-native';
import { Text } from 'native-base';
import Slider from 'react-native-slider';
import styles from '../../Styles';

export default class MySlider extends Component {
	constructor(props) {
		super(props);
		
		this.onValueChange = this._onValueChange.bind(this);
	}
	
	_onValueChange(value) {
		if (typeof this.props.valueKey === 'string') {
			this.props.onValueChange(this.props.valueKey, value);
		} else {
			this.props.onValueChange(value);
		}
	}
	
	render() {
		return (
			<View>
				<View style={localStyles.titleContainer}>
					<Text style={styles.grey}>{this.props.label}</Text>
					<Text style={styles.grey}>{this.props.value}</Text>
				</View>
				<Slider 
					value={this.props.value} 
					step={this.props.step} 
					minimumValue={this.props.min} 
					maximumValue={this.props.max} 
					onValueChange={(value) => this.onValueChange(value)}
					disabled={this.props.disabled}
					trackStyle={thumbStyles.track}
					thumbStyle={thumbStyles.thumb}
					minimumTrackTintColor='#3da0ff'
				/>
			</View>
		);
	}
}

const localStyles = StyleSheet.create({
	titleContainer: {
		flexDirection: 'row',
		justifyContent: 'space-between',
		alignItems: 'center',
		paddingTop: 10
	},
});

const thumbStyles = StyleSheet.create({
	track: {
		height: 16,
		borderRadius: 10,
	},
	thumb: {
		width: 30,
		height: 30,
		borderRadius: 30 / 2,
		backgroundColor: 'white',
		borderColor: '#3da0ff',
		borderWidth: 2,
	}
});