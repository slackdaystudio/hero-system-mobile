import React, {Component} from 'react';
import PropTypes from 'prop-types';
import {Text, List, ListItem, Left} from 'native-base';
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

function initEquipmentShow(equipment) {
    let items = equipment.split('|').slice(0, -1);
    let showFullTexts = [];

    if (items.length >= 1) {
        for (let i = 0; i < items.length; i++) {
            showFullTexts.push(false);
        }
    }

    return {
        items: items,
        showFullTexts: showFullTexts,
    };
}

export default class Equipment extends Component {
    static propTypes = {
        navigation: PropTypes.object.isRequired,
        equipment: PropTypes.string.isRequired,
        strengthDamage: PropTypes.string.isRequired,
        updateForm: PropTypes.func.isRequired,
    };

    constructor(props) {
        super(props);

        const equipmentShow = initEquipmentShow(props.equipment);

        this.state = {
            showFullTexts: equipmentShow.showFullTexts,
            items: equipmentShow.items,
            equipment: props.equipment,
        };

        this.renderItem = this._renderItem.bind(this);
    }

    static getDerivedStateFromProps(nextProps, prevState) {
        if (prevState.equipment !== nextProps.equipment) {
            const equipmentShow = initEquipmentShow(nextProps.equipment);
            let newState = {...prevState};

            newState.showFullTexts = equipmentShow.showFullTexts;
            newState.items = equipmentShow.items;
            newState.equipment = nextProps.equipment;

            return newState;
        }

        return null;
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
            <ListItem
                key={'equipment-' + index}
                underlayColor="#3da0ff"
                onPress={() => this._toggleFullText(index)}
                onLongPress={() => this._rollDamage(index)}
            >
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
