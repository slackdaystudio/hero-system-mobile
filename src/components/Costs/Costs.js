import React, { Component, Fragment }  from 'react';
import PropTypes from 'prop-types';
import { View, Alert } from 'react-native';
import { Text } from 'native-base';
import { costCalculator } from '../../lib/CostCalculator';
import { common } from '../../lib/Common';
import styles from '../../Styles';

export default class Costs extends Component {
    static propTypes = {
        item: PropTypes.object.isRequired,
        parent: PropTypes.object
    };

    constructor(props) {
        super(props);
    }

    render() {
        return (
            <View style={{flex: 1, flexDirection: 'row', justifyContent: 'center'}}>
                <Text style={styles.grey}>
                    <Text style={styles.boldGrey}>Real:</Text> {costCalculator.getRealCost(this.props.item, this.props.parent)}
                </Text>
                <View style={{width: 30, alignItems: 'center'}}><Text style={styles.grey}>—</Text></View>
                <Text style={styles.grey}>
                    <Text style={styles.boldGrey}>Active:</Text> {costCalculator.getActiveCost(this.props.item, this.props.parent)}
                </Text>
            </View>
        );
    }
}