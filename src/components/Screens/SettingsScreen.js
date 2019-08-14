import React, { Component }  from 'react';
import { StyleSheet, View, Switch, Alert } from 'react-native';
import { Container, Content, Button, Text, Toast, List, ListItem, Left, Right, Body, Spinner } from 'native-base';
import AsyncStorage from '@react-native-community/async-storage';
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
			numberOfRolls: 1,
			isAutofire: false,
			targetDcv: 0,
			selectedLocation: -1
		}));
		await AsyncStorage.setItem('damageState', JSON.stringify(common.initDamageForm()));
		await AsyncStorage.setItem('freeFormState', JSON.stringify(common.initFreeFormForm()));

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
                    <Content style={styles.content}>
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
							    <Button style={styles.button} onPress={() => this._clearFormData()}>
									<Text uppercase={false} style={styles.buttonText}>Clear</Text>
								</Button>
			        		</Body>
		        		</ListItem>
			    		<ListItem>
					    	<Left>
			        			<Text style={styles.boldGrey}>Loaded character</Text>
			        		</Left>
			        		<Body>
							    <Button style={styles.button} onPress={() => this._clearCharacterData()}>
									<Text uppercase={false} style={styles.buttonText}>Clear</Text>
								</Button>
			        		</Body>
		        		</ListItem>
			    		<ListItem>
					    	<Left>
			        			<Text style={styles.boldGrey}>H.E.R.O.</Text>
			        		</Left>
			        		<Body>
							    <Button style={styles.button} onPress={() => this._clearHeroData()}>
									<Text uppercase={false} style={styles.buttonText}>Clear</Text>
								</Button>
			        		</Body>
		        		</ListItem>
			    		<ListItem>
					    	<Left>
			        			<Text style={styles.boldGrey}>Statistics</Text>
			        		</Left>
			        		<Body>
							    <Button style={styles.button} onPress={() => this._clearStatisticsData()}>
									<Text uppercase={false} style={styles.buttonText}>Clear</Text>
								</Button>
			        		</Body>
		        		</ListItem>
			    		<ListItem>
					    	<Left>
			        			<Text style={styles.boldGrey}>Use 5th Edition rules?</Text>
			        		</Left>
			        		<Right>
							    <Switch
                                    value={this.state.appSettings.useFifthEdition}
                                    onValueChange={() => this._toggleFifthEdition()}
                                    minimumTrackTintColor='#14354d'
                                    maximumTrackTintColor='#14354d'
                                    thumbTintColor='#14354d'
                                    onTintColor="#01121E"
                                />
			        		</Right>
		        		</ListItem>
			    	</List>
			    	<View style={{paddingTop: 20}}>
                        <Button block style={styles.button} onPress={() => this._clearAll()}>
                            <Text uppercase={false} style={styles.buttonText}>Clear All</Text>
                        </Button>
			    	</View>
				</Content>
			</Container>
		);
	}
}
