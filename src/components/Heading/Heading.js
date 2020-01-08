import React, { Component }  from 'react';
import PropTypes from 'prop-types';
import { Platform, StyleSheet, View, Image, TouchableHighlight } from 'react-native';
import { Button, Text, Header, Left, Right, Icon } from 'native-base';
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

export default class Heading extends Component {
    static propTypes = {
        navigation: PropTypes.object.isRequired,
        text: PropTypes.string.isRequired,
    }

    render() {
        return (
            <View style={{flex: 1, maxHeight: 53, paddingBottom: 10}}>
                <Text style={styles.heading}>{this.props.text}</Text>
            </View>
        );
    }
}
