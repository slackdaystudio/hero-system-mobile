import React, { Component }  from 'react';
import { View } from 'react-native';
import { Text, List, ListItem, Left, Body } from 'native-base';
import styles from '../../Styles';

export default class General extends Component {
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