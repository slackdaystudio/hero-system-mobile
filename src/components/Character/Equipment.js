import React, { Component }  from 'react';
import { ScrollView, Alert } from 'react-native';
import { Text, List, ListItem, Left, Right, Icon } from 'native-base';
import { character } from '../../lib/Character';
import styles from '../../Styles';

export default class Equipment extends Component {
    constructor(props) {
        super(props);

        let items = props.equipment.split('|').slice(0, -1);
        let showFullTexts = [];

        if (items.length >= 1) {
            for (let i = 0; i < items.length; i++) {
                showFullTexts.push(false);
            }
        }

        this.state = {
            showFullTexts: showFullTexts,
            items: items
        };

        this.renderItem = this._renderItem.bind(this);
    }

    _toggleFullText(index) {
        let showFullTexts = this.state.showFullTexts;
        showFullTexts[index] = !showFullTexts[index];

        this.setState({showFullTexts: showFullTexts});
    }

    _rollDamage(index) {
        if (character.isAttackPower(this.state.items[index])) {
            this.props.updateForm('damage', character.getDamage(this.state.items[index], this.props.strengthDamage));

            this.props.navigation.navigate('Damage', {from: 'ViewCharacter'});
        }
    }

    _renderItem(item, index) {
        if (this.state.showFullTexts[index]) {
            item = this.state.items[index];
        }

        return (
            <ListItem key={'equipment-' + index} underlayColor='#3da0ff' onPress={() => this._toggleFullText(index)} onLongPress={() => this._rollDamage(index)}>
                <Left>
                    <Text style={styles.grey}>{item}</Text>
                </Left>
            </ListItem>
        );
    }

    render() {
        if (this.state.items.length === 0) {
            return null;
        }

        return (
            <List>
                <ListItem itemDivider style={{backgroundColor: '#1b1d1f'}}>
                    <Left>
                        <Text style={styles.boldGrey}>Item</Text>
                    </Left>
                </ListItem>
                {this.state.items.map((item, index) => {
                    return character.renderPower(item, index, this.renderItem);
                })}
            </List>
        );
    }
}