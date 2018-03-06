import React, { Component }  from 'react';
import { Text, List, ListItem, Left, Body } from 'native-base';
import styles from '../../Styles';

export default class Movement extends Component {
    _renderUnusualMovement(label, distance) {
        if (distance === '') {
            return null;
        }

        return (
            <ListItem>
                <Left>
                    <Text style={styles.grey}>{label}</Text>
                </Left>
                <Body>
                    <Text style={styles.grey}>{distance}</Text>
                </Body>
            </ListItem>
        );
    }

    render() {
        return (
            <List>
                <ListItem itemDivider style={{backgroundColor: '#375476'}}>
                    <Body><Text style={styles.boldGrey}>Movement</Text></Body>
                </ListItem>
                <ListItem>
                    <Left>
                        <Text style={styles.grey}>Running</Text>
                    </Left>
                    <Body>
                        <Text style={styles.grey}>{this.props.movement.running}</Text>
                    </Body>
                </ListItem>
                <ListItem>
                    <Left>
                        <Text style={styles.grey}>Swimming</Text>
                    </Left>
                    <Body>
                        <Text style={styles.grey}>{this.props.movement.swimming}</Text>
                    </Body>
                </ListItem>
                <ListItem>
                    <Left>
                        <Text style={styles.grey}>Leaping (H)</Text>
                    </Left>
                    <Body>
                        <Text style={styles.grey}>{this.props.movement.leaping.horizontal}</Text>
                    </Body>
                </ListItem>
                <ListItem>
                    <Left>
                        <Text style={styles.grey}>Leaping (V)</Text>
                    </Left>
                    <Body>
                        <Text style={styles.grey}>{this.props.movement.leaping.vertical}</Text>
                    </Body>
                </ListItem>
                {this._renderUnusualMovement('Flight', this.props.movement.flight)}
                {this._renderUnusualMovement('Gliding', this.props.movement.gliding)}
                {this._renderUnusualMovement('Swinging', this.props.movement.swinging)}
                {this._renderUnusualMovement('Teleportation', this.props.movement.teleportation)}
                {this._renderUnusualMovement('Tunneling', this.props.movement.tunneling)}
            </List>
        );
    }
}