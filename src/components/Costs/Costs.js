import React, { Component, Fragment }  from 'react';
import PropTypes from 'prop-types';
import { View, Alert } from 'react-native';
import { Text } from 'native-base';
import styles from '../../Styles';

export default class Costs extends Component {
    static propTypes = {
        item: PropTypes.object.isRequired,
        parent: PropTypes.object
    };

    constructor(props) {
        super(props);

        this.advantages = this._getAdvantages(props.item) + this._getAdvantages(props.parent);
        this.limitations = this._getLimitations(props.item) + this._getLimitations(props.parent);
    }

    _getAdvantages(item) {
        let advantages = 0;

        if (item === null || item === undefined) {
            return advantages;
        }

        if (item.hasOwnProperty('modifier') && item.modifier !== undefined) {
            if (Array.isArray(item.modifier)) {
                for (let modifier of item.modifier) {
                    advantages += modifier.basecost > 0 ? modifier.basecost : 0;
                }
            } else {
                advantages += item.modifier.basecost > 0 ? item.modifier.basecost : 0;
            }
        }

        return advantages;
    }

    _getLimitations(item) {
        let limitations = 0;

        if (item === null || item === undefined) {
            return limitations;
        }

        if (item.hasOwnProperty('modifier') && item.modifier !== undefined) {
            if (Array.isArray(item.modifier)) {
                for (let modifier of item.modifier) {
                    limitations += modifier.basecost < 0 ? modifier.basecost : 0;
                }
            } else {
                limitations += item.modifier.basecost < 0 ? item.modifier.basecost : 0;
            }
        }

        return limitations;
    }

    _getActiveCost() {
        return Math.round(this.props.item.cost * (1 + this.advantages));
        return Math.round(this.props.item.cost * (1 + this.advantages));
    }

    _getRealCost() {
        return Math.round(this._getActiveCost() / (1 - this.limitations));
    }

    render() {
        if (!this.props.item.hasOwnProperty('cost') || this.props.item.cost === 0) {
            return null;
        }

        return (
            <View style={{flex: 1, flexDirection: 'row', justifyContent: 'center'}}>
                <Text style={styles.grey}>
                    <Text style={styles.boldGrey}>Cost:</Text> {this.props.item.cost}
                </Text>
                <View style={{width: 30, alignItems: 'center'}}><Text style={styles.grey}>—</Text></View>
                <Text style={styles.grey}>
                    <Text style={styles.boldGrey}>Real:</Text> {this._getRealCost()}
                </Text>
                <View style={{width: 30, alignItems: 'center'}}><Text style={styles.grey}>—</Text></View>
                <Text style={styles.grey}>
                    <Text style={styles.boldGrey}>Active:</Text> {this._getActiveCost()}
                </Text>
            </View>
        );
    }
}