import React, { Component }  from 'react';
import { StyleSheet, View, Alert, Image } from 'react-native';
import { Container, Content, Button, Text } from 'native-base';
import Slider from 'react-native-slider';
import { dieRoller } from '../../lib/DieRoller';
import styles from '../../Styles';

export default class HitScreen extends Component {
	constructor(props) {
		super(props);

		this.state = {
			value: 0
		}
	}

	_onRollClick() {
		Alert.alert('You rolled ' + dieRoller.rollCheck().total);
	}

	render() {
		return (
			<Container style={styles.container}>
				<Content>
					<View style={styles.logo}>
						<Image source={require('../../../public/hero_logo.png')} />
					</View>
					<View style={localStyles.titleContainer}>
						<Text style={styles.grey}>Total OCV/OMCV:</Text>
						<Text style={styles.grey}>{this.state.value}</Text>
					</View>
					<Slider 
						step={1} 
						minimumValue={-30} 
						maximumValue={30} 
						onValueChange={(value) => this.setState({value: value})} 
						trackStyle={thumbStyles.track}
						thumbStyle={thumbStyles.thumb}
						minimumTrackTintColor='#3da0ff'
					/>
					<Button block onPress={this._onRollClick}>
						<Text>Roll</Text>
					</Button>
				</Content>
			</Container>
		);
	}
}

const localStyles = StyleSheet.create({
	titleContainer: {
		flexDirection: 'row',
		justifyContent: 'space-between',
		alignItems: 'center'
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