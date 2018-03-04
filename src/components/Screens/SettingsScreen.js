import React, { Component }  from 'react';
import { StyleSheet, View, AsyncStorage, Alert } from 'react-native';
import { Container, Content, Button, Text, Toast, List, ListItem, Left, Right, Body } from 'native-base';
import Header from '../Header/Header';
import { NORMAL_DAMAGE } from '../../lib/DieRoller';
import { statistics } from '../../lib/Statistics';
import styles from '../../Styles';

export default class SettingsScreen extends Component {	
	async _clearFormData() {
		await AsyncStorage.setItem('skillState', JSON.stringify({
		    skillCheck: false,
			value: 8
		}));
		await AsyncStorage.setItem('costCruncherState', JSON.stringify({
		    cost: 5,
			advantages: 0,
			limitations: 0,
        }));
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

	async _clearCharacterData() {
	    await AsyncStorage.removeItem('character');
	    await AsyncStorage.removeItem('combat');

        Toast.show({
            text: 'Loaded character has been cleared',
            position: 'bottom',
            buttonText: 'OK'
        });
	}

	async _clearHeroData() {
	    await AsyncStorage.removeItem('hero');

        Toast.show({
            text: 'H.E.R.O. character has been cleared',
            position: 'bottom',
            buttonText: 'OK'
        });
	}

    async _clearStatisticsData() {
	    await AsyncStorage.removeItem('characterFile');
	    statistics.init();

        Toast.show({
            text: 'Statistical data has been cleared',
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
			        			<Text style={styles.boldGrey}>Form data</Text>
			        		</Left>
			        		<Body>
							    <Button style={localStyles.button} onPress={() => this._clearFormData()}>
									<Text uppercase={false}>Clear</Text>
								</Button>
			        		</Body>
		        		</ListItem>
			    		<ListItem>
					    	<Left>
			        			<Text style={styles.boldGrey}>Loaded character</Text>
			        		</Left>
			        		<Body>
							    <Button style={localStyles.button} onPress={() => this._clearCharacterData()}>
									<Text uppercase={false}>Clear</Text>
								</Button>
			        		</Body>
		        		</ListItem>
			    		<ListItem>
					    	<Left>
			        			<Text style={styles.boldGrey}>H.E.R.O.</Text>
			        		</Left>
			        		<Body>
							    <Button style={localStyles.button} onPress={() => this._clearHeroData()}>
									<Text uppercase={false}>Clear</Text>
								</Button>
			        		</Body>
		        		</ListItem>
			    		<ListItem>
					    	<Left>
			        			<Text style={styles.boldGrey}>Statistics</Text>
			        		</Left>
			        		<Body>
							    <Button style={localStyles.button} onPress={() => this._clearStatisticsData()}>
									<Text uppercase={false}>Clear</Text>
								</Button>
			        		</Body>
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
