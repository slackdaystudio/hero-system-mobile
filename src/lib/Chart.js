import React from 'react';
import { StyleSheet, View } from 'react-native';
import { VictoryBar, VictoryChart, VictoryAxis, VictoryTheme } from "victory-native";
import { PieChart, BarChart, YAxis, XAxis  } from 'react-native-svg-charts';
import { Circle, G, Line, Text } from 'react-native-svg';

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

class Chart {
    renderDieDistributionChart(distributions) {
        let pieData = [
            {
                value: distributions.one,
                color: '#d2b8fc',
                key: 'pie-1',
                label: '1'
            }, {
                value: distributions.two,
                color: '#8b8ee5',
                key: 'pie-2',
                label: '2'
            }, {
                value: distributions.three,
                color: '#35a06e',
                key: 'pie-3',
                label: '3'
            }, {
                value: distributions.four,
                color: '#668df9',
                key: 'pie-4',
                label: '4'
            }, {
                value: distributions.five,
                color: '#ffff89',
                key: 'pie-5',
                label: '5'
            }, {
                value: distributions.six,
                color: '#eabb44',
                key: 'pie-6',
                label: '6'
            }
        ];

        return <PieChart
                style={{height: 200}}
                data={pieData}
                spacing={0}
                innerRadius={20}
                outerRadius={55}
                labelRadius={80}
                sort={(a, b) => a.label.localeCompare(b.label)}
                renderDecorator={({item, pieCentroid, labelCentroid, index}) => (
                   <G key={ index }>
                       <Line
                           x1={labelCentroid[0]}
                           y1={labelCentroid[1]}
                           x2={pieCentroid[0]}
                           y2={pieCentroid[1]}
                           stroke={item.color}
                       />
                       <Circle
                           cx={labelCentroid[0]}
                           cy={labelCentroid[1]}
                           r={15}
                           fill={item.color}
                       />
                       <Text
                           stroke="#383834"
                           fontSize="12"
                           x={labelCentroid[0] / 2}
                           y={labelCentroid[1] / 2 + 5}
                           textAnchor="middle"
                        >{item.value}</Text>
                       <Text
                           stroke="#383834"
                           fontSize="12"
                           x={labelCentroid[0]}
                           y={labelCentroid[1] + 5}
                           textAnchor="middle"
                        >{item.label}</Text>
                   </G>
                )}
               />;
    }

    renderHitLocationsChart(hitLocationStats) {
        let data = [];

        for (let property in hitLocationStats) {
            if (hitLocationStats.hasOwnProperty(property)) {
                data.push({location: property, count: hitLocationStats[property]});
            }
        }

        return (
            <View style={styles.container}>
                <VictoryChart width={400} height={200} theme={VictoryTheme.material}>
                    <VictoryAxis style={{tickLabels: {fontSize: 8, paddingTop: 10, angle: 45}}}/>
                    <VictoryBar data={data} x="location" y="count" theme={VictoryTheme.material} />
                </VictoryChart>
            </View>
        )
    }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f5fcff"
  }
});

export let chart = new Chart();