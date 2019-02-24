import React, { Component }  from 'react';
import PropTypes from 'prop-types'
import { Platform, StyleSheet, View, Image, TouchableHighlight } from 'react-native';
import { Button, Text, Header, Left, Right, Icon } from 'native-base';
import styles from '../../Styles';

export default class Heading extends Component {
	render() {
		return (
            <View style={{flex: 1, maxHeight: 53}}>
                <Text style={styles.heading}>{this.props.text}</Text>
            </View>
		);
	}
}