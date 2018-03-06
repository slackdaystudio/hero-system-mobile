import React, { Component }  from 'react';
import { View, TouchableHighlight } from 'react-native';
import { Text, Card, CardItem, Left, Right, Body } from 'native-base';
import { character } from '../../lib/Character';
import { dieRoller } from '../../lib/DieRoller';
import styles from '../../Styles';

export default class Characteristics extends Component {
	constructor(props) {
		super(props);

		this.rollCheck = this._rollCheck.bind(this);
	}

    _rollCheck(threshold) {
        if (threshold !== '') {
            this.props.navigation.navigate('Result', dieRoller.rollCheck(threshold))
        }
    }

    render() {
	    let ignoredCharacteristics = ['comeliness'];

	    if (character.isFifthEdition(this.props.characteristics)) {
	        ignoredCharacteristics = ['ocv', 'dcv', 'omcv', 'dmcv'];
	    }

	    return (
            <View>
                {this.props.characteristics.map((characteristic, index) => {
                    if (ignoredCharacteristics.indexOf(characteristic.name) !== -1) {
                        return null;
                    }

                    return (
                        <TouchableHighlight key={'characteristic-' + index} underlayColor='#3da0ff' onLongPress={() => this.rollCheck(characteristic.roll)}>
                            <Card>
                                <CardItem style={{backgroundColor: '#355882'}}>
                                    <View style={{flex: 1, flexDirection: 'column'}}>
                                        <View style={{flex: 1, flexDirection: 'row'}}>
                                            <Left>
                                                <Text style={styles.boldGrey}>{characteristic.name.toUpperCase()}</Text>
                                            </Left>
                                            <Body>
                                                <Text style={styles.grey}>{characteristic.total}</Text>
                                            </Body>
                                            <Right>
                                                <Text style={styles.grey}>{characteristic.roll}</Text>
                                            </Right>
                                        </View>
                                        <View style={{flex: 1, flexDirection: 'row'}}>
                                            <Left>
                                                <Text style={styles.grey}>{characteristic.notes}</Text>
                                            </Left>
                                            <Right>
                                                <Text style={styles.grey}>Cost: {characteristic.cost}</Text>
                                            </Right>
                                        </View>
                                    </View>
                                </CardItem>
                            </Card>
                        </TouchableHighlight>
                    );
                })}
            </View>
        );
    }
}