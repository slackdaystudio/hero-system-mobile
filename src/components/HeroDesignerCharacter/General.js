import React, { Component }  from 'react';
import { View } from 'react-native';
import { Text, List, ListItem, Left, Body } from 'native-base';
import styles from '../../Styles';

export default class General extends Component {
    static propTypes = {
        characterInfo: PropTypes.object.isRequired
    }

    render() {
        return (
            <List>
                <ListItem>
                    <Left>
                        <Text style={styles.boldGrey}>Name:</Text>
                    </Left>
                    <Body>
                        <Text style={styles.grey}>{this.props.characterInfo.characterName}</Text>
                    </Body>
                </ListItem>
                <ListItem>
                    <Left>
                        <Text style={styles.boldGrey}>Aliases:</Text>
                    </Left>
                    <Body>
                        <Text style={styles.grey}>{this.props.characterInfo.alternateIdentities}</Text>
                    </Body>
                </ListItem>
                <ListItem>
                    <Left>
                        <Text style={styles.boldGrey}>Player:</Text>
                    </Left>
                    <Body>
                        <Text style={styles.grey}>{this.props.characterInfo.playerName}</Text>
                    </Body>
                </ListItem>
                <ListItem>
                    <Left>
                        <Text style={styles.boldGrey}>Height:</Text>
                    </Left>
                    <Body>
                        <Text style={styles.grey}>{this.props.characterInfo.height}</Text>
                    </Body>
                </ListItem>
                <ListItem>
                    <Left>
                        <Text style={styles.boldGrey}>Weight:</Text>
                    </Left>
                    <Body>
                        <Text style={styles.grey}>{this.props.characterInfo.weight}</Text>
                    </Body>
                </ListItem>
                <ListItem>
                    <Left>
                        <Text style={styles.boldGrey}>Eye Color:</Text>
                    </Left>
                    <Body>
                        <Text style={styles.grey}>{this.props.characterInfo.eyeColor}</Text>
                    </Body>
                </ListItem>
                <ListItem>
                    <Left>
                        <Text style={styles.boldGrey}>Hair Color:</Text>
                    </Left>
                    <Body>
                        <Text style={styles.grey}>{this.props.characterInfo.hairColor}</Text>
                    </Body>
                </ListItem>
                <ListItem>
                    <Text style={styles.grey}>
                        <Text style={styles.boldGrey}>Description: </Text>{this.props.characterInfo.appearance}
                    </Text>
                </ListItem>
                <ListItem>
                    <Text style={styles.grey}>
                        <Text style={styles.boldGrey}>Background: </Text>{this.props.characterInfo.background}
                    </Text>
                </ListItem>
                <ListItem>
                    <Text style={styles.grey}>
                        <Text style={styles.boldGrey}>Personality: </Text>{this.props.characterInfo.personality}
                    </Text>
                </ListItem>
                <ListItem>
                    <Text style={styles.grey}>
                        <Text style={styles.boldGrey}>Quote: </Text>{this.props.characterInfo.quote}
                    </Text>
                </ListItem>
                <ListItem>
                    <Text style={styles.grey}>
                        <Text style={styles.boldGrey}>Tactics: </Text>{this.props.characterInfo.tactics}
                    </Text>
                </ListItem>
                <ListItem>
                    <Text style={styles.grey}>
                        <Text style={styles.boldGrey}>Campaign Use: </Text>{this.props.characterInfo.campaignUse}
                    </Text>
                </ListItem>
                <View style={{paddingBottom: 20}} />
                </ListItem>
            </List>
        );
    }
}
