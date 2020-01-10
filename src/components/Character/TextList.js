import React, { Component }  from 'react';
import PropTypes from 'prop-types';
import { Text, List, ListItem, Left, Right } from 'native-base';
import { dieRoller } from '../../lib/DieRoller';
import { character } from '../../lib/Character';
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

export default class TextList extends Component {
    static propTypes = {
        navigation: PropTypes.object.isRequired,
        text: PropTypes.string.isRequired,
        columnHeading: PropTypes.string.isRequired,
    }

    constructor(props) {
        super(props);

        this.rollCheck = this._rollCheck.bind(this);
        this.onSkillCheckLongPress = this._onSkillCheckLongPress.bind(this);
    }

    _rollCheck(threshold) {
        if (threshold !== '') {
            this.props.navigation.navigate('Result', {from: 'ViewCharacter', result: dieRoller.rollCheck(threshold)});
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
            text.substring(end + 3),
        ];
    }

    render() {
        let items = this.props.text.split('|').slice(0, -1);

        if (items.length === 0) {
            return null;
        }

        return (
            <List>
                <ListItem itemDivider style={{backgroundColor: '#1b1d1f'}}>
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
                        <ListItem key={this.props.columnHeading + '-' + index} underlayColor="#3da0ff" onLongPress={() => this.onSkillCheckLongPress(this.props.columnHeading, lineItem[1].substring(costEndPosition + 1))}>
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
