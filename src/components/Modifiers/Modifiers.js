import React, { Component, Fragment }  from 'react';
import PropTypes from 'prop-types';
import { View, Alert } from 'react-native';
import { Text } from 'native-base';
import styles from '../../Styles';

export const TYPE_ADVANTAGES = 0;

export const TYPE_LIMITATIONS = 1;

export default class Modifiers extends Component {
    static propTypes = {
        type: PropTypes.number.isRequired,
        item: PropTypes.object.isRequired,
        parent: PropTypes.object
    };

    constructor(props) {
        super(props);

        this.modifiers = this._getModifiers(props.item).concat(this._getModifiers(props.parent));
    }

    _getModifiers(item) {
        let modifiers = [];

        if (item === null || item === undefined) {
            return modifiers;
        }

        if (item.hasOwnProperty('modifier') && item.modifier !== undefined) {
            if (Array.isArray(item.modifier)) {
                for (let modifier of item.modifier) {
                    if (this.props.type === TYPE_ADVANTAGES && modifier.basecost >= 0) {
                        modifiers.push(this._renderModifier(modifier));
                    } else if (this.props.type === TYPE_LIMITATIONS && modifier.basecost < 0) {
                        modifiers.push(this._renderModifier(modifier));
                    }
                }
            } else {
                if (this.props.type === TYPE_ADVANTAGES && item.modifier.basecost >= 0) {
                    modifiers.push(this._renderModifier(item.modifier));
                } else if (this.props.type === TYPE_LIMITATIONS && item.modifier.basecost < 0) {
                    modifiers.push(this._renderModifier(item.modifier));
                }
            }
        }

        return modifiers;
    }

    _renderBaseCost(baseCost) {
        let cost = baseCost < 0 ? '-' : '+';

        cost += Math.trunc(baseCost) === 0 ? '' : Math.trunc(baseCost);

        switch ((baseCost % 1).toFixed(2)) {
            case '0.25':
            case '-0.25':
                cost += '¼';
                break;
            case '0.50':
            case '-0.50':
                cost += '½';
                break;
            case '0.75':
            case '-0.75':
                cost += '¾';
                break;
        }

        return cost;
    }

    _renderModifier(modifier, adders=[]) {
        let mod = modifier.alias;
        let adderBasecosts = 0;

        if (modifier.hasOwnProperty('optionAlias')) {
            mod += `, ${modifier.optionAlias}`;
        }

        if (modifier.hasOwnProperty('adder')) {
            if (Array.isArray(modifier.adder)) {
                for (let adder of modifier.adder) {
                    adders.push(adder.alias);
                    adderBasecosts += adder.basecost || 0;
                }
            } else {
                adders.push(modifier.adder.alias);
                adderBasecosts += adder.basecost || 0;
            }
        }

        if (modifier.hasOwnProperty('modifier')) {
            // TODO
        }

        if (adders.length > 0) {
            mod += ` (${adders.join()})`;
        }

        mod += `, ${this._renderBaseCost(modifier.basecost + adderBasecosts)}`;

        return mod;
    }

    render() {
        if (this.modifiers.length === 0) {
            return null;
        }

        if (this.modifiers.length > 0) {
            return (
                <View style={{flex: 1}}>
                    <Text style={styles.boldGrey}>{this.props.type === TYPE_LIMITATIONS ? 'Limitations' : 'Advantages'}</Text>
                    {this.modifiers.map((modifier, index) => {
                        return <Text style={styles.grey}> &bull; {modifier}</Text>;
                    })}
                </View>
            );
        }

        return null;
    }
}