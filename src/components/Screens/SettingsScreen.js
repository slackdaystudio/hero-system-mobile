import React, { Component }  from 'react';
import { StyleSheet, View, AsyncStorage, Alert } from 'react-native';
import { Container, Content, Button, Text, Toast, List, ListItem, Left, Right } from 'native-base';
import Header from '../Header/Header';
import { NORMAL_DAMAGE } from '../../lib/DieRoller';
import styles from '../../Styles';

export default class SettingsScreen extends Component {	
	async _clearFormData() {
		await AsyncStorage.setItem('ocvSliderValue', '0');
		await AsyncStorage.setItem('damageState', JSON.stringify({
			dice: 12,
			partialDie: 0,
			killingToggled: false,
			damageType: NORMAL_DAMAGE,
			stunMultiplier: 0,
			useHitLocations: false,
			isMartialManeuver: false,
			isTargetFlying: false
		}));
		await AsyncStorage.setItem('freeFormState', JSON.stringify({
			dice: 1,
			halfDice: 0,
			pips: 0
		}));
		
		Toast.show({
            text: 'Form data has been cleared',
            position: 'bottom',
            buttonText: 'OK'
        });
	}
	
	render() {
		return (
			<Container style={styles.container}>
			    <Header navigation={this.props.navigation} />
				<Content style={styles.content}>
			    	<Text style={styles.heading}>Settings</Text>
			    	<List>
			    		<ListItem>
					    	<Left>
			        			<Text style={styles.boldGrey}>Clear form data?</Text>
			        		</Left>
			        		<Right>
							    <Button style={localStyles.button} onPress={() => this._clearFormData()}>
									<Text>Clear</Text>
								</Button>
			        		</Right>
		        		</ListItem>
			    	</List>
				</Content>
			</Container>
		);
	}
}

const localStyles = StyleSheet.create({
	button: {
		backgroundColor: '#478f79',
		justifyContent: 'center',
		alignSelf: 'center'
	}
});