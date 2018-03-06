import React, { Component }  from 'react';
import { Text, List, ListItem, Left } from 'native-base';
import styles from '../../Styles';

export default class Equipment extends Component {
    render() {
        let items = this.props.equipment.split('|').slice(0, -1);

        if (items.length === 0) {
            return null;
        }

        return (
            <List>
                <ListItem itemDivider style={{backgroundColor: '#375476'}}>
                    <Left>
                        <Text style={styles.boldGrey}>Item</Text>
                    </Left>
                </ListItem>
                {items.map((item, index) => {
                    return (
                        <ListItem key={'equipment-' + index} underlayColor='#3da0ff'>
                            <Left>
                                <Text style={styles.grey}>{item}</Text>
                            </Left>
                        </ListItem>
                    )
                })}
            </List>
        );
    }
}