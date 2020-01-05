import React, { Component }  from 'react';
import { connect } from 'react-redux';
import {BackHandler, StyleSheet, View, ScrollView } from 'react-native';
import { Container, Content, Text, List, ListItem, Left, Right, Spinner, Tabs, Tab, ScrollableTab } from 'native-base';
import { NavigationEvents } from 'react-navigation';
import Header from '../Header/Header';
import { statistics } from '../../lib/Statistics';
import { chart } from '../../lib/Chart';
import styles from '../../Styles';

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

class StatisticsScreen extends Component {
    constructor(props) {
        super(props);
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

    _renderHitLocationStat() {
        let mostFrequentHitLocation = statistics.getMostFrequentHitLocation(this.props.statistics.totals.hitLocations);

        if (mostFrequentHitLocation.location === '') {
            return <Text style={styles.grey}>-</Text>;
        }

        return <Text style={styles.grey}>{mostFrequentHitLocation.location}</Text>;
    }

    _renderAverageRoll() {
        if (this.props.statistics.totals.diceRolled === 0) {
            return <Text style={styles.grey}>-</Text>;
        }

        return (
            <Text style={styles.grey}>
                {(this.props.statistics.sum / this.props.statistics.totals.diceRolled).toFixed(1)}
            </Text>
        );
    }

    _renderDieDistributionChart() {
        if (this.props.statistics.sum === 0) {
                return null;
        }

        return chart.renderDieDistributionChart(this.props.statistics.distributions);
    }

	render() {
        if (this.props.statistics === null) {
            return (
                <Container style={styles.container}>
                    <Header hasTabs={false} navigation={this.props.navigation} />
                    <Content style={styles.content}>
                        <Spinner color='#D0D1D3' />
                    </Content>
                </Container>
            );
        }

		return (
		  <Container style={styles.container}>
            <NavigationEvents
                onDidFocus={(payload) => this.onDidFocus()}
                onDidBlur={(payload) => this.onDidBlur()}
            />
			<Header navigation={this.props.navigation} />
	        <Content style={styles.content}>
	            <Text style={styles.heading}>Statistics</Text>
                {this._renderDieDistributionChart()}
                <List>
                    <ListItem>
                      <Left>
                        <Text style={styles.boldGrey}>Total Dice Rolled:*</Text>
                      </Left>
                      <Right>
                        <Text style={styles.grey}>{this.props.statistics.totals.diceRolled}</Text>
                      </Right>
                    </ListItem>
                    <ListItem>
                      <Left>
                        <Text style={styles.boldGrey}>Total Face Value:</Text>
                      </Left>
                      <Right>
                        <Text style={styles.grey}>{this.props.statistics.sum}</Text>
                      </Right>
                    </ListItem>
                    <ListItem>
                      <Left>
                        <Text style={styles.boldGrey}>Largest Amount of Dice Rolled:</Text>
                      </Left>
                      <Right>
                        <Text style={styles.grey}>{this.props.statistics.largestDieRoll}</Text>
                      </Right>
                    </ListItem>
                    <ListItem>
                      <Left>
                        <Text style={styles.boldGrey}>Largest Roll:</Text>
                      </Left>
                      <Right>
                        <Text style={styles.grey}>{this.props.statistics.largestSum}</Text>
                      </Right>
                    </ListItem>
                    <ListItem>
                      <Left>
                        <Text style={styles.boldGrey}>Total Skill Checks:</Text>
                      </Left>
                      <Right>
                        <Text style={styles.grey}>{this.props.statistics.totals.skillChecks}</Text>
                      </Right>
                    </ListItem>
                    <ListItem>
                      <Left>
                        <Text style={styles.boldGrey}>Total Rolls To Hit:</Text>
                      </Left>
                      <Right>
                        <Text style={styles.grey}>{this.props.statistics.totals.hitRolls}</Text>
                      </Right>
                    </ListItem>
                    <ListItem>
                      <Left>
                        <Text style={styles.boldGrey}>Total Damage Rolls:</Text>
                      </Left>
                      <Right>
                        <Text style={styles.grey}>{this.props.statistics.totals.normalDamage.rolls + this.props.statistics.totals.killingDamage.rolls}</Text>
                      </Right>
                    </ListItem>
                    <ListItem>
                      <Left>
                        <Text style={styles.boldGrey}>Total Free Form Rolls:</Text>
                      </Left>
                      <Right>
                        <Text style={styles.grey}>{this.props.statistics.totals.freeFormRolls}</Text>
                      </Right>
                    </ListItem>
                    <ListItem>
                      <Left>
                        <Text style={styles.boldGrey}>Total Stun:</Text>
                      </Left>
                      <Right>
                        <Text style={styles.grey}>{this.props.statistics.totals.normalDamage.stun + this.props.statistics.totals.killingDamage.stun}</Text>
                      </Right>
                    </ListItem>
                    <ListItem>
                      <Left>
                        <Text style={styles.boldGrey}>Total Body:</Text>
                      </Left>
                      <Right>
                        <Text style={styles.grey}>{this.props.statistics.totals.normalDamage.body + this.props.statistics.totals.killingDamage.body}</Text>
                      </Right>
                    </ListItem>
                    <ListItem>
                      <Left>
                        <Text style={styles.boldGrey}>Total Knockback:</Text>
                      </Left>
                      <Right>
                        <Text style={styles.grey}>{this.props.statistics.totals.knockback}m</Text>
                      </Right>
                    </ListItem>
                    <ListItem>
                      <Left>
                        <Text style={styles.boldGrey}>Most Frequent Hit Location:</Text>
                      </Left>
                      <Right>
                        {this._renderHitLocationStat()}
                      </Right>
                    </ListItem>
                    <ListItem>
                      <Left>
                        <Text style={styles.boldGrey}>Average Roll:</Text>
                      </Left>
                      <Right>
                        {this._renderAverageRoll()}
                      </Right>
                    </ListItem>
                    <Text style={[styles.grey, {fontStyle: 'italic', paddingBottom: 30, paddingLeft: 30}]}>*Does not include hit location or knockback rolls</Text>
                </List>
	        </Content>
	      </Container>
		);
	}
}

const localStyles = StyleSheet.create({
	tabInactive: {
		backgroundColor: '#3a557f'
	},
	tabActive: {
		backgroundColor: '#476ead'
	},
	tabBarUnderline: {
		backgroundColor: '#3da0ff'
	},
	tabContent: {
		backgroundColor: '#375476'
	},
	pointCostsHeader: {
		alignSelf: 'center',
		textDecorationLine: 'underline'
	}
});

const mapStateToProps = state => {
    return {
        statistics: state.statistics
    };
}

const mapDispatchToProps = {}

export default connect(mapStateToProps, mapDispatchToProps)(StatisticsScreen);