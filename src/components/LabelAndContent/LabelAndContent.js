import React, { Component }  from 'react';
import { StyleSheet, View } from 'react-native';
import { Text } from 'native-base';
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

export default class LabelAndContent extends Component {
	render() {
		return (
			<View style={localStyles.lineContainer}>
				<Text style={[styles.boldGrey, localStyles.alignStart]}>{this.props.label}: </Text>
				<Text style={styles.grey}>{this.props.content}</Text>
			</View>			
		);
	}
}

const localStyles = StyleSheet.create({
	lineContainer: {
	    flexDirection: 'row',
	    alignItems: 'center'
	},
	alignStart: {
		alignSelf: 'flex-start'
	}
});