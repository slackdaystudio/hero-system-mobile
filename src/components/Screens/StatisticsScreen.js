import React, {useCallback, useState} from 'react';
import PropTypes from 'prop-types';
import {useFocusEffect} from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {ActivityIndicator, Text, View} from 'react-native';
import Header from '../Header/Header';
import {VirtualizedList} from '../VirtualizedList/VirtualizedList';
import {Chart} from '../../lib/Chart';
import {common} from '../../lib/Common';
import {statistics as libStatistics} from '../../lib/Statistics';
import styles, {Colors} from '../../Styles';
import {scale, verticalScale} from 'react-native-size-matters';

// CopyView 2018-Present Philip J. Guinchard
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

const MINIMUM_ROLLS_FOR_CHART = 30;

export const StatisticsScreen = ({navigation}) => {
    const [statistics, setStatistics] = useState(null);

    useFocusEffect(
        useCallback(() => {
            _loadStats();

            return () => {};
        }, []),
    );

    const _loadStats = () => {
        AsyncStorage.getItem('statistics')
            .then((s) => {
                setStatistics(JSON.parse(s));
            })
            .catch((error) => {
                console.error(error);
            });
    };

    const renderHitLocationStat = () => {
        const mostFrequentHitLocation = libStatistics.getMostFrequentHitLocation(statistics.totals.hitLocations);

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
        if (statistics.sum === 0 || statistics.totals.diceRolled < MINIMUM_ROLLS_FOR_CHART) {
            return <Text style={[styles.grey, {textAlign: 'center'}]}>A chart appears here once you have rolled at least 30 dice.</Text>;
        }

        return (
            <View>
                <Chart distributions={statistics.distributions} />
            </View>
        );
    };

    if (common.isEmptyObject(statistics)) {
        return (
            <View style={styles.container}>
                <Header hasTabs={false} navigation={navigation} />
                <ActivityIndicator color={Colors.formControl} />
            </View>
        );
    }

    return (
        <>
            <Header navigation={navigation} />
            <Text style={styles.heading}>Statistics</Text>
            <View paddingBottom={verticalScale(10)} />
            <VirtualizedList>
                {renderDieDistributionChart()}
                <View paddingHorizontal={scale(10)} paddingTop={verticalScale(10)}>
                    <View flexDirection="row" justifyContent="space-between">
                        <View>
                            <Text style={styles.boldGrey}>Total Dice Rolled:*</Text>
                        </View>
                        <View>
                            <Text style={styles.grey}>{statistics.totals.diceRolled}</Text>
                        </View>
                    </View>
                    <View flexDirection="row" justifyContent="space-between">
                        <View>
                            <Text style={styles.boldGrey}>Total Face Value:</Text>
                        </View>
                        <View>
                            <Text style={styles.grey}>{statistics.sum}</Text>
                        </View>
                    </View>
                    <View flexDirection="row" justifyContent="space-between">
                        <View>
                            <Text style={styles.boldGrey}>Largest Amount of Dice Rolled:</Text>
                        </View>
                        <View>
                            <Text style={styles.grey}>{statistics.largestDieRoll}</Text>
                        </View>
                    </View>
                    <View flexDirection="row" justifyContent="space-between">
                        <View>
                            <Text style={styles.boldGrey}>Largest Roll:</Text>
                        </View>
                        <View>
                            <Text style={styles.grey}>{statistics.largestSum}</Text>
                        </View>
                    </View>
                    <View flexDirection="row" justifyContent="space-between">
                        <View>
                            <Text style={styles.boldGrey}>Total Skill Checks:</Text>
                        </View>
                        <View>
                            <Text style={styles.grey}>{statistics.totals.skillChecks}</Text>
                        </View>
                    </View>
                    <View flexDirection="row" justifyContent="space-between">
                        <View>
                            <Text style={styles.boldGrey}>Total Rolls To Hit:</Text>
                        </View>
                        <View>
                            <Text style={styles.grey}>{statistics.totals.hitRolls}</Text>
                        </View>
                    </View>
                    <View flexDirection="row" justifyContent="space-between">
                        <View>
                            <Text style={styles.boldGrey}>Total Damage Rolls:</Text>
                        </View>
                        <View>
                            <Text style={styles.grey}>{statistics.totals.normalDamage.rolls + statistics.totals.killingDamage.rolls}</Text>
                        </View>
                    </View>
                    <View flexDirection="row" justifyContent="space-between">
                        <View>
                            <Text style={styles.boldGrey}>Total Effect Rolls:</Text>
                        </View>
                        <View>
                            <Text style={styles.grey}>{statistics.totals.effectRolls}</Text>
                        </View>
                    </View>
                    <View flexDirection="row" justifyContent="space-between">
                        <View>
                            <Text style={styles.boldGrey}>Total Stun:</Text>
                        </View>
                        <View>
                            <Text style={styles.grey}>{statistics.totals.normalDamage.stun + statistics.totals.killingDamage.stun}</Text>
                        </View>
                    </View>
                    <View flexDirection="row" justifyContent="space-between">
                        <View>
                            <Text style={styles.boldGrey}>Total Body:</Text>
                        </View>
                        <View>
                            <Text style={styles.grey}>{statistics.totals.normalDamage.body + statistics.totals.killingDamage.body}</Text>
                        </View>
                    </View>
                    <View flexDirection="row" justifyContent="space-between">
                        <View>
                            <Text style={styles.boldGrey}>Total Knockback:</Text>
                        </View>
                        <View>
                            <Text style={styles.grey}>{statistics.totals.knockback}m</Text>
                        </View>
                    </View>
                    <View flexDirection="row" justifyContent="space-between">
                        <View>
                            <Text style={styles.boldGrey}>Most Frequent Hit Location:</Text>
                        </View>
                        <View>{renderHitLocationStat()}</View>
                    </View>
                    <View flexDirection="row" justifyContent="space-between">
                        <View>
                            <Text style={styles.boldGrey}>Average Roll:</Text>
                        </View>
                        <View>{renderAverageRoll()}</View>
                    </View>
                    <Text style={[styles.grey, {fontStyle: 'italic', paddingBottom: 30, paddingTop: 30}]}>
                        *Does not include hit location or knockback rolls
                    </Text>
                </View>
            </VirtualizedList>
        </>
    );
};

StatisticsScreen.propTypes = {
    navigation: PropTypes.object.isRequired,
};
