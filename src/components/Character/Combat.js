import React, { Component }  from 'react';
import { StyleSheet, AsyncStorage, View } from 'react-native';
import { Text, List, ListItem, Left, Right, Item, Input, Button, Spinner } from 'native-base';
import { character } from '../../lib/Character';
import styles from '../../Styles';

export default class Combat extends Component {
    constructor(props) {
        super(props);

        this.state = {
            character: props.character,
            combat: null
        };

        this.updateCombatState = this._updateCombatState.bind(this);
        this.resetCombatState = this._resetCombatState.bind(this);
        this.takeRecovery = this._takeRecovery.bind(this);
    }

    async componentDidMount() {
        let combat = await AsyncStorage.getItem('combat');

        if (combat === null) {
            this.setState({
                combat: {
                    stun: character.getCharacteristic(this.state.character.characteristics.characteristic, 'stun'),
                    body: character.getCharacteristic(this.state.character.characteristics.characteristic, 'body'),
                    endurance: character.getCharacteristic(this.state.character.characteristics.characteristic, 'endurance')
                }
            });
        } else {
            this.setState({combat: JSON.parse(combat)});
        }
    }

	_updateCombatState(key, value) {
        if (/^(\-)?[0-9]*$/.test(value) === false) {
            return;
        }

		let newState = {...this.state.combat};
		newState[key] = value;

		AsyncStorage.setItem('combat', JSON.stringify(newState));

        this.setState({combat: newState});
	}

	_resetCombatState(key) {
		let newState = {...this.state.combat};
		newState[key] = character.getCharacteristic(this.state.character.characteristics.characteristic, key);

		AsyncStorage.setItem('combat', JSON.stringify(newState));

        this.setState({combat: newState});
	}

    _takeRecovery() {
        let recovery = parseInt(character.getCharacteristic(this.state.character.characteristics.characteristic, 'recovery'), 10);
        let stunMax = parseInt(character.getCharacteristic(this.state.character.characteristics.characteristic, 'stun'), 10);
        let endMax = parseInt(character.getCharacteristic(this.state.character.characteristics.characteristic, 'endurance'), 10);
        let combat = {...this.state.combat};
        let combatStun = parseInt(combat.stun, 10);
        let combatEnd = parseInt(combat.endurance, 10);

        if (combat.stun < stunMax) {
            combat.stun = combatStun + recovery > stunMax ? stunMax : combatStun + recovery;
        }

        if (combat.endurance < endMax) {
            combat.endurance = combatEnd + recovery > endMax ? endMax : combatEnd + recovery;
        }

        AsyncStorage.setItem('combat', JSON.stringify(combat));

        this.setState({combat: combat});
    }

    _renderDefenses() {
        let defenses = character.getDefenses(this.state.character);

        return (
            <List>
                {defenses.map((defense, index) => {
                    return (
                        <ListItem key={'defense-' + index}>
                            <Left>
                                <Text style={styles.boldGrey}>{defense.label}</Text>
                            </Left>
                            <Right>
                                <Text style={styles.grey}>{defense.value}</Text>
                            </Right>
                        </ListItem>
                    );
                })}
            </List>
        );
    }

    render() {
	    if (this.state.combat === null) {
	        return <Spinner color='#D0D1D3' />;
	    }

        return (
            <View>
                <View style={{flex: 1, flexDirection: 'row', justifyContent: 'space-around', alignItems: 'center'}}>
                    <View style={{alignSelf: 'center', width: 50}}>
                        <Text style={styles.boldGrey}>Stun:</Text>
                    </View>
                    <View style={{width: 40}}>
                        <Item>
                            <Input
                                style={styles.grey}
                                keyboardType='numeric'
                                maxLength={3}
                                value={this.state.combat.stun.toString()}
                                onChangeText={(text) => this.updateCombatState('stun', text)} />
                        </Item>
                    </View>
                    <View>
                        <Button style={localStyles.button} onPress={() => this.resetCombatState('stun')}>
                            <Text uppercase={false}>Reset</Text>
                        </Button>
                    </View>
                </View>
                <View style={{flex: 1, flexDirection: 'row', justifyContent: 'space-around', alignItems: 'center'}}>
                    <View style={{alignSelf: 'center', width: 50}}>
                        <Text style={styles.boldGrey}>Body:</Text>
                    </View>
                    <View style={{width: 40}}>
                        <Item>
                            <Input
                                style={styles.grey}
                                keyboardType='numeric'
                                maxLength={3}
                                value={this.state.combat.body.toString()}
                                onChangeText={(text) => this.updateCombatState('body', text)} />
                        </Item>
                    </View>
                    <View>
                        <Button style={localStyles.button} onPress={() => this.resetCombatState('body')}>
                            <Text uppercase={false}>Reset</Text>
                        </Button>
                    </View>
                </View>
                <View style={{flex: 1, flexDirection: 'row', justifyContent: 'space-around', alignItems: 'center'}}>
                    <View style={{alignSelf: 'center', width: 50}}>
                        <Text style={styles.boldGrey}>End:</Text>
                    </View>
                    <View style={{width: 40}}>
                        <Item>
                            <Input
                                style={styles.grey}
                                keyboardType='numeric'
                                maxLength={3}
                                value={this.state.combat.endurance.toString()}
                                onChangeText={(text) => this.updateCombatState('endurance', text)} />
                        </Item>
                    </View>
                    <View>
                        <Button style={localStyles.button} onPress={() => this.resetCombatState('endurance')}>
                            <Text uppercase={false}>Reset</Text>
                        </Button>
                    </View>
                </View>
                <View style={[styles.buttonContainer, {alignSelf: 'center', paddingTop: 10}]}>
                    <Button style={[styles.button, {minWidth: 160}]} onPress={() => this.takeRecovery()}>
                        <Text uppercase={false}>Recovery</Text>
                    </Button>
                </View>
                <View style={{paddingBottom: 20}} />
                <Text style={[styles.boldGrey, {alignSelf: 'center', textDecorationLine: 'underline'}]}>Defenses</Text>
                {this._renderDefenses()}
            </View>
        );
    }
}

const localStyles = StyleSheet.create({
    button: {
        backgroundColor: '#478f79',
        alignSelf: 'flex-end'
    }
});