import React, { Component }  from 'react';
import PropTypes from 'prop-types';
import { View } from 'react-native';
import { Text, List, ListItem, Left, Body } from 'native-base';
import styles from '../../Styles';

export default class Characteristics extends Component {
    static propTypes = {
        characteristics: PropTypes.object.isRequired
    }

    render() {
        return (
            <View style={{paddingHorizontal: 5}}>
                <Text style={styles.grey}>Characteristics go here...</Text>
            </View>
        );
    }
}
