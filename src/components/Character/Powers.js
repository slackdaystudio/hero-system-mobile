import React, { Component }  from 'react';
import { Text, List, ListItem, Left, Right } from 'native-base';
import { dieRoller } from '../../lib/DieRoller';
import { character } from '../../lib/Character';
import styles from '../../Styles';

export default class Powers extends Component {
	constructor(props) {
		super(props);

        let items = props.powers.split('|').slice(0, -1);
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

        this.renderPower = this._renderPower.bind(this);
	}

    _toggleFullText(index) {
        let showFullTexts = this.state.showFullTexts;
        showFullTexts[index] = !showFullTexts[index];

        this.setState({showFullTexts: showFullTexts});
    }

    _spliceItem(text) {
        let start = text.indexOf('(');
        let end = text.indexOf(')');

        if (start < end) {
            return ['', text];
        }

        return [
            '    ' + text.slice(0, end + 1),
            text.substring(end + 3)
        ];
    }

    _rollDamage(index) {
        if (character.isAttackPower(this.state.items[index])) {
            this.props.updateForm('damage', character.getDamage(this.state.items[index], this.props.strengthDamage));

            this.props.navigation.navigate('Damage');
        }
    }

    _renderPower(item, index) {
        if (this.state.showFullTexts[index]) {
            item = this.state.items[index];
        }

        let lineItem = this._spliceItem(item);
        let costEndPosition = lineItem[1].indexOf(')');

        return (
            <ListItem key={'power-' + index} underlayColor='#3da0ff' onPress={() => this._toggleFullText(index)} onLongPress={() => this._rollDamage(index)}>
                <Left>
                    <Text style={styles.grey}>{lineItem[0] + ' ' + lineItem[1].substring(costEndPosition + 1)}</Text>
                </Left>
                <Right>
                    <Text style={styles.grey}>{lineItem[1].substring(1, costEndPosition)}</Text>
                </Right>
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
                        <Text style={styles.boldGrey}>Power</Text>
                    </Left>
                    <Right>
                        <Text style={styles.boldGrey}>Cost</Text>
                    </Right>
                </ListItem>
                {this.state.items.map((item, index) => {
                    return character.renderPower(item, index, this.renderPower);
                })}
            </List>
        );
    }
}
