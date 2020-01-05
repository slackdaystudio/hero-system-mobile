import React, { Component }  from 'react';
import { connect } from 'react-redux';
import { BackHandler, StyleSheet, View, Switch, Alert } from 'react-native';
import { Container, Content, Button, Text, Toast, List, ListItem, Left, Right, Body, Spinner } from 'native-base';
import { NavigationEvents } from 'react-navigation';
import Header from '../Header/Header';
import { NORMAL_DAMAGE } from '../../lib/DieRoller';
import { statistics } from '../../lib/Statistics';
import { common } from '../../lib/Common';
import { persistence } from '../../lib/Persistence';
import styles from '../../Styles';
import { resetForm } from '../../reducers/forms';
import { clearCharacter } from '../../reducers/character';
import { clearRandomHero } from '../../reducers/randomHero';
import { initializeApplicationSettings, setUseFifthEditionRules } from '../../reducers/settings';
import { clearStatistics } from '../../reducers/statistics';

// Copyright 2020 Philip J. Guinchard
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//    http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

class SettingsScreen extends Component {
    constructor(props) {
        super(props);

        this.state = {
            appSettings: null
        };
    }

    onDidFocus() {
        this.backHandler = BackHandler.addEventListener('hardwareBackPress', () => {
            this.props.navigation.navigate('Home');

            return true;
        });
    }

    onDidBlur() {
        this.backHandler.remove();
    }

	_clearFormData(showToast = true) {
		this.props.resetForm('skill');
		this.props.resetForm('hit');
		this.props.resetForm('damage');
		this.props.resetForm('freeForm');
		this.props.resetForm('costCruncher');

		if (showToast) {
		    common.toast('Form data has been cleared');
		}
	}

	_clearCharacterData(showToast = true) {
        this.props.clearCharacter();

        if (showToast) {
            common.toast('Loaded character has been cleared');
        }
	}

	async _clearHeroData(showToast = true) {
	    this.props.clearRandomHero();

        if (showToast) {
            common.toast('H.E.R.O. character has been cleared');
        }
	}

    async _clearStatisticsData(showToast = true) {
	    this.props.clearStatistics();

        if (showToast) {
            common.toast('Statistical data has been cleared');
        }
    }

    async _clearAll() {
        this.props.initializeApplicationSettings();
        this._clearFormData(false);
        this._clearCharacterData(false);
        this._clearHeroData(false);
        this._clearStatisticsData(false);

        common.toast('Everything has been cleared');
    }

	render() {
		return (
			<Container style={styles.container}>
                <NavigationEvents
                    onDidFocus={(payload) => this.onDidFocus()}
                    onDidBlur={(payload) => this.onDidBlur()}
                />
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
                                    value={this.props.useFifthEdition}
                                    onValueChange={() => this.props.setUseFifthEditionRules(!this.props.useFifthEdition)}
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

const mapStateToProps = state => {
    return {
        forms: state.forms,
        useFifthEdition: state.settings.useFifthEdition
    };
}

const mapDispatchToProps = {
    initializeApplicationSettings,
    setUseFifthEditionRules,
    resetForm,
    clearCharacter,
    clearRandomHero,
    clearStatistics
}

export default connect(mapStateToProps, mapDispatchToProps)(SettingsScreen);