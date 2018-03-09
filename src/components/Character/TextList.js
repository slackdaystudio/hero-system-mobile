import React, { Component }  from 'react';
import { Text, List, ListItem, Left, Right } from 'native-base';
import { dieRoller } from '../../lib/DieRoller';
import { character } from '../../lib/Character';
import styles from '../../Styles';

export default class TextList extends Component {
	constructor(props) {
		super(props);

		this.rollCheck = this._rollCheck.bind(this);
		this.onSkillCheckLongPress = this._onSkillCheckLongPress.bind(this);
	}

    _rollCheck(threshold) {
        if (threshold !== '') {
            this.props.navigation.navigate('Result', dieRoller.rollCheck(threshold))
        }
    }

    _onSkillCheckLongPress(type, item) {
        let matches = item.match(/(\s[0-9]+\-|\([0-9]+\-\))$/);

        if (matches !== null) {
            let match = matches[0].trim();

            if (match.indexOf('(') !== -1) {
                match = match.slice(1, -1);
            }

            this.rollCheck(match);
        }
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

    render() {
        let items = this.props.text.split('|').slice(0, -1);

        if (items.length === 0) {
            return null;
        }

        return (
            <List>
                <ListItem itemDivider style={{backgroundColor: '#375476'}}>
                    <Left>
                        <Text style={styles.boldGrey}>{this.props.columnHeading}</Text>
                    </Left>
                    <Right>
                        <Text style={styles.boldGrey}>Cost</Text>
                    </Right>
                </ListItem>
                {items.map((item, index) => {
                    let lineItem = this._spliceItem(item);
                    let costEndPosition = lineItem[1].indexOf(')');

                    return (
                        <ListItem key={this.props.columnHeading + '-' + index} underlayColor='#3da0ff' onLongPress={() => this.onSkillCheckLongPress(this.props.columnHeading, lineItem[1].substring(costEndPosition + 1))}>
                            <Left>
                                <Text style={styles.grey}>{lineItem[0] + ' ' + lineItem[1].substring(costEndPosition + 1)}</Text>
                            </Left>
                            <Right>
                                <Text style={styles.grey}>{lineItem[1].substring(1, costEndPosition)}</Text>
                            </Right>
                        </ListItem>
                    );
                })}
            </List>
        );
    }
}