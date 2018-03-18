import React, { Component }  from 'react';
import { View } from 'react-native';
import { Text } from 'native-base';
import styles from '../../Styles';

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