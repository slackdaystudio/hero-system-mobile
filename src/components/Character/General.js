import React, { Component }  from 'react';
import PropTypes from 'prop-types';
import { View } from 'react-native';
import { Text, List, ListItem, Left, Body } from 'native-base';
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

export default class General extends Component {
    static propTypes = {
        navigation: PropTypes.object.isRequired,
        character: PropTypes.object.isRequired,
    }

    render() {
        return (
            <List>
                <ListItem>
                    <Left>
                        <Text style={styles.boldGrey}>Name:</Text>
                    </Left>
                    <Body>
                        <Text style={styles.grey}>{this.props.character.name}</Text>
                    </Body>
                </ListItem>
                <ListItem>
                    <Left>
                        <Text style={styles.boldGrey}>Aliases:</Text>
                    </Left>
                    <Body>
                        <Text style={styles.grey}>{this.props.character.aliases}</Text>
                    </Body>
                </ListItem>
                <ListItem>
                    <Left>
                        <Text style={styles.boldGrey}>Player:</Text>
                    </Left>
                    <Body>
                        <Text style={styles.grey}>{this.props.character.playerName}</Text>
                    </Body>
                </ListItem>
                <ListItem>
                    <Left>
                        <Text style={styles.boldGrey}>Height:</Text>
                    </Left>
                    <Body>
                        <Text style={styles.grey}>{this.props.character.appearance.height}</Text>
                    </Body>
                </ListItem>
                <ListItem>
                    <Left>
                        <Text style={styles.boldGrey}>Weight:</Text>
                    </Left>
                    <Body>
                        <Text style={styles.grey}>{this.props.character.appearance.weight}</Text>
                    </Body>
                </ListItem>
                <ListItem>
                    <Left>
                        <Text style={styles.boldGrey}>Eye Color:</Text>
                    </Left>
                    <Body>
                        <Text style={styles.grey}>{this.props.character.appearance.eyeColor}</Text>
                    </Body>
                </ListItem>
                <ListItem>
                    <Left>
                        <Text style={styles.boldGrey}>Hair Color:</Text>
                    </Left>
                    <Body>
                        <Text style={styles.grey}>{this.props.character.appearance.hairColor}</Text>
                    </Body>
                </ListItem>
                <ListItem>
                    <Text style={styles.grey}>
                        <Text style={styles.boldGrey}>Description: </Text>{this.props.character.description}
                    </Text>
                </ListItem>
                <ListItem>
                    <Text style={styles.grey}>
                        <Text style={styles.boldGrey}>Background: </Text>{this.props.character.background}
                    </Text>
                </ListItem>
                <ListItem>
                    <Text style={styles.grey}>
                        <Text style={styles.boldGrey}>Personality: </Text>{this.props.character.personality}
                    </Text>
                </ListItem>
                <ListItem>
                    <Text style={styles.grey}>
                        <Text style={styles.boldGrey}>Quote: </Text>{this.props.character.quote}
                    </Text>
                </ListItem>
                <ListItem>
                    <Text style={styles.grey}>
                        <Text style={styles.boldGrey}>Tactics: </Text>{this.props.character.tactics}
                    </Text>
                </ListItem>
                <ListItem>
                    <Text style={styles.grey}>
                        <Text style={styles.boldGrey}>Campaign Use: </Text>{this.props.character.campaignUse}
                    </Text>
                </ListItem>
                <View style={{paddingBottom: 20}} />
                <ListItem>
                    <Left>
                        <Text style={styles.boldGrey}>Total Experience:</Text>
                    </Left>
                    <Body>
                        <Text style={styles.grey}>{this.props.character.experience.total}</Text>
                    </Body>
                </ListItem>
                <ListItem>
                    <Left>
                        <Text style={styles.boldGrey}>Earned Experience:</Text>
                    </Left>
                    <Body>
                        <Text style={styles.grey}>{this.props.character.experience.earned}</Text>
                    </Body>
                </ListItem>
                <ListItem>
                    <Left>
                        <Text style={styles.boldGrey}>Spent Experience:</Text>
                    </Left>
                    <Body>
                        <Text style={styles.grey}>{this.props.character.experience.spent}</Text>
                    </Body>
                </ListItem>
                <ListItem>
                    <Left>
                        <Text style={styles.boldGrey}>Unspent Experience:</Text>
                    </Left>
                    <Body>
                        <Text style={styles.grey}>{this.props.character.experience.unspent}</Text>
                    </Body>
                </ListItem>
            </List>
        );
    }
}
