import React from 'react';
import { PieChart } from 'react-native-svg-charts'
import { Circle, G, Line } from 'react-native-svg'

class Chart {
    renderDieDistribution(distributions) {
        let pieData = [
            {
                value: distributions.one,
                color: '#d2b8fc',
                key: 'pie-1'
            }, {
                value: distributions.two,
                color: '#8b8ee5',
                key: 'pie-2'
            }, {
                value: distributions.three,
                color: '#35a06e',
                key: 'pie-3'
            }, {
                value: distributions.four,
                color: '#668df9',
                key: 'pie-4'
            }, {
                value: distributions.five,
                color: '#ffff89',
                key: 'pie-5'
            }, {
                value: distributions.six,
                color: '#eabb44',
                key: 'pie-6'
            }
        ];

        return <PieChart
                style={{height: 200}}
                data={pieData}
                spacing={0}
                innerRadius={20}
                outerRadius={55}
                labelRadius={80}
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
                   </G>
                )}
               />;
    }
}

export let chart = new Chart();