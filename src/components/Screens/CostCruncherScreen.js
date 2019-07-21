import React, { Component }  from 'react';
import { StyleSheet, View } from 'react-native';
import { Container, Content, Button, Text, Form, Item, Label, Input } from 'native-base';
import AsyncStorage from '@react-native-community/async-storage';
import Slider from '../Slider/Slider';
import Header from '../Header/Header';
import styles from '../../Styles';

export default class CostCruncherScreen extends Component {
	constructor(props) {
		super(props);

		this.state = {
		    cost: 5,
			advantages: 0,
			limitations: 0,
		};

		this.updateState = this._updateState.bind(this);
	}

	componentDidMount() {
	    AsyncStorage.getItem('costCruncherState').then((state) => {
	        if (state !== undefined) {
                this.setState(JSON.parse(state));
	        }
	    }).done();
	}

	_updateState(key, value) {
	    if (key === 'cost') {
	        if (/^[0-9]*$/.test(value) === false) {
	            return;
	        }
	    } else if (key === 'advantages' || key === 'limitations') {
	        value = parseFloat(value);
	    }

		let newState = {...this.state};
		newState[key] = value;

		AsyncStorage.setItem('costCruncherState', JSON.stringify(newState));

        this.setState(newState);
	}

    _renderActiveCost() {
        return (
            <Text style={[styles.grey, {fontSize: 75}]}>
                {Math.round(this.state.cost * (1 + this.state.advantages))}
            </Text>
        );
    }

    _renderRealCost() {
        let cost = Math.round(this.state.cost * (1 + this.state.advantages) / (1 + Math.abs(this.state.limitations)));

        return <Text style={[styles.grey, {fontSize: 75}]}>{cost}</Text>;
    }

	render() {
		return (
			<Container style={styles.container}>
			    <Header navigation={this.props.navigation} />
				<Content style={styles.content}>
				    <Text style={styles.heading}>Cruncher</Text>
				    <Text style={styles.grey}>Use this tool to calculate power costs on the fly.</Text>
                    <View style={{flexDirection: 'row', justifyContent: 'space-around', alignItems: 'center', paddingTop: 20}}>
						<Text style={styles.boldGrey}>Active Cost</Text>
                        <Text style={styles.boldGrey}>Real Cost</Text>
			      	</View>
                    <View style={{flexDirection: 'row', justifyContent: 'space-around', alignItems: 'center'}}>
						{this._renderActiveCost()}
                        {this._renderRealCost()}
			      	</View>
			      	<Form>
			      	    <Item stackedLabel>
			      	        <Label style={styles.boldGrey}>Base Cost:</Label>
                            <Input
                                style={styles.grey}
                                keyboardType='numeric'
                                maxLength={3}
                                value={this.state.cost.toString()}
                                onChangeText={(text) => this.updateState('cost', text)} />
			      	    </Item>
					</Form>
					<Slider
						label='Advantages:'
						value={this.state.advantages}
						step={0.25}
						min={0}
						max={5}
						onValueChange={this.updateState}
						valueKey='advantages' />
                    <Slider
						label='Limitations:'
						value={this.state.limitations}
						step={0.25}
						min={-5}
						max={0}
						onValueChange={this.updateState}
						valueKey='limitations' />
				</Content>
			</Container>
		);
	}
}