import React, {Component} from 'react';
import PropTypes from 'prop-types';
import {Text, List, ListItem, Left, Right} from 'native-base';
import {character} from '../../lib/Character';
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

function initPowersShow(powers) {
    let items = powers.split('|').slice(0, -1);
    let showFullTexts = [];

    if (items.length >= 1) {
        for (let i = 0; i < items.length; i++) {
            showFullTexts.push(false);
        }
    }

    return {
        showFullTexts: showFullTexts,
        items: items,
    };
}

export default class Powers extends Component {
    static propTypes = {
        navigation: PropTypes.object.isRequired,
        strengthDamage: PropTypes.string.isRequired,
        updateForm: PropTypes.func.isRequired,
    };

    constructor(props) {
        super(props);

        const powersShow = initPowersShow(props.powers);

        this.state = {
            showFullTexts: powersShow.showFullTexts,
            items: powersShow.items,
            powers: props.powers,
        };

        this.renderPower = this._renderPower.bind(this);
    }

    static getDerivedStateFromProps(nextProps, prevState) {
        if (prevState.powers !== nextProps.powers) {
            const equipmentShow = initPowersShow(nextProps.powers);
            let newState = {...prevState};

            newState.showFullTexts = equipmentShow.showFullTexts;
            newState.items = equipmentShow.items;
            newState.powers = nextProps.powers;

            return newState;
        }

        return null;
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

        return ['    ' + text.slice(0, end + 1), text.substring(end + 3)];
    }

    _rollDamage(index) {
        if (character.isAttackPower(this.state.items[index])) {
            this.props.updateForm('damage', character.getDamage(this.state.items[index], this.props.strengthDamage));

            this.props.navigation.navigate('Damage', {from: 'ViewCharacter'});
        }
    }

    _renderPower(item, index) {
        if (this.state.showFullTexts[index]) {
            item = this.state.items[index];
        }

        let lineItem = this._spliceItem(item);
        let costEndPosition = lineItem[1].indexOf(')');

        return (
            <ListItem key={'power-' + index} underlayColor="#3da0ff" onPress={() => this._toggleFullText(index)} onLongPress={() => this._rollDamage(index)}>
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
