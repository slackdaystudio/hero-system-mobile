import React from 'react';
import { View } from 'react-native';
import { PieChart, BarChart, YAxis, XAxis  } from 'react-native-svg-charts'
import { Circle, G, Line, Text } from 'react-native-svg'

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
                data.push(hitLocationStats[property]);
            }
        }

        let barData = [
            {
                values: data,
                positive: {
                    fill: '#668df9',
                    // other react-native-svg supported props
                }
            }
        ]

        return (
            <View style={ { height: 250, flexDirection: 'row', backgroundColor: '#FFF', padding: 20 } }>
                <YAxis
                  data={data}
                  contentInset={{top: 20, bottom: 20}}
                  svg={{
                      fill: '#000',
                      fontSize: 10,
                  }}
                  formatLabel={ value => value }
                  style={{paddingLeft: 5}}
                />
                <BarChart
                    style={{flex: 1, marginLeft: 16, backgroundColor: '#FFF'}}
                    data={barData }
                    contentInset={{top: 20, bottom: 20}}
                />
                <XAxis
                    style={{ marginHorizontal: -20 }}
                    data={ data }
                    formatLabel={ (value, index) => value }
                    contentInset={{ left: 70, right: 70 }}
                    svg={{ fontSize: 10 }}
                />
            </View>
        )
    }
}

export let chart = new Chart();