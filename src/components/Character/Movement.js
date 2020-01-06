import React, { Component }  from 'react';
import { View } from 'react-native';
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

export default class Movement extends Component {
    _renderUnusualMovement(label, distance) {
        if (distance === '') {
            return null;
        }

        return (
            <View style={{flex: 1, flexDirection: 'row', alignSelf: 'stretch', paddingVertical: 5}}>
                <View style={{flex: 1, alignSelf: 'stretch'}}><Text style={styles.grey}>{label}</Text></View>
                <View style={{flex: 1, alignSelf: 'stretch'}}><Text style={styles.grey}>{distance}</Text></View>
            </View>
        );
    }

    render() {
        return (
            <View style={{paddingBottom: 20, paddingHorizontal: 10}}>
                <Text style={styles.subHeading}>Movement</Text>
                <View style={{flex: 1, flexDirection: 'row', alignSelf: 'stretch', paddingVertical: 5}}>
                    <View style={{flex: 1, alignSelf: 'stretch'}}><Text style={styles.grey}>Running</Text></View>
                    <View style={{flex: 1, alignSelf: 'stretch'}}><Text style={styles.grey}>{this.props.movement.running}</Text></View>
                </View>
                <View style={{flex: 1, flexDirection: 'row', alignSelf: 'stretch', paddingVertical: 5}}>
                    <View style={{flex: 1, alignSelf: 'stretch'}}><Text style={styles.grey}>Swimming</Text></View>
                    <View style={{flex: 1, alignSelf: 'stretch'}}><Text style={styles.grey}>{this.props.movement.swimming}</Text></View>
                </View>
                <View style={{flex: 1, flexDirection: 'row', alignSelf: 'stretch', paddingVertical: 5}}>
                    <View style={{flex: 1, alignSelf: 'stretch'}}><Text style={styles.grey}>Leaping (H)</Text></View>
                    <View style={{flex: 1, alignSelf: 'stretch'}}><Text style={styles.grey}>{this.props.movement.leaping.horizontal}</Text></View>
                </View>
                <View style={{flex: 1, flexDirection: 'row', alignSelf: 'stretch', paddingVertical: 5}}>
                    <View style={{flex: 1, alignSelf: 'stretch'}}><Text style={styles.grey}>Leaping (V)</Text></View>
                    <View style={{flex: 1, alignSelf: 'stretch'}}><Text style={styles.grey}>{this.props.movement.leaping.vertical}</Text></View>
                </View>
                {this._renderUnusualMovement('Flight', this.props.movement.flight)}
                {this._renderUnusualMovement('Gliding', this.props.movement.gliding)}
                {this._renderUnusualMovement('Swinging', this.props.movement.swinging)}
                {this._renderUnusualMovement('Teleportation', this.props.movement.teleportation)}
                {this._renderUnusualMovement('Tunneling', this.props.movement.tunneling)}
            </View>
        );
    }
}