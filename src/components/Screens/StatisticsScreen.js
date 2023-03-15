import React from 'react';
import PropTypes from 'prop-types';
import {useSelector} from 'react-redux';
import {Container, Content, Text, List, ListItem, Left, Right, Spinner} from 'native-base';
import Header from '../Header/Header';
import {chart} from '../../lib/Chart';
import styles from '../../Styles';

// Copyright 2018-Present Philip J. Guinchard
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

export const StatisticsScreen = ({navigation}) => {
    const statistics = useSelector((state) => state.statistics);

    const renderHitLocationStat = () => {
        let mostFrequentHitLocation = statistics.getMostFrequentHitLocation(statistics.totals.hitLocations);

        if (mostFrequentHitLocation.location === '') {
            return <Text style={styles.grey}>-</Text>;
        }

        return <Text style={styles.grey}>{mostFrequentHitLocation.location}</Text>;
    };

    const renderAverageRoll = () => {
        if (statistics.totals.diceRolled === 0) {
            return <Text style={styles.grey}>-</Text>;
        }

        return <Text style={styles.grey}>{(statistics.sum / statistics.totals.diceRolled).toFixed(1)}</Text>;
    };

    const renderDieDistributionChart = () => {
        if (statistics.sum === 0) {
            return null;
        }

        return chart.renderDieDistributionChart(statistics.distributions);
    };

    if (statistics === null) {
        return (
            <Container style={styles.container}>
                <Header hasTabs={false} navigation={navigation} />
                <Content style={styles.content}>
                    <Spinner color="#D0D1D3" />
                </Content>
            </Container>
        );
    }

    return (
        <Container style={styles.container}>
            <Header navigation={navigation} />
            <Content style={styles.content}>
                <Text style={styles.heading}>Statistics</Text>
                {renderDieDistributionChart()}
                <List>
                    <ListItem>
                        <Left>
                            <Text style={styles.boldGrey}>Total Dice Rolled:*</Text>
                        </Left>
                        <Right>
                            <Text style={styles.grey}>{statistics.totals.diceRolled}</Text>
                        </Right>
                    </ListItem>
                    <ListItem>
                        <Left>
                            <Text style={styles.boldGrey}>Total Face Value:</Text>
                        </Left>
                        <Right>
                            <Text style={styles.grey}>{statistics.sum}</Text>
                        </Right>
                    </ListItem>
                    <ListItem>
                        <Left>
                            <Text style={styles.boldGrey}>Largest Amount of Dice Rolled:</Text>
                        </Left>
                        <Right>
                            <Text style={styles.grey}>{statistics.largestDieRoll}</Text>
                        </Right>
                    </ListItem>
                    <ListItem>
                        <Left>
                            <Text style={styles.boldGrey}>Largest Roll:</Text>
                        </Left>
                        <Right>
                            <Text style={styles.grey}>{statistics.largestSum}</Text>
                        </Right>
                    </ListItem>
                    <ListItem>
                        <Left>
                            <Text style={styles.boldGrey}>Total Skill Checks:</Text>
                        </Left>
                        <Right>
                            <Text style={styles.grey}>{statistics.totals.skillChecks}</Text>
                        </Right>
                    </ListItem>
                    <ListItem>
                        <Left>
                            <Text style={styles.boldGrey}>Total Rolls To Hit:</Text>
                        </Left>
                        <Right>
                            <Text style={styles.grey}>{statistics.totals.hitRolls}</Text>
                        </Right>
                    </ListItem>
                    <ListItem>
                        <Left>
                            <Text style={styles.boldGrey}>Total Damage Rolls:</Text>
                        </Left>
                        <Right>
                            <Text style={styles.grey}>{statistics.totals.normalDamage.rolls + statistics.totals.killingDamage.rolls}</Text>
                        </Right>
                    </ListItem>
                    <ListItem>
                        <Left>
                            <Text style={styles.boldGrey}>Total Effect Rolls:</Text>
                        </Left>
                        <Right>
                            <Text style={styles.grey}>{statistics.totals.effectRolls}</Text>
                        </Right>
                    </ListItem>
                    <ListItem>
                        <Left>
                            <Text style={styles.boldGrey}>Total Stun:</Text>
                        </Left>
                        <Right>
                            <Text style={styles.grey}>{statistics.totals.normalDamage.stun + statistics.totals.killingDamage.stun}</Text>
                        </Right>
                    </ListItem>
                    <ListItem>
                        <Left>
                            <Text style={styles.boldGrey}>Total Body:</Text>
                        </Left>
                        <Right>
                            <Text style={styles.grey}>{statistics.totals.normalDamage.body + statistics.totals.killingDamage.body}</Text>
                        </Right>
                    </ListItem>
                    <ListItem>
                        <Left>
                            <Text style={styles.boldGrey}>Total Knockback:</Text>
                        </Left>
                        <Right>
                            <Text style={styles.grey}>{statistics.totals.knockback}m</Text>
                        </Right>
                    </ListItem>
                    <ListItem>
                        <Left>
                            <Text style={styles.boldGrey}>Most Frequent Hit Location:</Text>
                        </Left>
                        <Right>{renderHitLocationStat()}</Right>
                    </ListItem>
                    <ListItem>
                        <Left>
                            <Text style={styles.boldGrey}>Average Roll:</Text>
                        </Left>
                        <Right>{renderAverageRoll()}</Right>
                    </ListItem>
                    <Text style={[styles.grey, {fontStyle: 'italic', paddingBottom: 30, paddingLeft: 30}]}>
                        *Does not include hit location or knockback rolls
                    </Text>
                </List>
            </Content>
        </Container>
    );
};

StatisticsScreen.propTypes = {
    navigation: PropTypes.object.isRequired,
};
