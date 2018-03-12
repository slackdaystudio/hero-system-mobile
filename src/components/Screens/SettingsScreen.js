import React, { Component }  from 'react';
import { StyleSheet, View, AsyncStorage, Switch, Alert } from 'react-native';
import { Container, Content, Button, Text, Toast, List, ListItem, Left, Right, Body, Spinner } from 'native-base';
import Header from '../Header/Header';
import { NORMAL_DAMAGE } from '../../lib/DieRoller';
import { statistics } from '../../lib/Statistics';
import { common } from '../../lib/Common';
import styles from '../../Styles';

export default class SettingsScreen extends Component {
    constructor(props) {
        super(props);

        this.state = {
            appSettings: null
        };
    }

	async componentDidMount() {
        let settings = await common.getAppSettings();

        this.setState({appSettings: settings});
	}

	async _clearFormData(showToast = true) {
		await AsyncStorage.setItem('skillState', JSON.stringify({
		    skillCheck: false,
			value: 8
		}));
		await AsyncStorage.setItem('costCruncherState', JSON.stringify({
		    cost: 5,
			advantages: 0,
			limitations: 0,
        }));
		await AsyncStorage.setItem('ocvSliderValue', JSON.stringify({
			ocv: 0,
			isAutofire: false,
			targetDcv: 0
		}));
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

		if (showToast) {
            Toast.show({
                text: 'Form data has been cleared',
                position: 'bottom',
                buttonText: 'OK'
            });
		}
	}

	async _clearCharacterData(showToast = true) {
	    await AsyncStorage.removeItem('character');
	    await AsyncStorage.removeItem('combat');

        if (showToast) {
            Toast.show({
                text: 'Loaded character has been cleared',
                position: 'bottom',
                buttonText: 'OK'
            });
        }
	}

	async _clearHeroData(showToast = true) {
	    await AsyncStorage.removeItem('hero');

        if (showToast) {
            Toast.show({
                text: 'H.E.R.O. character has been cleared',
                position: 'bottom',
                buttonText: 'OK'
            });
        }
	}

    async _clearStatisticsData(showToast = true) {
	    await AsyncStorage.removeItem('characterFile');
	    statistics.init();

        if (showToast) {
            Toast.show({
                text: 'Statistical data has been cleared',
                position: 'bottom',
                buttonText: 'OK'
            });
        }
    }

    async _clearAll() {
        await AsyncStorage.removeItem('appSettings');
        let defaultAppSettings = await common.getAppSettings();

        await AsyncStorage.setItem('appSettings', JSON.stringify(defaultAppSettings));
        this.setState({appSettings: defaultAppSettings});

        await this._clearFormData(false);
        await this._clearCharacterData(false);
        await this._clearHeroData(false);
        await this._clearStatisticsData(false);

        Toast.show({
            text: 'Everything has been cleared',
            position: 'bottom',
            buttonText: 'OK'
        });
    }

    async _toggleFifthEdition() {
        let newState = {...this.state};
        newState.appSettings.useFifthEdition = !this.state.appSettings.useFifthEdition;

        await AsyncStorage.setItem('appSettings', JSON.stringify(newState.appSettings));

        this.setState({appSettings: newState.appSettings});
    }

	render() {
	    if (this.state.appSettings === null) {
            return (
                <Container>
                    <Header hasTabs={false} navigation={this.props.navigation} />
                    <Content style={{backgroundColor: '#375476', paddingTop: 10}}>
                        <Spinner color='#D0D1D3' />
                    </Content>
                </Container>
            );
	    }

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
			    		<ListItem>
					    	<Left>
			        			<Text style={styles.boldGrey}>Use 5th Edition rules?</Text>
			        		</Left>
			        		<Right>
							    <Switch value={this.state.appSettings.useFifthEdition} onValueChange={() => this._toggleFifthEdition()} color='#3da0ff'/>
			        		</Right>
		        		</ListItem>
			    	</List>
			    	<View style={{paddingTop: 20}}>
                        <Button block style={localStyles.button} onPress={() => this._clearAll()}>
                            <Text uppercase={false}>Clear All</Text>
                        </Button>
			    	</View>
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
